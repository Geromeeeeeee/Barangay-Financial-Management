<?php
session_start();
require_once '../header.php';
require_once '../classes/mailer.php';

$data = json_decode(file_get_contents("php://input"), true);
$email = trim($data['email'] ?? '');

if (!$email) {
    echo json_encode(['success' => false, 'message' => 'Email required']); exit();
}

$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if ($user) {
    $token = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));

    // Save token to DB
    $stmt = $pdo->prepare("UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?");
    $stmt->execute([$token, $expires, $email]);

    // Send email
    $mailer = new Mailer();
    $mailer->sendPasswordReset($email, $token);
}
echo json_encode(['success' => true, 'message' => 'If that email exists, a reset link has been sent.']);