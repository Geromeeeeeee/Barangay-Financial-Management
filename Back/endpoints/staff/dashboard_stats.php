<?php
session_start();

require_once '../../header.php';

$uid = $_SESSION['uid'] ?? null;

if (!$uid) {
    echo json_encode(['error' => 'Not logged in']);
    exit();
}

// ============ TOTAL ENTRIES ============
$totalEntries = $pdo->prepare("
    SELECT COUNT(*) FROM revenues WHERE created_by = :uid
");
$totalEntries->execute(['uid' => $uid]);
$totalEntries = $totalEntries->fetchColumn();

// ============ ENTRIES THIS MONTH ============
$entriesThisMonth = $pdo->prepare("
    SELECT COUNT(*) FROM revenues
    WHERE created_by = :uid
      AND MONTH(created_at) = MONTH(NOW())
      AND YEAR(created_at)  = YEAR(NOW())
");
$entriesThisMonth->execute(['uid' => $uid]);
$entriesThisMonth = $entriesThisMonth->fetchColumn();

// ============ TOTAL AMOUNT RECORDED ============
$totalAmount = $pdo->prepare("
    SELECT COALESCE(SUM(amount), 0) FROM revenues WHERE created_by = :uid
");
$totalAmount->execute(['uid' => $uid]);
$totalAmount = $totalAmount->fetchColumn();

// ============ RECENT ENTRIES ============
$recent = $pdo->prepare("
    SELECT id, source, amount, fund_allocation, created_at
    FROM revenues
    WHERE created_by = :uid
    ORDER BY created_at DESC
    LIMIT 5
");
$recent->execute(['uid' => $uid]);
$recent = $recent->fetchAll(PDO::FETCH_ASSOC);

// ============ RETURN ============
echo json_encode([
    'totalEntries'    => (int)$totalEntries,
    'entriesThisMonth'=> (int)$entriesThisMonth,
    'totalAmount'     => (float)$totalAmount,
    'recentActivity'  => $recent,
]);