<?php
session_start();
require_once '../../header.php';

$year = (int)($_GET['year'] ?? date('Y'));

try {
    // Query actual monthly funding/allocations recorded under the SK category for the year
    $stmtFunding = $pdo->prepare("
        SELECT MONTH(COALESCE(msa.allocation_date, msa.created_at)) as month, SUM(msa.amount) as total
        FROM monthly_subcategory_allocations msa
        JOIN budget_subcategories bs ON bs.id = msa.subcategory_id
        JOIN budget_categories bc ON bc.id = bs.category_id
        WHERE YEAR(COALESCE(msa.allocation_date, msa.created_at)) = :year
          AND bc.name = 'SK'
        GROUP BY MONTH(COALESCE(msa.allocation_date, msa.created_at))
    ");
    $stmtFunding->execute(['year' => $year]);
    $fundings = $stmtFunding->fetchAll(PDO::FETCH_KEY_PAIR);

    // Query verified expenditures under the SK category for the given year
    $stmtExp = $pdo->prepare("
        SELECT MONTH(e.created_at) as month, SUM(e.amount) as total
        FROM expenditures e
        WHERE YEAR(e.created_at) = :year
          AND e.status = 'verified'
          AND (
              e.fund_allocation = 'SK'
              OR EXISTS (
                  SELECT 1
                  FROM monthly_subcategory_allocations msa
                  JOIN budget_subcategories bs ON bs.id = msa.subcategory_id
                  JOIN budget_categories bc ON bc.id = bs.category_id
                  WHERE msa.id = e.monthly_allocation_id
                    AND bc.name = 'SK'
              )
          )
        GROUP BY MONTH(e.created_at)
    ");
    $stmtExp->execute(['year' => $year]);
    $expenditures = $stmtExp->fetchAll(PDO::FETCH_KEY_PAIR);

    $chartData = [];
    $months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    for ($i = 1; $i <= 12; $i++) {
        $chartData[] = [
            'name' => $months[$i - 1],
            'allocated' => (float)($fundings[$i] ?? 0), // Actual recorded monthly funding/releases
            'spent' => (float)($expenditures[$i] ?? 0),  // Actual recorded expenditures
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