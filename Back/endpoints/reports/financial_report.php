<?php
session_start();
require_once '../../header.php';

$month = (int)($_GET['month'] ?? date('m'));
$year  = (int)($_GET['year'] ?? date('Y'));

try {
    // 1. Get Summarized Revenues (Grouped by Source)
    $stmt = $pdo->prepare("
        SELECT source, 
               SUM(amount) AS total_amount,
               COUNT(*) AS entry_count
        FROM revenues 
        WHERE MONTH(created_at) = :month AND YEAR(created_at) = :year
        GROUP BY source
        ORDER BY total_amount DESC
    ");
    $stmt->execute(['month' => $month, 'year' => $year]);
    $revenues = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 2. Get Summarized Expenditures (Grouped by Description)
    $stmt = $pdo->prepare("
        SELECT description AS source, 
               SUM(amount) AS total_amount,
               COUNT(*) AS entry_count
        FROM expenditures 
        WHERE MONTH(created_at) = :month AND YEAR(created_at) = :year
        GROUP BY description
        ORDER BY total_amount DESC
    ");
    $stmt->execute(['month' => $month, 'year' => $year]);
    $expenditures = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Calculate Grand Totals
    $totalRevenue = 0;
    foreach ($revenues as $r) { $totalRevenue += (float)$r['total_amount']; }

    $totalExpenditure = 0;
    foreach ($expenditures as $e) { $totalExpenditure += (float)$e['total_amount']; }

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