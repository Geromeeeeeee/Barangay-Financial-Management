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
    'recentActivity'    => $recentActivity,
    'recentRequests'    => $recentRequests,
]);