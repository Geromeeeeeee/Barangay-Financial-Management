<?php
session_start();
require_once '../../header.php';

$year = (int)($_GET['year'] ?? date('Y'));

try {
    $stmtRev = $pdo->prepare("
        SELECT MONTH(created_at) as month, SUM(amount) as total 
        FROM revenues 
        WHERE YEAR(created_at) = :year 
        GROUP BY MONTH(created_at)
    ");
    $stmtRev->execute(['year' => $year]);
    $revenues = $stmtRev->fetchAll(PDO::FETCH_KEY_PAIR);

    $stmtExp = $pdo->prepare("
        SELECT MONTH(created_at) as month, SUM(amount) as total 
        FROM expenditures 
        WHERE YEAR(created_at) = :year 
        GROUP BY MONTH(created_at)
    ");
    $stmtExp->execute(['year' => $year]);
    $expenditures = $stmtExp->fetchAll(PDO::FETCH_KEY_PAIR);

    $chartData = [];
    $months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    for ($i = 1; $i <= 12; $i++) {
        $chartData[] = [
            'name' => $months[$i - 1],
            'revenue' => (float)($revenues[$i] ?? 0),
            'expenditure' => (float)($expenditures[$i] ?? 0),
        ];
    }

    echo json_encode([
        'success' => true,
        'year' => $year,
        'data' => $chartData
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}