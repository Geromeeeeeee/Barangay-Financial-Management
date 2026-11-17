<?php
session_start();
require_once '../header.php';

$file_id = (int)($_GET['id'] ?? 0);
$type = $_GET['type'] ?? ''; 

if (!$file_id || !in_array($type, ['revenue', 'expenditure'])) {
    http_response_code(400);
    die("Invalid request.");
}

$table = $type === 'revenue' ? 'revenue_attachments' : 'expenditure_attachments';
$stmt = $pdo->prepare("SELECT * FROM {$table} WHERE id = :id LIMIT 1");
$stmt->execute(['id' => $file_id]);
$file = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$file) {
    http_response_code(404);
    die("File not found in database.");
}

// 1. Get the clean relative path from the database (e.g., "uploads/revenues/file.jpg")
$relative_path = str_replace('\\', '/', $file['file_path']);
$filename = basename($relative_path);

// 2. Define all possible paths where the file might be
$possible_paths = [
    __DIR__ . '/../../' . $relative_path,                           // Standard path
    __DIR__ . '/../../' . $type . 's/' . $filename,                 // Folder matches type (revenues/expenditures)
    __DIR__ . '/../../uploads/' . $type . 's/' . $filename,         // Explicit uploads/type folder
    __DIR__ . '/../../uploads/' . $relative_path,                   // Explicit uploads/ folder
    'C:/laragon/www/Capstone/Back/' . $relative_path,               // Hardcoded Laragon fallback
];

$actual_file_path = null;
foreach ($possible_paths as $path) {
    $clean_path = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $path);
    if (file_exists($clean_path)) {
        $actual_file_path = $clean_path;
        break;
    }
}

if (!$actual_file_path) {
    http_response_code(404);
    die("Could not locate the file. Tried looking here: " . implode(" | ", $possible_paths));
}

if (ob_get_level()) {
    ob_end_clean();
}

header('Content-Description: File Transfer');
header('Content-Type: application/octet-stream');
header('Content-Disposition: attachment; filename="' . basename($file['file_name'] ?? $filename) . '"');
header('Expires: 0');
header('Cache-Control: must-revalidate');
header('Pragma: public');
header('Content-Length: ' . filesize($actual_file_path));

readfile($actual_file_path);
exit;
?>