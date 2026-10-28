<?php
session_start();

require_once '../../header.php';
require_once '../../classes/budget.php';

Budget::refreshAllocations($pdo);

// ============ TOTAL REVENUE ============
$totalRevenue = $pdo->query("
    SELECT COALESCE(SUM(amount), 0) FROM revenues
")->fetchColumn();

// ============ REVENUE THIS MONTH ============
$revenueThisMonth = $pdo->query("
    SELECT COALESCE(SUM(amount), 0) FROM revenues
    WHERE MONTH(created_at) = MONTH(NOW())
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
           allocated_amount - spent_amount - COALESCE((
               SELECT SUM(s.allocated_amount) FROM budget_subcategories s
               WHERE s.category_id = budget_categories.id
           ), 0) AS balance, percentage, is_custom
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
$totalExpenditures = $pdo->query("SELECT COALESCE(SUM(amount), 0) FROM expenditures")->fetchColumn();
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
    'categoryBalances' => $categoryBalances,
    'recentActivity'  => $recentActivity,
]);