<?php
session_start();

require_once '../../header.php';
require_once '../../classes/budget.php';

Budget::refreshAllocations($pdo);

// ============ TOTAL REVENUE ============
$totalRevenue = $pdo->query("
    SELECT COALESCE(SUM(amount), 0) FROM revenues
    WHERE record_type = 'annual_budget' AND status = 'verified'
")->fetchColumn();

// ============ REVENUE THIS MONTH ============
$revenueThisMonth = $pdo->query("
    SELECT COALESCE(SUM(amount), 0) FROM revenues
    WHERE record_type = 'annual_budget' AND status = 'verified'
      AND MONTH(created_at) = MONTH(NOW())
      AND YEAR(created_at)  = YEAR(NOW())
")->fetchColumn();

// ============ TOTAL RECORDS ============
$totalRecords = $pdo->query("
    SELECT COUNT(*) FROM revenues
")->fetchColumn();

// ============ RECORDS THIS MONTH ============
$recordsThisMonth = $pdo->query("
    SELECT COUNT(*) FROM revenues
    WHERE MONTH(created_at) = MONTH(NOW())
      AND YEAR(created_at)  = YEAR(NOW())
")->fetchColumn();

$categoryBalances = $pdo->query("
    SELECT id, name, allocated_amount, spent_amount,
           allocated_amount - spent_amount AS balance, percentage, is_custom
    FROM budget_categories ORDER BY id
")->fetchAll(PDO::FETCH_ASSOC);
$subcategories = $pdo->query("
    SELECT id, category_id, name, allocated_amount, spent_amount,
           allocated_amount - spent_amount AS balance
    FROM budget_subcategories ORDER BY category_id, name
")->fetchAll(PDO::FETCH_ASSOC);
foreach ($categoryBalances as &$category) {
    $category['id'] = (int)$category['id'];
    $category['allocated_amount'] = (float)$category['allocated_amount'];
    $category['spent_amount'] = (float)$category['spent_amount'];
    $category['balance'] = (float)$category['balance'];
    $category['percentage'] = (float)$category['percentage'];
    $category['is_custom'] = (bool)$category['is_custom'];
    $category['subcategories'] = [];
    foreach ($subcategories as $subcategory) {
        if ((int)$subcategory['category_id'] === $category['id']) {
            $subcategory['id'] = (int)$subcategory['id'];
            $subcategory['category_id'] = (int)$subcategory['category_id'];
            $subcategory['allocated_amount'] = (float)$subcategory['allocated_amount'];
            $subcategory['spent_amount'] = (float)$subcategory['spent_amount'];
            $subcategory['balance'] = (float)$subcategory['balance'];
            $category['subcategories'][] = $subcategory;
        }
    }
}
unset($category);

$income = Budget::income($pdo);
$totalAllocated = $pdo->query("SELECT COALESCE(SUM(allocated_amount), 0) FROM budget_categories")->fetchColumn();
$totalExpenditures = $pdo->query("SELECT COALESCE(SUM(amount), 0) FROM expenditures WHERE status = 'verified'")->fetchColumn();
$fiscalYear = (int)($_GET['year'] ?? date('Y'));
$annualApprovedBudget = (float)$income['total_annual_income'];
$monthlyReceipts = $pdo->prepare("
    SELECT COALESCE(SUM(amount), 0) FROM revenues
    WHERE record_type = 'monthly_receipt' AND status = 'verified' AND YEAR(receipt_date) = :year
");
$monthlyReceipts->execute(['year' => $fiscalYear]);
$totalMonthlyReceipts = (float)$monthlyReceipts->fetchColumn();
$annualExpenditures = $pdo->prepare("
    SELECT COALESCE(SUM(amount), 0) FROM expenditures
    WHERE YEAR(created_at) = :year
      AND status = 'verified'
");
$annualExpenditures->execute(['year' => $fiscalYear]);
$totalAnnualExpenditures = (float)$annualExpenditures->fetchColumn();
$linkedExpenditures = $pdo->prepare("
    SELECT COALESCE(SUM(amount), 0) FROM expenditures
    WHERE monthly_allocation_id IS NOT NULL
      AND YEAR(created_at) = :year
      AND status = 'verified'
");
$linkedExpenditures->execute(['year' => $fiscalYear]);
$monthlyLinkedExpenditures = (float)$linkedExpenditures->fetchColumn();
$legacyExpenditures = $totalAnnualExpenditures - $monthlyLinkedExpenditures;
$unallocated = $pdo->prepare("
    SELECT COALESCE(SUM(r.amount - COALESCE((
        SELECT SUM(a.amount) FROM monthly_subcategory_allocations a WHERE a.revenue_id = r.id
    ), 0)), 0)
    FROM revenues r
    WHERE r.record_type = 'monthly_receipt' AND r.status = 'verified' AND YEAR(r.receipt_date) = :year
");
$unallocated->execute(['year' => $fiscalYear]);
$unallocatedReceiptBalance = (float)$unallocated->fetchColumn();
$allocatedUnspent = $pdo->prepare("
    SELECT COALESCE(SUM(a.amount - COALESCE((
        SELECT SUM(e.amount)
        FROM expenditures e
        WHERE e.monthly_allocation_id = a.id
          AND e.status = 'verified'
    ), 0)), 0)
    FROM monthly_subcategory_allocations a
    JOIN revenues r ON r.id = a.revenue_id
    WHERE r.record_type = 'monthly_receipt' AND r.status = 'verified' AND YEAR(r.receipt_date) = :year
");
$allocatedUnspent->execute(['year' => $fiscalYear]);
$allocatedButUnspentBalance = (float)$allocatedUnspent->fetchColumn();
$unreleasedAnnualBudgetRaw = $annualApprovedBudget - $totalMonthlyReceipts;
$releasePercentage = $annualApprovedBudget > 0 ? ($totalMonthlyReceipts / $annualApprovedBudget) * 100 : 0;
$annualUtilizationPercentage = $annualApprovedBudget > 0 ? ($totalAnnualExpenditures / $annualApprovedBudget) * 100 : 0;
$totalRemaining = array_reduce($categoryBalances, static function ($total, $category) {
    return $total + (float)$category['balance'];
}, 0.0);

// ============ RECENT RECORDS (last 5) ============
$recentActivity = $pdo->query("
    SELECT id, source, amount, created_at
    FROM revenues
    ORDER BY created_at DESC
    LIMIT 5
")->fetchAll(PDO::FETCH_ASSOC);

$recentExpenditures = $pdo->query("
    SELECT id, description, amount, created_at
    FROM expenditures
    ORDER BY created_at DESC
    LIMIT 1
")->fetchAll(PDO::FETCH_ASSOC);

// ============ RETURN ============
echo json_encode([
    'totalRevenue'    => (float)$totalRevenue,
    'nta'             => $income['nta'],
    'localIncome'     => $income['local_income'],
    'totalAnnualIncome' => $income['total_annual_income'],
    'totalAllocated'  => (float)$totalAllocated,
    'totalExpenditures'=> (float)$totalExpenditures,
    'totalRemaining'  => round($totalRemaining, 2),
    'revenueThisMonth'=> (float)$revenueThisMonth,
    'totalRecords'    => (int)$totalRecords,
    'recordsThisMonth'=> (int)$recordsThisMonth,
    'fiscalYear' => $fiscalYear,
    'annualApprovedBudget' => $annualApprovedBudget,
    'totalMonthlyReceipts' => $totalMonthlyReceipts,
    'unreleasedAnnualBudget' => max(0, $unreleasedAnnualBudgetRaw),
    'unreleasedAnnualBudgetRaw' => $unreleasedAnnualBudgetRaw,
    'releasePercentage' => round($releasePercentage, 2),
    'totalAnnualExpenditures' => $totalAnnualExpenditures,
    'annualUtilizationPercentage' => round($annualUtilizationPercentage, 2),
    'receivedButUnspent' => $unallocatedReceiptBalance + $allocatedButUnspentBalance,
    'unallocatedReceiptBalance' => $unallocatedReceiptBalance,
    'allocatedButUnspentBalance' => $allocatedButUnspentBalance,
    'monthlyLinkedExpenditures' => $monthlyLinkedExpenditures,
    'legacyExpenditures' => $legacyExpenditures,
    'categoryBalances' => $categoryBalances,
    'recentActivity'  => $recentActivity,
    'recentExpenditures' => $recentExpenditures,
]);