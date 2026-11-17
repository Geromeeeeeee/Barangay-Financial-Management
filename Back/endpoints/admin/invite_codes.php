<?php
session_start();

require_once '../../header.php';
require_once '../../classes/invite.php';

$data = json_decode(file_get_contents("php://input"), true);
$action = $data['action'] ?? $_GET['action'] ?? '';

$invite = new Invite($pdo);


if($action === 'list'){
    echo json_encode($invite->list_all());
    exit();
}

if($action === 'create'){
    $role  = $data['role'] ?? 'staff';
    $email = trim($data['email'] ?? '');
    $hours = (int)($data['expiresInHours'] ?? 24);
    $created_by = $_SESSION['uid'] ?? null;

    if (!$email) {
        echo json_encode(['success' => false, 'message' => 'Recipient email is required']);
        exit();
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email address format. Please enter a valid email.']);
        exit();
    }

    $domain = substr(strrchr($email, "@"), 1);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || (!checkdnsrr($domain, "MX") && !checkdnsrr($domain, "A"))) {
        echo json_encode(['success' => false, 'message' => 'Email domain does not exist or cannot accept mail.']);
        exit();
    }

    $result = $invite->generate_code($role, $email, $hours, $created_by); 
    
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

if($action === 'revoke'){
    $id = (int)($data['id'] ?? 0);
    $invite->revoke($id);
    echo json_encode(['success' => true]);
    exit();
}

echo json_encode(['status' => 'invalid_action']);