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
    $filters = [
        'month' => $_GET['month'] ?? date('n'),
        'year' => $_GET['year'] ?? date('Y'),
    ];
    $filters['month'] = filter_var($filters['month'], FILTER_VALIDATE_INT);
    $filters['year'] = filter_var($filters['year'], FILTER_VALIDATE_INT);
    if ($filters['month'] === false || $filters['month'] < 1 || $filters['month'] > 12) {
        throw new InvalidArgumentException('Invalid month.');
    }
    if ($filters['year'] === false || $filters['year'] < 1) {
        throw new InvalidArgumentException('Invalid year.');
    }
    $expenditure = new Expenditure($pdo);

    $expenditures = $expenditure->get_expenditures($filters);

    echo json_encode([
        'status' => 'success',
        'data' => $expenditures
    ]);
} catch (InvalidArgumentException $e) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
