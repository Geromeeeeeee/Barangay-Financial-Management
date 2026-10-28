<?php
session_start();
require_once '../../header.php';

if (!isset($_SESSION['uid'])) {
    http_response_code(401);
    exit('Authentication required.');
}

$file_id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
if (!$file_id) {
    http_response_code(400);
    exit('A valid file ID is required.');
}

$stmt = $pdo->prepare('
    SELECT file_path, file_name, file_type
    FROM revenue_attachments
    WHERE id = :id
    LIMIT 1
');
$stmt->execute(['id' => $file_id]);
$file = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$file) {
    http_response_code(404);
    exit('File not found in database.');
}

$relativePath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $file['file_path']);
$filePath = realpath(__DIR__ . '/../../' . $relativePath);
$uploadRoot = realpath(__DIR__ . '/../../uploads/revenues');

if (!$filePath || !$uploadRoot || strpos($filePath, $uploadRoot . DIRECTORY_SEPARATOR) !== 0 || !is_file($filePath)) {
    http_response_code(404);
    exit('The supporting document is unavailable.');
}

$downloadName = preg_replace('/[^A-Za-z0-9._-]/', '_', (string)$file['file_name']);
header('Content-Type: ' . ($file['file_type'] ?: 'application/octet-stream'));
header('Content-Disposition: attachment; filename="' . ($downloadName ?: 'supporting-document') . '"');
header('Content-Length: ' . (string)filesize($filePath));
readfile($filePath);
exit;
