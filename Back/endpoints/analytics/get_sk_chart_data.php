<?php
session_start();
require_once '../../header.php';

$year = (int)($_GET['year'] ?? date('Y'));

try {
    // Get the total allocated budget for SK (Yearly)
    $stmtAlloc = $pdo->prepare("SELECT allocated_amount FROM budget_categories WHERE name = 'SK'");
    $stmtAlloc->execute();
    $skTotalAllocated = (float)$stmtAlloc->fetchColumn();
    
    // Monthly Allocation = Total / 12
    $monthlyAllocation = $skTotalAllocated / 12;

    // Get the monthly expenditures filtering by fund_allocation = 'SK'
    $stmtExp = $pdo->prepare("
        SELECT MONTH(created_at) as month, SUM(amount) as total 
        FROM expenditures 
        WHERE fund_allocation = 'SK'
          AND YEAR(created_at) = :year 
        GROUP BY MONTH(created_at)
    ");
    $stmtExp->execute(['year' => $year]);
    $expenditures = $stmtExp->fetchAll(PDO::FETCH_KEY_PAIR);

    $chartData = [];
    $months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    for ($i = 1; $i <= 12; $i++) {
        $chartData[] = [
            'name' => $months[$i - 1],
            'allocated' => $monthlyAllocation,
            'spent' => (float)($expenditures[$i] ?? 0),
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