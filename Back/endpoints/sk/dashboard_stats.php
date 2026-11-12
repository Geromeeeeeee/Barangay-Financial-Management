<?php
session_start();

require_once '../../header.php';
require_once '../../classes/budget.php';

$role = strtolower((string)($_SESSION['role'] ?? ''));
if (!isset($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Authentication required.']);
    exit();
}

if (!in_array($role, ['sk_chairman', 'sk_member'], true)) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'SK dashboard access is restricted.']);
    exit();
}

$fiscalYear = (int)($_GET['year'] ?? date('Y'));

try {
    Budget::refreshAllocations($pdo);

    $category = $pdo->prepare("
        SELECT id, name, allocated_amount
        FROM budget_categories
        WHERE name = 'SK'
        LIMIT 1
    ");
    $category->execute();
    $categoryRow = $category->fetch(PDO::FETCH_ASSOC);
    if (!$categoryRow) {
        throw new RuntimeException('The SK budget category does not exist.');
    }

    $categoryId = (int)$categoryRow['id'];
    $annualAllocation = (float)$categoryRow['allocated_amount'];

    $skExpenditureWhere = "
        (
            e.fund_allocation = 'SK'
            OR EXISTS (
                SELECT 1
                FROM monthly_subcategory_allocations msa
                JOIN budget_subcategories mbs ON mbs.id = msa.subcategory_id
                JOIN budget_categories mbc ON mbc.id = mbs.category_id
                WHERE msa.id = e.monthly_allocation_id
                  AND mbc.id = :category_id
            )
        )
    ";

    $totalExpenditures = $pdo->prepare("
        SELECT COALESCE(SUM(e.amount), 0)
        FROM expenditures e
        WHERE YEAR(e.created_at) = :year
          AND e.status = 'verified'
          AND {$skExpenditureWhere}
    ");
    $totalExpenditures->execute([
        'year' => $fiscalYear,
        'category_id' => $categoryId,
    ]);
    $totalExpenditures = (float)$totalExpenditures->fetchColumn();

    $subcategories = $pdo->prepare("
        SELECT s.id, s.category_id, s.name, s.allocated_amount,
               COALESCE((
                   SELECT SUM(e.amount)
                   FROM expenditures e
                   WHERE YEAR(e.created_at) = :year
                     AND e.status = 'verified'
                     AND (
                         (
                             e.monthly_allocation_id IS NOT NULL
                             AND EXISTS (
                                 SELECT 1
                                 FROM monthly_subcategory_allocations msa
                                 WHERE msa.id = e.monthly_allocation_id
                                   AND msa.subcategory_id = s.id
                             )
                         )
                         OR (
                             e.monthly_allocation_id IS NULL
                             AND e.subcategory_id = s.id
                         )
                     )
               ), 0) AS spent_amount
        FROM budget_subcategories s
        WHERE s.category_id = :category_id
        ORDER BY s.name
    ");
    $subcategories->execute([
        'year' => $fiscalYear,
        'category_id' => $categoryId,
    ]);
    $subcategoryRows = $subcategories->fetchAll(PDO::FETCH_ASSOC);

    $subcategoryPayload = [];
    foreach ($subcategoryRows as $subcategory) {
        $allocated = (float)$subcategory['allocated_amount'];
        $spent = (float)$subcategory['spent_amount'];
        $subcategoryPayload[] = [
            'id' => (int)$subcategory['id'],
            'category_id' => (int)$subcategory['category_id'],
            'name' => $subcategory['name'],
            'allocated_amount' => $allocated,
            'spent_amount' => $spent,
            'balance' => $allocated - $spent,
        ];
    }

    $recentExpenditures = $pdo->prepare("
        SELECT e.id, e.description, e.amount, e.created_at,
               COALESCE(s.name, linked_s.name, 'SK') AS subcategory_name
        FROM expenditures e
        LEFT JOIN budget_subcategories s ON s.id = e.subcategory_id
        LEFT JOIN monthly_subcategory_allocations linked_a ON linked_a.id = e.monthly_allocation_id
        LEFT JOIN budget_subcategories linked_s ON linked_s.id = linked_a.subcategory_id
        WHERE YEAR(e.created_at) = :year
          AND {$skExpenditureWhere}
        ORDER BY e.created_at DESC, e.id DESC
        LIMIT 5
    ");
    $recentExpenditures->execute([
        'year' => $fiscalYear,
        'category_id' => $categoryId,
    ]);
    $recentExpenditures = $recentExpenditures->fetchAll(PDO::FETCH_ASSOC);

    $recentAllocations = $pdo->prepare("
        SELECT a.id, a.amount, a.allocation_date AS created_at,
               CONCAT('Allocated to ', s.name) AS source,
               s.name AS subcategory_name,
               r.source AS receipt_source
        FROM monthly_subcategory_allocations a
        JOIN budget_subcategories s ON s.id = a.subcategory_id
        JOIN budget_categories c ON c.id = s.category_id
        JOIN revenues r ON r.id = a.revenue_id
        WHERE c.id = :category_id
          AND r.record_type = 'monthly_receipt'
          AND YEAR(a.allocation_date) = :year
        ORDER BY a.allocation_date DESC, a.id DESC
        LIMIT 5
    ");
    $recentAllocations->execute([
        'year' => $fiscalYear,
        'category_id' => $categoryId,
    ]);
    $recentAllocations = $recentAllocations->fetchAll(PDO::FETCH_ASSOC);

    $monthlyFunding = $pdo->prepare("
        SELECT COALESCE(SUM(a.amount), 0)
        FROM monthly_subcategory_allocations a
        JOIN budget_subcategories s ON s.id = a.subcategory_id
        JOIN budget_categories c ON c.id = s.category_id
        JOIN revenues r ON r.id = a.revenue_id
        WHERE c.id = :category_id
          AND r.record_type = 'monthly_receipt'
          AND YEAR(a.allocation_date) = :year
    ");
    $monthlyFunding->execute([
        'year' => $fiscalYear,
        'category_id' => $categoryId,
    ]);
    $monthlyFunding = (float)$monthlyFunding->fetchColumn();

    $remaining = $annualAllocation - $totalExpenditures;
    $utilization = $annualAllocation > 0
        ? ($totalExpenditures / $annualAllocation) * 100
        : 0;

    echo json_encode([
        'status' => 'success',
        'fiscalYear' => $fiscalYear,
        'annualAllocation' => $annualAllocation,
        'totalExpenditures' => $totalExpenditures,
        'remainingBudget' => $remaining,
        'utilizationPercentage' => round($utilization, 2),
        'monthlyFunding' => $monthlyFunding,
        'categoryBalances' => [[
            'id' => $categoryId,
            'name' => 'SK',
            'allocated_amount' => $annualAllocation,
            'spent_amount' => $totalExpenditures,
            'balance' => $remaining,
            'subcategories' => $subcategoryPayload,
        ]],
        'recentAllocations' => $recentAllocations,
        'recentExpenditures' => $recentExpenditures,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
