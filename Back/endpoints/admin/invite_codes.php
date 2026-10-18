<?php
session_start();

require_once '../../header.php';
require_once '../../classes/invite.php';

$data = json_decode(file_get_contents("php://input"), true);
$action = $data['action'] ?? $_GET['action'] ?? '';

$invite = new Invite($pdo);

// ===== LIST ALL =====
if($action === 'list'){
    echo json_encode($invite->list_all());
    exit();
}
// ===== CREATE =====
if($action === 'create'){
    $role  = $data['role'] ?? 'staff';
    $email = trim($data['email'] ?? '');
    $hours = (int)($data['expiresInHours'] ?? 24);
    $created_by = $_SESSION['uid'] ?? null;

    if (!$email) {
        echo json_encode(['success' => false, 'message' => 'Recipient email is required']);
        exit();
    }

    $result = $invite->generate_code($role, $email, $hours, $created_by); 
    
    // 👇 Explicit success response
    echo json_encode([
        'success' => true,
        'id'      => $result['id'],
        'code'    => $result['code'],
        'role'    => $result['role'],
        'email'   => $result['email'],
        'expiresAt' => $result['expiresAt']
    ]);
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