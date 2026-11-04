<?php
session_start();
require_once '../../header.php';

if (!isset($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit();
}

$month = isset($_GET['month']) ? (int)$_GET['month'] : (int)date('m');
$year = isset($_GET['year']) ? (int)$_GET['year'] : (int)date('Y');

try {
    // Get totals grouped by Clearance Type
    $stmt = $pdo->prepare("
        SELECT clearance_type, COUNT(*) as count
        FROM clearances
        WHERE MONTH(created_at) = :month 
          AND YEAR(created_at) = :year 
          AND status = 'Issued'
        GROUP BY clearance_type
    ");
    $stmt->execute(['month' => $month, 'year' => $year]);
    $clearances = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get total count
    $totalStmt = $pdo->prepare("
        SELECT COUNT(*) FROM clearances 
        WHERE MONTH(created_at) = :month 
          AND YEAR(created_at) = :year 
          AND status = 'Issued'
    ");
    $totalStmt->execute(['month' => $month, 'year' => $year]);
    $totalClearances = (int)$totalStmt->fetchColumn();

    echo json_encode([
        'success' => true,
        'clearances' => $clearances,
        'totalClearances' => $totalClearances,
        'month' => $month,
        'year' => $year
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}