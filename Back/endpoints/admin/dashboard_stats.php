<?php
session_start();

require_once '../../header.php';

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

// ============ RECENT REVENUE RECORDS (last 5) ============
$recentActivity = $pdo->query("
    SELECT id, source, amount, fund_allocation, created_at
    FROM revenues
    ORDER BY created_at DESC
    LIMIT 5
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
    'fundBalances'      => $fundBalances,
    'recentActivity'    => $recentActivity,
    'recentRequests'    => $recentRequests,
]);