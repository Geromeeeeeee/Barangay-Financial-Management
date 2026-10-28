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
    exit('A valid expenditure ID is required.');
}

$stmt = $pdo->prepare('
    SELECT attachment_path, attachment_name, attachment_mime
    FROM expenditures
    WHERE id = :id
    LIMIT 1
');
$stmt->execute(['id' => $id]);
$attachment = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$attachment || empty($attachment['attachment_path'])) {
    http_response_code(404);
    exit('No supporting document was found.');
}

$relativePath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $attachment['attachment_path']);
$filePath = realpath(__DIR__ . '/../../' . $relativePath);
$uploadRoot = realpath(__DIR__ . '/../../uploads/expenditures');

if (!$filePath || !$uploadRoot || strpos($filePath, $uploadRoot . DIRECTORY_SEPARATOR) !== 0 || !is_file($filePath)) {
    http_response_code(404);
    exit('The supporting document is unavailable.');
}

$viewName = preg_replace('/[^A-Za-z0-9._-]/', '_', (string)$attachment['attachment_name']);
header('Content-Type: ' . ($attachment['attachment_mime'] ?: 'application/octet-stream'));
header('Content-Disposition: inline; filename="' . ($viewName ?: 'supporting-document') . '"');
header('Content-Length: ' . (string)filesize($filePath));
readfile($filePath);
exit;
