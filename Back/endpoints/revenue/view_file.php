<?php
session_start();
require_once '../../header.php';

$file_id = (int)($_GET['id'] ?? 0);

if (!$file_id) {
    http_response_code(400);
    die("Invalid file ID.");
}

// Fetch the file details from the database
$stmt = $pdo->prepare("SELECT * FROM revenue_attachments WHERE id = :id LIMIT 1");
$stmt->execute(['id' => $file_id]);
$file = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$file) {
    http_response_code(404);
    die("File not found in database.");
}

// Build the full path on the server
$file_path = __DIR__ . '/../../' . $file['file_path'];

if (!file_exists($file_path)) {
    http_response_code(404);
    die("File does not exist on the server.");
}

// Clear any headers set by header.php
header_remove('Content-Type'); 
header_remove('Access-Control-Allow-Origin');
header_remove('Access-Control-Allow-Credentials');

// Set headers to DISPLAY the file inline
header('Content-Type: ' . $file['file_type']);
header('Content-Disposition: inline; filename="' . basename($file['file_name']) . '"');
header('Content-Length: ' . filesize($file_path));

// Output the file
readfile($file_path);
exit;