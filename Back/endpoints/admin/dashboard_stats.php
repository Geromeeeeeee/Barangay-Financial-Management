<?php
session_start();

require_once '../../header.php';
require_once '../../classes/budget.php';

Budget::refreshAllocations($pdo);

// ============ TOTAL USERS ============
$totalUsers = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();

// ============ PENDING APPROVALS ============
$pendingApprovals = $pdo->query("
    SELECT COUNT(*) FROM users WHERE status = 'pending'
")->fetchColumn();

// ============ ACTIVE INVITE CODES ============
$activeCodes = $pdo->query("
    SELECT COUNT(*) FROM invite_codes
    WHERE used_by IS NULL AND expires_at > NOW()
")->fetchColumn();

// ============ REVENUE RECORDS THIS MONTH ============
$recordsThisMonth = $pdo->query("
    SELECT COUNT(*) FROM revenues
    WHERE MONTH(created_at) = MONTH(NOW())
      AND YEAR(created_at)  = YEAR(NOW())
")->fetchColumn();

// ============ TOTAL REVENUE (all time) ============
$totalRevenue = $pdo->query("
    SELECT COALESCE(SUM(amount), 0) FROM revenues
")->fetchColumn();

// ============ CATEGORY BALANCES ============
$categoryBalances = $pdo->query("
    SELECT c.id, c.name, c.allocated_amount, c.spent_amount,
           c.allocated_amount - c.spent_amount - COALESCE(SUM(s.allocated_amount), 0) AS balance, c.is_custom
    FROM budget_categories c
    LEFT JOIN budget_subcategories s ON s.category_id = c.id
    GROUP BY c.id, c.name, c.allocated_amount, c.spent_amount, c.is_custom
    ORDER BY id ASC
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

// ============ RECENT REVENUE RECORDS (last 5) ============
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

// ============ PENDING USERS (last 3, for activity feed) ============
$recentRequests = $pdo->query("
    SELECT id, username, role, created_at
    FROM users
    WHERE status = 'pending'
    ORDER BY created_at DESC
    LIMIT 3
")->fetchAll(PDO::FETCH_ASSOC);

// ============ RETURN ============
echo json_encode([
    'totalUsers'        => (int)$totalUsers,
    'pendingApprovals'  => (int)$pendingApprovals,
    'activeCodes'       => (int)$activeCodes,
    'recordsThisMonth'  => (int)$recordsThisMonth,
    'totalRevenue'      => (float)$totalRevenue,
    'nta'               => $income['nta'],
    'localIncome'       => $income['local_income'],
    'totalAnnualIncome' => $income['total_annual_income'],
    'totalAllocated'    => (float)$totalAllocated,
    'totalExpenditures' => (float)$totalExpenditures,
    'totalRemaining'    => round($totalRemaining, 2),
    'categoryBalances'  => $categoryBalances,
    'recentActivity'    => $recentActivity,
    'recentExpenditures' => $recentExpenditures,
    'recentRequests'    => $recentRequests,
]);