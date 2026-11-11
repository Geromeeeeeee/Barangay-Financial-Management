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

    // Include both legacy SK fund records and monthly allocations under the SK category.
    $stmtExp = $pdo->prepare("
        SELECT MONTH(e.created_at) as month, SUM(e.amount) as total
        FROM expenditures e
        WHERE YEAR(e.created_at) = :year
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