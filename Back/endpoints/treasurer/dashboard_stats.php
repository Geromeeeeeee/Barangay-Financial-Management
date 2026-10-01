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
    'recentActivity'  => $recentActivity,
]);