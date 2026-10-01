<?php
session_start();

require_once '../../header.php';
require_once '../../classes/invite.php';

$data = json_decode(file_get_contents("php://input"), true);
$action = $data['action'] ?? $_GET['action'] ?? '';

$invite = new Invite($pdo);

// TODO: add admin check later — for now, open so you can test

// ===== LIST ALL =====
if($action === 'list'){
    echo json_encode($invite->list_all());
    exit();
}

// ===== CREATE =====
if($action === 'create'){
    $role  = $data['role'] ?? 'staff';
    $hours = (int)($data['expiresInHours'] ?? 24);
    $created_by = $_SESSION['uid'] ?? null;

    $result = $invite->generate_code($role, $hours, $created_by);
    echo json_encode($result);
    exit();
}

// ===== REVOKE =====
if($action === 'revoke'){
    $id = (int)($data['id'] ?? 0);
    $invite->revoke($id);
    echo json_encode(['success' => true]);
    exit();
}

echo json_encode(['status' => 'invalid_action']);