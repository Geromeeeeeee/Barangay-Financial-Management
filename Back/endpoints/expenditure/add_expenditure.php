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
$uploadedPaths = [];

$expenditure = new Expenditure($pdo);
$audit = new Audit($pdo);

try {
    $files = $_FILES['supporting_documents'] ?? null;
    if (!$files && isset($_FILES['supporting_document'])) {
        $legacyFile = $_FILES['supporting_document'];
        $files = [
            'name' => [$legacyFile['name']],
            'type' => [$legacyFile['type']],
            'tmp_name' => [$legacyFile['tmp_name']],
            'error' => [$legacyFile['error']],
            'size' => [$legacyFile['size']],
        ];
    }
    $uploadedFilesData = [];
    if ($files && isset($files['name']) && is_array($files['name'])) {
        if (strtolower((string)($_SESSION['role'] ?? '')) !== 'treasurer') {
            throw new InvalidArgumentException('Only treasurers can upload supporting documents.');
        }
        $fileCount = count(array_filter($files['name'], static fn($name) => (string)$name !== ''));
        if ($fileCount > 5) {
            throw new InvalidArgumentException('You can upload no more than 5 supporting documents.');
        }

        $allowedMimeTypes = [
            'application/pdf' => 'pdf',
            'image/jpeg'      => 'jpg',
            'image/png'       => 'png',
        ];
        $uploadDirectory = __DIR__ . '/../../uploads/expenditures';
        if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0750, true)) {
            throw new RuntimeException('The supporting document could not be stored.');
        }

        $fileInfo = new finfo(FILEINFO_MIME_TYPE);
        foreach ($files['name'] as $index => $originalName) {
            if (($files['error'][$index] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) continue;
            if (($files['error'][$index] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK
                || ($files['size'][$index] ?? 0) > 5 * 1024 * 1024) {
                throw new InvalidArgumentException('Each supporting document must upload successfully and not exceed 5 MB.');
            }
            $mimeType = $fileInfo->file($files['tmp_name'][$index]);
            if (!isset($allowedMimeTypes[$mimeType])) {
                throw new InvalidArgumentException('Only PDF, JPG, and PNG supporting documents are allowed.');
            }
            $safeFilename = bin2hex(random_bytes(16)) . '.' . $allowedMimeTypes[$mimeType];
            $uploadedPath = $uploadDirectory . DIRECTORY_SEPARATOR . $safeFilename;
            if (!move_uploaded_file($files['tmp_name'][$index], $uploadedPath)) {
                throw new RuntimeException('A supporting document could not be stored.');
            }
            $uploadedPaths[] = $uploadedPath;
            $uploadedFilesData[] = [
                'path' => 'uploads/expenditures/' . $safeFilename,
                'name' => basename((string)$originalName),
                'mime' => $mimeType,
                'size' => (int)$files['size'][$index],
            ];
        }
    }

    $expenditure->record_expenditure(
        $amount,
        $description,
        $fund_allocation,
        $created_by,
        $category_id,
        $subcategory_id,
        null,
        null,
        null,
        null,
        $uploadedFilesData
    );

    $audit->log('Record Expenditure', "Recorded expenditure of ₱" . number_format((float)$amount, 2) . " for {$description}");

    echo json_encode(['status' => 'expenditure_recorded']);
} catch (Exception $e) {
    foreach ($uploadedPaths as $path) {
        if (is_file($path)) {
            unlink($path);
        }
    }
    http_response_code($e instanceof InvalidArgumentException ? 400 : 500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>