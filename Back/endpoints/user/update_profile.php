<?php
session_start();
require_once '../../header.php';

$uid = $_SESSION['uid'] ?? null;
if (!$uid) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit();
}

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
$isMultipart = stripos($contentType, 'multipart/form-data') !== false;
$data = $isMultipart ? $_POST : (json_decode(file_get_contents("php://input"), true) ?: []);
$action = $data['action'] ?? '';

if ($action === 'update_info') {
    $firstName = trim($data['firstName'] ?? '');
    $lastName = trim($data['lastName'] ?? '');
    $email = trim($data['email'] ?? '');
    
    if (empty($firstName) || empty($lastName) || empty($email)) {
        echo json_encode(['status' => 'error', 'message' => 'All fields are required.']);
        exit();
    }

    $stmt = $pdo->prepare("SELECT profile_picture FROM users WHERE id = :id");
    $stmt->execute(['id' => $uid]);
    $currentUser = $stmt->fetch(PDO::FETCH_ASSOC);
    $profilePicture = $currentUser['profile_picture'] ?? null;

    if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
        $allowedMimeTypes = ['image/jpeg' => 'jpg', 'image/png' => 'png'];
        $mimeType = (new finfo(FILEINFO_MIME_TYPE))->file($_FILES['avatar']['tmp_name']);
        
        if (isset($allowedMimeTypes[$mimeType])) {
            $uploadDir = __DIR__ . '/../../uploads/avatars/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0750, true);
            
            $safeFilename = uniqid('avatar_') . '.' . $allowedMimeTypes[$mimeType];
            if (move_uploaded_file($_FILES['avatar']['tmp_name'], $uploadDir . $safeFilename)) {
                $profilePicture = 'uploads/avatars/' . $safeFilename;
            }
        }
    }

    $stmt = $pdo->prepare("UPDATE users SET first_name = :fn, last_name = :ln, email = :em, profile_picture = :pic WHERE id = :id");
    $stmt->execute(['fn' => $firstName, 'ln' => $lastName, 'em' => $email, 'pic' => $profilePicture, 'id' => $uid]);
    
    echo json_encode([
        'status' => 'success', 
        'message' => 'Profile updated successfully!',
        'profile_picture' => $profilePicture
    ]);
    exit();
}

if ($action === 'change_password') {
    $current = $data['currentPassword'] ?? '';
    $new = $data['newPassword'] ?? '';
    $confirm = $data['confirmPassword'] ?? '';

    if (empty($current) || empty($new) || empty($confirm)) {
        echo json_encode(['status' => 'error', 'message' => 'All password fields are required.']);
        exit();
    }

    if ($new !== $confirm) {
        echo json_encode(['status' => 'error', 'message' => 'New passwords do not match.']);
        exit();
    }

    $stmt = $pdo->prepare("SELECT password FROM users WHERE id = :id");
    $stmt->execute(['id' => $uid]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!password_verify($current, $user['password'])) {
        echo json_encode(['status' => 'error', 'message' => 'Incorrect current password.']);
        exit();
    }

    if ($current === $new) {
        echo json_encode(['status' => 'error', 'message' => 'New password must be different from the current password.']);
        exit();
    }

    $newHash = password_hash($new, PASSWORD_DEFAULT);
    $pdo->prepare("UPDATE users SET password = :pw WHERE id = :id")->execute(['pw' => $newHash, 'id' => $uid]);

    echo json_encode(['status' => 'success', 'message' => 'Password changed successfully!']);
    exit();
}