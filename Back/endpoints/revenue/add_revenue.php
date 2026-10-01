<?php
session_start();

require_once '../../header.php';
require_once '../../classes/revenue.php';

$data = json_decode(file_get_contents("php://input"), true);

$amount          = $data['amount']          ?? 0;
$source          = $data['source']          ?? '';
$fund_allocation = $data['fund_allocation'] ?? '';
$created_by      = $_SESSION['uid']         ?? null;   // ← NEW

$revenue = new Revenue($pdo);

try {
    $revenue->record_revenue($amount, $source, $fund_allocation, $created_by);
    echo json_encode(['status' => 'revenue_recorded']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}