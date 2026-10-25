<?php
session_start();

require_once '../../header.php';
require_once '../../classes/revenue.php';

if (!isset($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Authentication required.']);
    exit();
}

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
$data = stripos($contentType, 'multipart/form-data') !== false
    ? $_POST
    : (json_decode(file_get_contents("php://input"), true) ?: []);

$amount          = $data['amount']          ?? 0;
$nta             = array_key_exists('nta', $data) ? $data['nta'] : $amount;
$localIncome     = $data['local_income']    ?? 0;
$source          = $data['source']          ?? '';
$fund_allocation = $data['fund_allocation'] ?? '';
$created_by      = $_SESSION['uid'];
$request_key     = $data['request_key']     ?? null;
$attachmentPath = $attachmentName = $attachmentMime = $uploadedPath = null;
$attachmentSize = null;

$revenue = new Revenue($pdo);

try {
    if (!is_numeric($nta) || (float)$nta < 0 || !is_numeric($localIncome) || (float)$localIncome < 0) {
        throw new InvalidArgumentException('NTA and Local Income must be valid non-negative amounts.');
    }
    $amount = round((float)$nta + (float)$localIncome, 2);
    if ($amount <= 0 || trim((string)$source) === '') {
        throw new InvalidArgumentException('A positive total annual income and source are required.');
    }
    $isTreasurer = strtolower((string)($_SESSION['role'] ?? '')) === 'treasurer';
    $file = $_FILES['supporting_document'] ?? null;
    if ($isTreasurer && (!$file || $file['error'] === UPLOAD_ERR_NO_FILE)) {
        throw new InvalidArgumentException('Treasurers must upload a supporting document.');
    }
    if ($file && $file['error'] !== UPLOAD_ERR_NO_FILE) {
        if (!$isTreasurer) {
            throw new InvalidArgumentException('Only treasurers can upload supporting documents.');
        }
        if ($file['error'] !== UPLOAD_ERR_OK || $file['size'] > 5 * 1024 * 1024) {
            throw new InvalidArgumentException('The supporting document could not be uploaded or exceeds 5 MB.');
        }
        $allowedMimeTypes = ['application/pdf' => 'pdf', 'image/jpeg' => 'jpg', 'image/png' => 'png'];
        $mimeType = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
        if (!isset($allowedMimeTypes[$mimeType])) {
            throw new InvalidArgumentException('Only PDF, JPG, and PNG supporting documents are allowed.');
        }
        $uploadDirectory = __DIR__ . '/../../uploads/revenues';
        if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0750, true)) {
            throw new RuntimeException('The supporting document could not be stored.');
        }
        $safeFilename = bin2hex(random_bytes(16)) . '.' . $allowedMimeTypes[$mimeType];
        $uploadedPath = $uploadDirectory . DIRECTORY_SEPARATOR . $safeFilename;
        if (!move_uploaded_file($file['tmp_name'], $uploadedPath)) {
            throw new RuntimeException('The supporting document could not be stored.');
        }
        $attachmentPath = 'uploads/revenues/' . $safeFilename;
        $attachmentName = basename((string)$file['name']);
        $attachmentMime = $mimeType;
        $attachmentSize = (int)$file['size'];
    }
    $revenue->record_revenue($nta, $localIncome, $source, $fund_allocation, $created_by, $request_key, $attachmentPath, $attachmentName, $attachmentMime, $attachmentSize);
    echo json_encode([
        'status' => 'revenue_recorded',
        'data' => [
            'nta' => round((float)$nta, 2),
            'local_income' => round((float)$localIncome, 2),
            'total_annual_income' => $amount,
        ],
    ]);
} catch (Exception $e) {
    if ($uploadedPath && is_file($uploadedPath)) unlink($uploadedPath);
    http_response_code($e instanceof InvalidArgumentException ? 400 : 500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}