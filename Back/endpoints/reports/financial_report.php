<?php
session_start();
require_once '../../header.php';

$month = (int)($_GET['month'] ?? date('m'));
$year  = (int)($_GET['year'] ?? date('Y'));

try {
    // 1. Get Revenues for the month
    $stmt = $pdo->prepare("
        SELECT id, source, fund_allocation, amount, created_at 
        FROM revenues 
        WHERE MONTH(created_at) = :month AND YEAR(created_at) = :year
        ORDER BY created_at ASC
    ");
    $stmt->execute(['month' => $month, 'year' => $year]);
    $revenues = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Get Expenditures for the month (assuming you have an expenditures table)
    $stmt = $pdo->prepare("
        SELECT id, description AS source, amount, created_at 
        FROM expenditures 
        WHERE MONTH(created_at) = :month AND YEAR(created_at) = :year
        ORDER BY created_at ASC
    ");
    $stmt->execute(['month' => $month, 'year' => $year]);
    $expenditures = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Calculate Totals
    $totalRevenue = 0;
    foreach ($revenues as $r) { $totalRevenue += (float)$r['amount']; }

    $totalExpenditure = 0;
    foreach ($expenditures as $e) { $totalExpenditure += (float)$e['amount']; }

    echo json_encode([
        'success' => true,
        'month' => $month,
        'year' => $year,
        'revenues' => $revenues,
        'expenditures' => $expenditures,
        'totalRevenue' => $totalRevenue,
        'totalExpenditure' => $totalExpenditure,
        'netIncome' => $totalRevenue - $totalExpenditure
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}