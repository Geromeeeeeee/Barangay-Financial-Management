<?php
session_start();

require_once '../header.php';
require_once '../classes/user.php';

if (!isset($_SESSION['uid'])) {
    echo json_encode(['status' => 'not_logged']);
    exit();
}

$user = new User($pdo);
$u = $user->get_user_by_id($_SESSION['uid']);

if (!$u) {
    echo json_encode(['status' => 'not_logged']);
    exit();
}

echo json_encode([
    'status' => 'logged',
    'user' => [
        'id'        => $u['id'],
        'username'  => $u['username'],
        'firstName' => $u['first_name'],
        'lastName'  => $u['last_name'],
        'email'     => $u['email'],
        'role'      => $u['role'],
    ]
]);