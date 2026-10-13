<?php
session_start();
require_once '../../header.php';
require_once '../../classes/expenditure.php';

$data = json_decode(file_get_contents("php://input"), true);

$amount          = $data['amount']          ?? 0;
$description     = $data['description']     ?? '';
$fund_allocation = $data['fund_allocation'] ?? '';
$created_by      = $_SESSION['uid']         ?? null;
$category_id     = $data['category_id']     ?? null;
$subcategory_id  = $data['subcategory_id']  ?? null;

$expenditure = new Expenditure($pdo);

try {
    $expenditure->record_expenditure($amount, $description, $fund_allocation, $created_by, $category_id, $subcategory_id);
    echo json_encode(['status' => 'expenditure_recorded']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>
