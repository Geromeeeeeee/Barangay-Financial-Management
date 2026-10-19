<?php
session_start();
require_once '../header.php';

$data = json_decode(file_get_contents("php://input"), true);
$token = $data['token'] ?? '';
$newPass = $data['password'] ?? '';

if (strlen($newPass) < 6) {
    echo json_encode(['success' => false, 'message' => 'Password too short']); exit();
}

// Find valid token
$stmt = $pdo->prepare("SELECT id FROM users WHERE reset_token = ? AND reset_expires > NOW()");
$stmt->execute([$token]);
$user = $stmt->fetch();

if (!$user) {
    echo json_encode(['success' => false, 'message' => 'Invalid or expired token']); exit();
}

// Update password and clear token
$hash = password_hash($newPass, PASSWORD_DEFAULT);
$stmt = $pdo->prepare("UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?");
$stmt->execute([$hash, $user['id']]);

echo json_encode(['success' => true, 'message' => 'Password updated successfully!']);