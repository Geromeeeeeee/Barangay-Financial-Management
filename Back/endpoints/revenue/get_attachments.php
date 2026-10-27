<?php
session_start();
require_once '../../header.php';

$revenue_id = (int)($_GET['revenue_id'] ?? 0);

if (!$revenue_id) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid ID']);
    exit();
}

$stmt = $pdo->prepare("SELECT id, file_name, file_type, file_size FROM revenue_attachments WHERE revenue_id = :id");
$stmt->execute(['id' => $revenue_id]);

echo json_encode([
    'status' => 'success',
    'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)
]);