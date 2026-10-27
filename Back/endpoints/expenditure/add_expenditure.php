<?php
session_start();
require_once '../../header.php';
require_once '../../classes/expenditure.php';
require_once '../../classes/audit.php';

if (!isset($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Authentication required.']);
    exit();
}

if (strtolower((string)($_SESSION['role'] ?? '')) === 'admin') {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Administrators cannot record expenditures.']);
    exit();
}

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
$data = stripos($contentType, 'multipart/form-data') !== false
    ? $_POST
    : (json_decode(file_get_contents("php://input"), true) ?: []);

$amount          = $data['amount']          ?? 0;
$description     = $data['description']     ?? '';
$fund_allocation = $data['fund_allocation'] ?? '';
$created_by      = $_SESSION['uid']         ?? null;
$category_id     = $data['category_id']     ?? null;
$subcategory_id  = $data['subcategory_id']  ?? null;
$attachmentPath  = null;
$attachmentName  = null;
$attachmentMime  = null;
$attachmentSize  = null;
$uploadedPath    = null;

$expenditure = new Expenditure($pdo);
$audit = new Audit($pdo);

try {
    $file = $_FILES['supporting_document'] ?? null;
    if ($file && $file['error'] !== UPLOAD_ERR_NO_FILE) {
        if (strtolower((string)($_SESSION['role'] ?? '')) !== 'treasurer') {
            throw new InvalidArgumentException('Only treasurers can upload supporting documents.');
        }
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new InvalidArgumentException('The supporting document could not be uploaded.');
        }
        if ($file['size'] > 5 * 1024 * 1024) {
            throw new InvalidArgumentException('The supporting document must not exceed 5 MB.');
        }

        $allowedMimeTypes = [
            'application/pdf' => 'pdf',
            'image/jpeg'      => 'jpg',
            'image/png'       => 'png',
        ];
        $fileInfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $fileInfo->file($file['tmp_name']);
        if (!isset($allowedMimeTypes[$mimeType])) {
            throw new InvalidArgumentException('Only PDF, JPG, and PNG supporting documents are allowed.');
        }

        $uploadDirectory = __DIR__ . '/../../uploads/expenditures';
        if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0750, true)) {
            throw new RuntimeException('The supporting document could not be stored.');
        }

        $safeFilename = bin2hex(random_bytes(16)) . '.' . $allowedMimeTypes[$mimeType];
        $uploadedPath = $uploadDirectory . DIRECTORY_SEPARATOR . $safeFilename;
        if (!move_uploaded_file($file['tmp_name'], $uploadedPath)) {
            throw new RuntimeException('The supporting document could not be stored.');
        }

        $attachmentPath = 'uploads/expenditures/' . $safeFilename;
        $attachmentName = basename((string)$file['name']);
        $attachmentMime = $mimeType;
        $attachmentSize = (int)$file['size'];
    }

    $expenditure->record_expenditure(
        $amount,
        $description,
        $fund_allocation,
        $created_by,
        $category_id,
        $subcategory_id,
        $attachmentPath,
        $attachmentName,
        $attachmentMime,
        $attachmentSize
    );

    $audit->log('Record Expenditure', "Recorded expenditure of ₱" . number_format((float)$amount, 2) . " for {$description}");

    echo json_encode(['status' => 'expenditure_recorded']);
} catch (Exception $e) {
    if ($uploadedPath && is_file($uploadedPath)) {
        unlink($uploadedPath);
    }
    http_response_code($e instanceof InvalidArgumentException ? 400 : 500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>