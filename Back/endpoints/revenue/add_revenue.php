<?php
session_start();

require_once '../../header.php';
require_once '../../classes/revenue.php';
require_once '../../classes/audit.php';

if (!isset($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Authentication required.']);
    exit();
}

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
$data = stripos($contentType, 'multipart/form-data') !== false
    ? $_POST
    : (json_decode(file_get_contents("php://input"), true) ?: []);

$amount          = $data['amount']          ?? null;
$particular      = $data['particular']      ?? null;
$nta             = array_key_exists('nta', $data) ? $data['nta'] : null;
$localIncome     = $data['local_income']    ?? null;
$source          = $data['source']         ?? null;
$created_by      = $_SESSION['uid'];
$request_key     = $data['request_key']     ?? null;

$revenue = new Revenue($pdo);
$audit = new Audit($pdo);

try {
    if ($particular !== null) {
        if (!is_numeric($amount) || (float)$amount <= 0) {
            throw new InvalidArgumentException('A positive amount is required.');
        }

        $amount = round((float)$amount, 2);
        if ($particular === 'NTA') {
            $nta = $amount;
            $localIncome = 0;
            $source = 'NTA';
        } elseif ($particular === 'Local Income') {
            $nta = 0;
            $localIncome = $amount;
            $source = 'Local Income';
        } elseif ($particular === 'Others') {
            $nta = 0;
            $localIncome = 0;
            if ($source === null || trim((string)$source) === '') {
                throw new InvalidArgumentException('A specific revenue particular/source is required.');
            }
        } else {
            throw new InvalidArgumentException('Invalid revenue particular/source.');
        }
    } else {
        if ($nta === null || $localIncome === null || trim((string)$nta) === '' || trim((string)$localIncome) === ''
            || !is_numeric($nta) || (float)$nta < 0
            || !is_numeric($localIncome) || (float)$localIncome < 0) {
            throw new InvalidArgumentException('NTA and Local Income are required valid non-negative amounts.');
        }

        $amount = round((float)$nta + (float)$localIncome, 2);
        if ($amount <= 0 || $source === null || trim((string)$source) === '') {
            throw new InvalidArgumentException('A positive total annual income and source are required.');
        }
    }
    
    $isTreasurer = strtolower((string)($_SESSION['role'] ?? '')) === 'treasurer';
    
    $files = $_FILES['attachments'] ?? null;
    if ($isTreasurer && (!$files || $files['error'][0] === UPLOAD_ERR_NO_FILE)) {
        throw new InvalidArgumentException('Treasurers must upload at least one supporting document.');
    }

    $uploadedFilesData = [];
    $uploadedPaths = [];

    if ($files && $files['error'][0] !== UPLOAD_ERR_NO_FILE) {
        if (!$isTreasurer) {
            throw new InvalidArgumentException('Only treasurers can upload supporting documents.');
        }

        $allowedMimeTypes = ['application/pdf' => 'pdf', 'image/jpeg' => 'jpg', 'image/png' => 'png'];
        $uploadDirectory = __DIR__ . '/../../uploads/revenues';
        
        if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0750, true)) {
            throw new RuntimeException('The supporting document could not be stored.');
        }

        $file_count = count($files['name']);

        for ($i = 0; $i < $file_count; $i++) {
            if ($files['error'][$i] === UPLOAD_ERR_NO_FILE) continue;

            if ($files['error'][$i] !== UPLOAD_ERR_OK || $files['size'][$i] > 5 * 1024 * 1024) {
                throw new InvalidArgumentException('One or more files could not be uploaded or exceed 5 MB.');
            }

            $mimeType = (new finfo(FILEINFO_MIME_TYPE))->file($files['tmp_name'][$i]);
            if (!isset($allowedMimeTypes[$mimeType])) {
                throw new InvalidArgumentException('Only PDF, JPG, and PNG documents are allowed.');
            }

            $safeFilename = bin2hex(random_bytes(16)) . '.' . $allowedMimeTypes[$mimeType];
            $uploadedPath = $uploadDirectory . DIRECTORY_SEPARATOR . $safeFilename;

            if (!move_uploaded_file($files['tmp_name'][$i], $uploadedPath)) {
                throw new RuntimeException('A supporting document could not be stored.');
            }

            $uploadedPaths[] = $uploadedPath;
            
            $uploadedFilesData[] = [
                'path' => 'uploads/revenues/' . $safeFilename,
                'name' => basename((string)$files['name'][$i]),
                'mime' => $mimeType,
                'size' => (int)$files['size'][$i]
            ];
        }
    }

    $revenue_id = $revenue->record_revenue($nta, $localIncome, $source, $created_by, $request_key, null, null, null, null, $amount, $particular ?? 'Others');

    if (!empty($uploadedFilesData) && $revenue_id) {
        $stmt = $pdo->prepare("
            INSERT INTO revenue_attachments (revenue_id, file_path, file_name, file_type, file_size) 
            VALUES (:rev_id, :path, :name, :type, :size)
        ");
        
        foreach ($uploadedFilesData as $fileData) {
            $stmt->execute([
                'rev_id' => $revenue_id,
                'path'   => $fileData['path'],
                'name'   => $fileData['name'],
                'type'   => $fileData['mime'],
                'size'   => $fileData['size']
            ]);
        }
    }

    $audit->log('Record Revenue', "Recorded revenue of ₱" . number_format($amount, 2) . " for {$source}");

    echo json_encode([
        'status' => 'revenue_recorded',
        'data' => [
            'nta' => round((float)$nta, 2),
            'local_income' => round((float)$localIncome, 2),
            'total_annual_income' => $amount,
        ],
    ]);

} catch (Exception $e) {
    if (isset($uploadedPaths) && is_array($uploadedPaths)) {
        foreach ($uploadedPaths as $path) {
            if (is_file($path)) unlink($path);
        }
    }
    http_response_code($e instanceof InvalidArgumentException ? 400 : 500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}