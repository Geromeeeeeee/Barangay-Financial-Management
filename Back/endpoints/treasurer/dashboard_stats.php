<?php
session_start();

require_once '../../header.php';

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

// ============ TOP FUND ALLOCATIONS ============
$topFunds = $pdo->query("
    SELECT fund_allocation,
           SUM(amount) AS total,
           COUNT(*) AS entries
    FROM revenues
    GROUP BY fund_allocation
    ORDER BY total DESC
    LIMIT 5
")->fetchAll(PDO::FETCH_ASSOC);

// ============ FUND BALANCES ============
$fundBalances = $pdo->query("
    SELECT fb.fund_name,
           fb.balance,
           COALESCE(SUM(r.amount), 0) AS total_allocated
    FROM fund_balances fb
    LEFT JOIN revenues r ON r.fund_allocation = fb.fund_name
    GROUP BY fb.fund_name, fb.balance
    ORDER BY fb.fund_name ASC
")->fetchAll(PDO::FETCH_ASSOC);

foreach ($fundBalances as &$fund) {
    $fund['balance'] = (float)$fund['balance'];
    $fund['total_allocated'] = (float)$fund['total_allocated'];
    $fund['usage_percentage'] = $fund['total_allocated'] > 0
        ? round((($fund['total_allocated'] - $fund['balance']) / $fund['total_allocated']) * 100, 2)
        : 0;
}
unset($fund);

// ============ RECENT RECORDS (last 5) ============
$recentActivity = $pdo->query("
    SELECT id, source, amount, fund_allocation, created_at
    FROM revenues
    ORDER BY created_at DESC
    LIMIT 5
")->fetchAll(PDO::FETCH_ASSOC);

// ============ RETURN ============
echo json_encode([
    'totalRevenue'    => (float)$totalRevenue,
    'revenueThisMonth'=> (float)$revenueThisMonth,
    'totalRecords'    => (int)$totalRecords,
    'recordsThisMonth'=> (int)$recordsThisMonth,
    'topFunds'        => $topFunds,
    'fundBalances'    => $fundBalances,
    'recentActivity'  => $recentActivity,
]);