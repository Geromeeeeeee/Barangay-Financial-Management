<?php
session_start();
require_once '../../header.php';
require_once '../../classes/expenditure.php';

if (!isset($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Authentication required.']);
    exit();
}

try {
    $expenditure = new Expenditure($pdo);

    $expenditures = $expenditure->get_expenditures();

    echo json_encode([
        'status' => 'success',
        'data' => $expenditures
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
