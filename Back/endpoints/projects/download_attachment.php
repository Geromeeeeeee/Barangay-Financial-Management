<?php
session_start();
require_once '../../header.php';

if (!isset($_SESSION['uid'])) {
    http_response_code(401);
    exit('Authentication required.');
}

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
if (!$id) {
    http_response_code(400);
    exit('A valid attachment ID is required.');
}

$stmt = $pdo->prepare('
    SELECT a.file_path, a.file_name, a.file_type, p.requested_by
    FROM project_attachments a
    JOIN projects p ON p.id = a.project_id
    WHERE a.id = :id LIMIT 1
');
$stmt->execute(['id' => $id]);
$attachment = $stmt->fetch(PDO::FETCH_ASSOC);
$role = strtolower((string)($_SESSION['role'] ?? ''));
if (!$attachment || ($role !== 'treasurer' && (int)$attachment['requested_by'] !== (int)$_SESSION['uid'])) {
    http_response_code(404);
    exit('The attachment was not found.');
}

$relativePath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $attachment['file_path']);
$filePath = realpath(__DIR__ . '/../../' . $relativePath);
$uploadRoot = realpath(__DIR__ . '/../../uploads/projects');
if (!$filePath || !$uploadRoot || strpos($filePath, $uploadRoot . DIRECTORY_SEPARATOR) !== 0 || !is_file($filePath)) {
    http_response_code(404);
    exit('The attachment is unavailable.');
}

$downloadName = preg_replace('/[^A-Za-z0-9._-]/', '_', (string)$attachment['file_name']);
header('Content-Type: ' . $attachment['file_type']);
header('Content-Length: ' . (string)filesize($filePath));
header('Content-Disposition: inline; filename="' . ($downloadName ?: 'supporting-document') . '"');
readfile($filePath);
