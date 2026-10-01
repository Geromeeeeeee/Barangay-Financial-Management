<?php
session_start();

require_once '../../header.php';
require_once '../../classes/user.php';

$data = json_decode(file_get_contents("php://input"), true);
$action = $data['action'] ?? $_GET['action'] ?? '';

$user = new User($pdo);

// TODO: add admin check later

// ===== LIST PENDING =====
if($action === 'list'){
    echo json_encode($user->get_pending());
    exit();
}

// ===== APPROVE =====
if($action === 'approve'){
    $id = (int)($data['id'] ?? 0);
    $admin_id = $_SESSION['uid'] ?? null;
    $ok = $user->approve($id, $admin_id);
    echo json_encode(['success' => $ok]);
    exit();
}

// ===== REJECT =====
if($action === 'reject'){
    $id = (int)($data['id'] ?? 0);
    $admin_id = $_SESSION['uid'] ?? null;
    $ok = $user->reject($id, $admin_id);
    echo json_encode(['success' => $ok]);
    exit();
}

echo json_encode(['status' => 'invalid_action']);