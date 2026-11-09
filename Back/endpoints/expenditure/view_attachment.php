<?php
require_once '../../header.php';

$attachmentId = filter_input(INPUT_GET, 'attachment_id', FILTER_VALIDATE_INT);
$expenditureId = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

if (!$attachmentId && !$expenditureId) {
    http_response_code(400);
    exit('Invalid file ID.');
}

try {
    if ($attachmentId) {
        $stmt = $pdo->prepare('SELECT file_path, file_name, file_type FROM expenditure_attachments WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $attachmentId]);
    } else {
        $stmt = $pdo->prepare('SELECT attachment_path AS file_path, attachment_name AS file_name, attachment_mime AS file_type FROM expenditures WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $expenditureId]);
    }
    
    $file = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$file || empty($file['file_path'])) {
        http_response_code(404);
        exit('File not found.');
    }

    $filePath = __DIR__ . '/../../' . $file['file_path'];

    if (!file_exists($filePath)) {
        http_response_code(404);
        exit('File does not exist on server.');
    }

    if (ob_get_level()) {
        ob_end_clean();
    }

    $mime = $file['file_type'] ?: mime_content_type($filePath);
    $name = $file['file_name'] ?: basename($file['file_path']);

    header('Content-Type: ' . $mime);
    header('Content-Disposition: inline; filename="' . basename($name) . '"');
    header('Content-Length: ' . filesize($filePath));

    readfile($filePath);
    exit;
} catch (Exception $e) {
    http_response_code(500);
    exit('Server error.');
}
?>