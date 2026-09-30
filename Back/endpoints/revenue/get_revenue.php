<?php
require_once '../../header.php';
require_once '../../classes/revenue.php';

try {
    $revenue = new Revenue($pdo);
    $revenues = $revenue->get_revenue();

    echo json_encode([
        'status' => 'success',
        'data' => $revenues
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>