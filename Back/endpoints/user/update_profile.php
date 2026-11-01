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

    // Get current picture in case they don't upload a new one
    $stmt = $pdo->prepare("SELECT profile_picture FROM users WHERE id = :id");
    $stmt->execute(['id' => $uid]);
    $currentUser = $stmt->fetch(PDO::FETCH_ASSOC);
    $profilePicture = $currentUser['profile_picture'] ?? null;

    // 👇 CHECK IF A FILE WAS UPLOADED
    if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
        $allowedMimeTypes = ['image/jpeg' => 'jpg', 'image/png' => 'png'];
        $mimeType = (new finfo(FILEINFO_MIME_TYPE))->file($_FILES['avatar']['tmp_name']);
        
        if (isset($allowedMimeTypes[$mimeType])) {
            // Create folder if it doesn't exist
            $uploadDir = __DIR__ . '/../../uploads/avatars/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0750, true);
            
            // Generate a safe filename
            $safeFilename = uniqid('avatar_') . '.' . $allowedMimeTypes[$mimeType];
            
            // Move the file
            if (move_uploaded_file($_FILES['avatar']['tmp_name'], $uploadDir . $safeFilename)) {
                $profilePicture = 'uploads/avatars/' . $safeFilename;
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to save the image to the server.']);
                exit();
            }
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Invalid image format. Only JPG and PNG allowed.']);
            exit();
        }
    }

    // Save to DB
    $stmt = $pdo->prepare("UPDATE users SET first_name = :fn, last_name = :ln, email = :em, profile_picture = :pic WHERE id = :id");
    $stmt->execute(['fn' => $firstName, 'ln' => $lastName, 'em' => $email, 'pic' => $profilePicture, 'id' => $uid]);
    
    echo json_encode([
        'status' => 'success', 
        'message' => 'Profile updated successfully!',
        'profile_picture' => $profilePicture
    ]);
    exit();
}

// ... (keep the change_password action here) ...