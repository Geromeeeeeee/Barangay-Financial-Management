<?php
require_once '../../header.php';
require_once '../../classes/revenue.php';

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

    $revenue = new Revenue($pdo);
    $revenues = $revenue->get_revenue($filters);
    foreach ($revenues as &$record) {
        $record['nta'] = (float)$record['nta'];
        $record['local_income'] = (float)$record['local_income'];
        $record['total_annual_income'] = round($record['nta'] + $record['local_income'], 2);
    }
    unset($record);

    echo json_encode([
        'status' => 'success',
        'data' => $revenues
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