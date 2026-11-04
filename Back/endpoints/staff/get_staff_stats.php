<?php
session_start();
require_once '../../header.php';

if (!isset($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit();
}

$uid = $_SESSION['uid'];

try {
    // 1. Total clearances issued
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM clearances WHERE issued_by = :uid AND status = 'Issued'");
    $stmt->execute(['uid' => $uid]);
    $totalClearances = (int)$stmt->fetchColumn();

    // 2. Pending clearances
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM clearances WHERE issued_by = :uid AND status = 'Pending'");
    $stmt->execute(['uid' => $uid]);
    $pendingClearances = (int)$stmt->fetchColumn();

    // 3. Issued this month
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM clearances WHERE issued_by = :uid AND status = 'Issued' AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())");
    $stmt->execute(['uid' => $uid]);
    $thisMonth = (int)$stmt->fetchColumn();

    // 4. Recent clearances list
    $stmt = $pdo->prepare("SELECT id, resident_name, clearance_type, status, created_at FROM clearances WHERE issued_by = :uid ORDER BY created_at DESC LIMIT 5");
    $stmt->execute(['uid' => $uid]);
    $recentClearances = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 5. Monthly Clearances for the Chart (Current Year)
    $stmt = $pdo->prepare("
        SELECT 
            MONTH(created_at) as month, 
            COUNT(*) as count 
        FROM clearances 
        WHERE issued_by = :uid 
          AND status = 'Issued' 
          AND YEAR(created_at) = YEAR(CURRENT_DATE())
        GROUP BY MONTH(created_at)
    ");
    $stmt->execute(['uid' => $uid]);
    
    // Format the data into an array for the chart
    $monthlyData = array_fill(1, 12, 0); // Fill all 12 months with 0
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $monthlyData[(int)$row['month']] = (int)$row['count'];
    }

    echo json_encode([
        'status' => 'success',
        'data' => [
            'totalClearances' => $totalClearances,
            'pendingClearances' => $pendingClearances,
            'thisMonth' => $thisMonth,
            'recentClearances' => $recentClearances,
            'chartData' => array_values($monthlyData) // Sends [0, 0, 5, 10, ...]
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}