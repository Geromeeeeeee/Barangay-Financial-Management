<?php
session_start();
require_once '../../header.php';

if (!isset($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Authentication required.']);
    exit();
}

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
if (!$id) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'A valid ID is required.']);
    exit();
}

$stmt = $pdo->prepare('
    SELECT file_path AS attachment_path, file_name AS attachment_name, file_type AS attachment_mime
    FROM revenue_attachments
    WHERE id = :id
    LIMIT 1
');
$stmt->execute(['id' => $id]);
$attachment = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$attachment) {
    $stmt = $pdo->prepare('
        SELECT attachment_path, attachment_name, attachment_mime
        FROM revenues
        WHERE id = :id
        LIMIT 1
    ');
    $stmt->execute(['id' => $id]);
    $attachment = $stmt->fetch(PDO::FETCH_ASSOC);
}

if (!$attachment || empty($attachment['attachment_path'])) {
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'No supporting document was found.']);
    exit();
}

$relativePath = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $attachment['attachment_path']);
$filePath = realpath(__DIR__ . '/../../' . $relativePath);
$uploadRoot = realpath(__DIR__ . '/../../uploads/revenues');

if (!$filePath || !$uploadRoot || strpos($filePath, $uploadRoot . DIRECTORY_SEPARATOR) !== 0 || !is_file($filePath)) {
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'The supporting document is unavailable.']);
    exit();
}

if (ob_get_level()) {
    ob_end_clean();
}

$downloadName = preg_replace('/[^A-Za-z0-9._-]/', '_', (string)($attachment['attachment_name'] ?? 'supporting-document'));
header('Content-Type: ' . ($attachment['attachment_mime'] ?: 'application/octet-stream'));
header('Content-Length: ' . filesize($filePath));
header('Content-Disposition: attachment; filename="' . $downloadName . '"');
readfile($filePath);
exit;
?>