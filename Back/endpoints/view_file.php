<?php
session_start();
require_once '../header.php';

if (!isset($_SESSION['uid'])) {
    http_response_code(401);
    echo "Unauthorized";
    exit();
}

$file = $_GET['file'] ?? '';

// Security check: prevent directory traversal attacks
if (empty($file) || strpos($file, 'uploads/expenditures/') !== 0) {
    http_response_code(400);
    echo "Invalid file path";
    exit();
}

$filePath = __DIR__ . '/../' . $file;

if (!file_exists($filePath)) {
    http_response_code(404);
    echo "File not found";
    exit();
}

// Detect MIME type to render correctly
$mime = mime_content_type($filePath);

header('Content-Type: ' . $mime);
header('Content-Length: ' . filesize($filePath));
readfile($filePath);
exit();