<?php
session_start();
require_once '../../header.php';

$uid = $_SESSION['uid'] ?? null;
if (!$uid) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$action = $data['action'] ?? '';

if ($action === 'update_info') {
    $firstName = trim($data['firstName'] ?? '');
    $lastName = trim($data['lastName'] ?? '');
    $email = trim($data['email'] ?? '');

    if (empty($firstName) || empty($lastName) || empty($email)) {
        echo json_encode(['status' => 'error', 'message' => 'All fields are required.']);
        exit();
    }

    $stmt = $pdo->prepare("UPDATE users SET first_name = :fn, last_name = :ln, email = :em WHERE id = :id");
    $stmt->execute(['fn' => $firstName, 'ln' => $lastName, 'em' => $email, 'id' => $uid]);
    
    // Update session variables if needed (optional)
    echo json_encode(['status' => 'success', 'message' => 'Profile updated successfully!']);
    exit();
}

if ($action === 'change_password') {
    $current = $data['currentPassword'] ?? '';
    $new = $data['newPassword'] ?? '';

    $stmt = $pdo->prepare("SELECT password FROM users WHERE id = :id");
    $stmt->execute(['id' => $uid]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!password_verify($current, $user['password'])) {
        echo json_encode(['status' => 'error', 'message' => 'Incorrect current password.']);
        exit();
    }

    $newHash = password_hash($new, PASSWORD_DEFAULT);
    $pdo->prepare("UPDATE users SET password = :pw WHERE id = :id")->execute(['pw' => $newHash, 'id' => $uid]);

    echo json_encode(['status' => 'success', 'message' => 'Password changed successfully!']);
    exit();
}