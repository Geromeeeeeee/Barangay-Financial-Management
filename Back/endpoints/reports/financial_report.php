<?php
session_start();
require_once '../../header.php';

if (!isset($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentication required.']);
    exit();
}

$allowedRoles = ['staff', 'treasurer'];
if (!in_array(strtolower((string)($_SESSION['role'] ?? '')), $allowedRoles, true)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'You are not authorized to view reports.']);
    exit();
}

$month = (int)($_GET['month'] ?? date('m'));
$year  = (int)($_GET['year'] ?? date('Y'));

try {
    if ($month < 1 || $month > 12 || $year < 1) {
        throw new InvalidArgumentException('Invalid reporting period.');
    }

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

} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Unable to generate report.']);
}