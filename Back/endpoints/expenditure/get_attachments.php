<?php
session_start();
require_once '../../header.php';

if (!isset($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Authentication required.']);
    exit();
}

$expenditureId = filter_input(INPUT_GET, 'expenditure_id', FILTER_VALIDATE_INT);
if (!$expenditureId) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'A valid expenditure ID is required.']);
    exit();
}

$stmt = $pdo->prepare('
    SELECT id, file_name, file_type, file_size
    FROM expenditure_attachments
    WHERE expenditure_id = :expenditure_id
    ORDER BY id
');
$stmt->execute(['expenditure_id' => $expenditureId]);
$files = $stmt->fetchAll(PDO::FETCH_ASSOC);

$legacy = $pdo->prepare('
    SELECT id, attachment_name AS file_name, attachment_mime AS file_type, attachment_size AS file_size
    FROM expenditures
    WHERE id = :id AND attachment_path IS NOT NULL
');
$legacy->execute(['id' => $expenditureId]);
$legacyFile = $legacy->fetch(PDO::FETCH_ASSOC);
if ($legacyFile) {
    array_unshift($files, [
        'id' => $legacyFile['id'],
        'file_name' => $legacyFile['file_name'],
        'file_type' => $legacyFile['file_type'],
        'file_size' => $legacyFile['file_size'],
        'legacy' => true,
    ]);
}

echo json_encode(['status' => 'success', 'data' => $files]);
