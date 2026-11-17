<?php
session_start();
require_once '../../header.php';

$file_id = (int)($_GET['id'] ?? 0);

if (!$file_id) {
    http_response_code(400);
    die("Invalid file ID.");
}

$stmt = $pdo->prepare("SELECT * FROM revenue_attachments WHERE id = :id LIMIT 1");
$stmt->execute(['id' => $file_id]);
$file = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$file) {
    http_response_code(404);
    die("File not found in database.");
}

$file_path = realpath(__DIR__ . '/../../' . $file['file_path']);

if (!$file_path || !file_exists($file_path)) {
    http_response_code(404);
    die("File does not exist on the server.");
}

if (ob_get_level()) {
    ob_end_clean();
}

header('Content-Type: ' . $file['file_type']);
header('Content-Disposition: inline; filename="' . basename($file['file_name']) . '"');
header('Content-Length: ' . filesize($file_path));

readfile($file_path);
exit;