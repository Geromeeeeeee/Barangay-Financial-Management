<?php
session_start();
require_once '../../header.php';

if (!isset($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentication required.']);
    exit();
}

if (strtolower((string)($_SESSION['role'] ?? '')) !== 'sk_chairman') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Only the SK Chair can submit fund requests.']);
    exit();
}

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
$data = stripos($contentType, 'multipart/form-data') !== false
    ? $_POST
    : (json_decode(file_get_contents("php://input"), true) ?: []);

$title = trim((string)($data['title'] ?? ''));
$desc = trim((string)($data['description'] ?? ''));
$costInput = $data['estimated_cost'] ?? null;
$cost = round((float)$costInput, 2);
$files = $_FILES['attachments'] ?? null;
$uploadedPaths = [];

try {
    if ($title === '' || strlen($title) > 120 || $desc === '' || strlen($desc) > 1000) {
        throw new InvalidArgumentException('A project title and description are required.');
    }
    if (!is_numeric($costInput) || $cost <= 0) {
        throw new InvalidArgumentException('The requested amount must be a positive number.');
    }

    $fileCount = 0;
    if ($files && isset($files['name']) && is_array($files['name'])) {
        $fileCount = count(array_filter($files['name'], static fn($name) => (string)$name !== ''));
    }
    if ($fileCount > 5) {
        throw new InvalidArgumentException('A request may include no more than 5 attachments.');
    }

    $allowedMimeTypes = [
        'application/pdf' => 'pdf',
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
    ];
    $uploadedFilesData = [];
    $uploadDirectory = __DIR__ . '/../../uploads/projects';

    if ($files && isset($files['name']) && is_array($files['name'])) {
        if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0750, true)) {
            throw new RuntimeException('Supporting documents could not be stored.');
        }

        foreach ($files['name'] as $index => $originalName) {
            if (($files['error'][$index] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
                continue;
            }
            if (($files['error'][$index] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK
                || ($files['size'][$index] ?? 0) > 5 * 1024 * 1024) {
                throw new InvalidArgumentException('Each attachment must upload successfully and be no larger than 5 MB.');
            }

            $mimeType = (new finfo(FILEINFO_MIME_TYPE))->file($files['tmp_name'][$index]);
            if (!isset($allowedMimeTypes[$mimeType])) {
                throw new InvalidArgumentException('Only PDF, JPG, and PNG attachments are allowed.');
            }

            $safeFilename = bin2hex(random_bytes(16)) . '.' . $allowedMimeTypes[$mimeType];
            $uploadedPath = $uploadDirectory . DIRECTORY_SEPARATOR . $safeFilename;
            if (!move_uploaded_file($files['tmp_name'][$index], $uploadedPath)) {
                throw new RuntimeException('A supporting document could not be stored.');
            }
            $uploadedPaths[] = $uploadedPath;
            $uploadedFilesData[] = [
                'path' => 'uploads/projects/' . $safeFilename,
                'name' => basename((string)$originalName),
                'mime' => $mimeType,
                'size' => (int)$files['size'][$index],
            ];
        }
    }

    $pdo->beginTransaction();
    $stmt = $pdo->prepare('
        INSERT INTO projects (title, description, estimated_cost, requested_by, status)
        VALUES (:title, :description, :estimated_cost, :requested_by, "pending")
    ');
    $stmt->execute([
        'title' => $title,
        'description' => $desc,
        'estimated_cost' => $cost,
        'requested_by' => $_SESSION['uid'],
    ]);
    $projectId = (int)$pdo->lastInsertId();

    if ($uploadedFilesData) {
        $attachment = $pdo->prepare('
            INSERT INTO project_attachments (project_id, file_path, file_name, file_type, file_size)
            VALUES (:project_id, :file_path, :file_name, :file_type, :file_size)
        ');
        foreach ($uploadedFilesData as $file) {
            $attachment->execute([
                'project_id' => $projectId,
                'file_path' => $file['path'],
                'file_name' => $file['name'],
                'file_type' => $file['mime'],
                'file_size' => $file['size'],
            ]);
        }
    }
    $pdo->commit();

    echo json_encode(['success' => true, 'message' => 'Fund request submitted successfully.']);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    foreach ($uploadedPaths as $path) {
        if (is_file($path)) {
            unlink($path);
        }
    }
    http_response_code($e instanceof InvalidArgumentException ? 400 : 500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}