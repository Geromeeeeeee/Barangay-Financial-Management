<?php
session_start();
require_once '../../header.php';
require_once '../../classes/budget.php';

if (!isset($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentication required.']);
    exit();
}

$allowedRoles = ['staff', 'treasurer'];
if (!in_array(strtolower((string)($_SESSION['role'] ?? '')), $allowedRoles, true)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'You are not authorized to view reports.']);
    exit();
}

$month = (int)($_GET['month'] ?? date('m'));
$year = (int)($_GET['year'] ?? date('Y'));

try {
    if ($month < 1 || $month > 12 || $year < 1) {
        throw new InvalidArgumentException('Invalid reporting period.');
    }

    $annualIncome = Budget::income($pdo);

    $stmt = $pdo->prepare("
        SELECT source, SUM(amount) AS total_amount, COUNT(*) AS entry_count
        FROM revenues
        WHERE record_type = 'annual_budget' AND YEAR(created_at) = :year
        GROUP BY source
        ORDER BY total_amount DESC
    ");
    $stmt->execute(['year' => $year]);
    $annualRevenues = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare("
        SELECT id, receipt_date, source, amount
        FROM revenues
        WHERE record_type = 'monthly_receipt'
          AND MONTH(receipt_date) = :month AND YEAR(receipt_date) = :year
        ORDER BY receipt_date, id
    ");
    $stmt->execute(['month' => $month, 'year' => $year]);
    $monthlyReceipts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare("
        SELECT a.id, a.revenue_id, a.subcategory_id, a.amount, a.allocation_date,
               r.receipt_date, r.source AS receipt_source,
               c.name AS category_name, s.name AS subcategory_name
        FROM monthly_subcategory_allocations a
        JOIN revenues r ON r.id = a.revenue_id
        JOIN budget_subcategories s ON s.id = a.subcategory_id
        JOIN budget_categories c ON c.id = s.category_id
        WHERE r.record_type = 'monthly_receipt'
          AND MONTH(a.allocation_date) = :month AND YEAR(a.allocation_date) = :year
        ORDER BY a.allocation_date, a.id
    ");
    $stmt->execute(['month' => $month, 'year' => $year]);
    $monthlyAllocations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare("
        SELECT r.id, r.receipt_date, r.source, r.amount,
               COALESCE(SUM(a.amount), 0) AS allocated_amount,
               r.amount - COALESCE(SUM(a.amount), 0) AS unallocated_amount
        FROM revenues r
        LEFT JOIN monthly_subcategory_allocations a ON a.revenue_id = r.id
        WHERE r.record_type = 'monthly_receipt' AND YEAR(r.receipt_date) = :year
        GROUP BY r.id, r.receipt_date, r.source, r.amount
        ORDER BY r.receipt_date, r.id
    ");
    $stmt->execute(['year' => $year]);
    $receiptBalances = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare("
        SELECT COALESCE(c.name, 'Uncategorized') AS category_name,
               COALESCE(s.name, 'No budget item') AS subcategory_name,
               SUM(e.amount) AS total_amount, COUNT(*) AS entry_count,
               SUM(CASE WHEN e.monthly_allocation_id IS NOT NULL THEN e.amount ELSE 0 END) AS monthly_linked_amount,
               SUM(CASE WHEN e.monthly_allocation_id IS NULL THEN e.amount ELSE 0 END) AS legacy_amount
        FROM expenditures e
        LEFT JOIN budget_categories c ON c.id = e.category_id
        LEFT JOIN budget_subcategories s ON s.id = e.subcategory_id
        WHERE MONTH(e.created_at) = :month AND YEAR(e.created_at) = :year
        GROUP BY c.name, s.name
        ORDER BY total_amount DESC
    ");
    $stmt->execute(['month' => $month, 'year' => $year]);
    $expenditureBreakdown = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare("
        SELECT e.id, e.created_at, e.description, e.amount, e.monthly_allocation_id,
               COALESCE(c.name, 'Uncategorized') AS category_name,
               COALESCE(s.name, 'No budget item') AS subcategory_name,
               a.amount AS allocation_amount, a.allocation_date,
               r.source AS receipt_source, r.receipt_date
        FROM expenditures e
        LEFT JOIN monthly_subcategory_allocations a ON a.id = e.monthly_allocation_id
        LEFT JOIN revenues r ON r.id = a.revenue_id
        LEFT JOIN budget_categories c ON c.id = e.category_id
        LEFT JOIN budget_subcategories s ON s.id = e.subcategory_id
        WHERE MONTH(e.created_at) = :month AND YEAR(e.created_at) = :year
        ORDER BY e.created_at, e.id
    ");
    $stmt->execute(['month' => $month, 'year' => $year]);
    $expenditureDetails = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $stmt = $pdo->prepare("
        SELECT a.id, a.amount, a.allocation_date,
               r.receipt_date, r.source AS receipt_source,
               c.name AS category_name, s.name AS subcategory_name,
               COALESCE(SUM(e.amount), 0) AS expenditure_amount,
               a.amount - COALESCE(SUM(e.amount), 0) AS remaining_amount
        FROM monthly_subcategory_allocations a
        JOIN revenues r ON r.id = a.revenue_id
        JOIN budget_subcategories s ON s.id = a.subcategory_id
        JOIN budget_categories c ON c.id = s.category_id
        LEFT JOIN expenditures e ON e.monthly_allocation_id = a.id
        WHERE r.record_type = 'monthly_receipt' AND YEAR(a.allocation_date) = :year
        GROUP BY a.id, a.amount, a.allocation_date, r.receipt_date,
                 r.source, c.name, s.name
        ORDER BY a.allocation_date, a.id
    ");
    $stmt->execute(['year' => $year]);
    $allocationUtilization = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $totalMonthlyReceipts = array_sum(array_map(static fn($row) => (float)$row['amount'], $monthlyReceipts));
    $totalMonthlyAllocated = array_sum(array_map(static fn($row) => (float)$row['amount'], $monthlyAllocations));
    $totalExpenditure = array_sum(array_map(static fn($row) => (float)$row['amount'], $expenditureDetails));
    $monthlyLinkedExpenditure = array_sum(array_map(
        static fn($row) => $row['monthly_allocation_id'] ? (float)$row['amount'] : 0,
        $expenditureDetails
    ));
    $legacyExpenditure = $totalExpenditure - $monthlyLinkedExpenditure;
    $receiptsForPeriod = array_filter($receiptBalances, static function ($row) use ($month, $year) {
        return (int)date('n', strtotime($row['receipt_date'])) === $month
            && (int)date('Y', strtotime($row['receipt_date'])) === $year;
    });
    $outstandingUnallocated = array_sum(array_map(
        static fn($row) => (float)$row['unallocated_amount'],
        $receiptsForPeriod
    ));
    $remainingAllocated = array_sum(array_map(
        static fn($row) => (float)$row['remaining_amount'],
        $allocationUtilization
    ));

    echo json_encode([
        'success' => true,
        'month' => $month,
        'year' => $year,
        'annualIncome' => $annualIncome,
        'annualRevenues' => $annualRevenues,
        'monthlyReceipts' => $monthlyReceipts,
        'monthlyAllocations' => $monthlyAllocations,
        'receiptBalances' => $receiptBalances,
        'expenditureBreakdown' => $expenditureBreakdown,
        'expenditureDetails' => $expenditureDetails,
        'allocationUtilization' => $allocationUtilization,
        'totalMonthlyReceipts' => $totalMonthlyReceipts,
        'totalMonthlyAllocated' => $totalMonthlyAllocated,
        'outstandingUnallocated' => $outstandingUnallocated,
        'totalExpenditure' => $totalExpenditure,
        'monthlyLinkedExpenditure' => $monthlyLinkedExpenditure,
        'legacyExpenditure' => $legacyExpenditure,
        'remainingAllocated' => $remainingAllocated,
        'totalRevenue' => $totalMonthlyReceipts,
        'netIncome' => $totalMonthlyReceipts - $totalExpenditure
    ]);
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to generate report.']);
}
