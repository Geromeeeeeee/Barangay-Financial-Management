<?php
session_start();

require_once '../header.php';
require_once '../classes/user.php';
require_once '../classes/invite.php';

$data = json_decode(file_get_contents("php://input"), true);

$email        = $data['email']       ?? '';
$password     = $data['password']    ?? '';
$action       = $data['action']      ?? '';
$role         = $data['role']        ?? '';
$first_name   = $data['firstName']   ?? '';
$last_name    = $data['lastName']    ?? '';
$username     = $data['userName']    ?? '';
$invite_code  = $data['inviteCode']  ?? '';

$user = new User($pdo);

if(isset($action) && !empty($action)){

    // ============ SIGN UP ============
    if($action === 'signup'){
        $result = $user->sign_up(
            $email, $password, $first_name, $last_name,
            $role, $username, $invite_code
        );

        if($result['success']){
            echo json_encode(['status' => 'account_pending']);
        } else {
            echo json_encode([
                'status'  => $result['status'],
                'message' => $result['message'] ?? null,
            ]);
        }
        exit();
    }

    // ============ LOGIN ============
    if($action === 'login'){
        $result = $user->login($username, $password);
        if($result['success']){
            $_SESSION['uid']  = $result['user']['id'];
            $_SESSION['role'] = $result['user']['role'];

            echo json_encode([
                'status' => 'logged',
                'user' => [
                    'id'        => $result['user']['id'],
                    'username'  => $result['user']['username'],
                    'firstName' => $result['user']['first_name'],
                    'lastName'  => $result['user']['last_name'],
                    'email'     => $result['user']['email'],
                    'role'      => $result['user']['role'],
                ]
            ]);
        } else {
            echo json_encode(['status'=>$result['status']]);
        }
        exit();
    }

    // ============ LOGOUT ============
    if($action === 'logOut'){
        $user->Logout();
        echo json_encode(['status'=>'logged_out']);
        exit();
    }

    // ============ VALIDATE INVITE ============
    if($action === 'validateInvite'){
        $invite = new Invite($pdo);
        $check = $invite->validate_code($invite_code);
        echo json_encode($check);
        exit();
    }

    // ============ GET CURRENT USER (for session restore) ============
    if($action === 'me'){
        if(!isset($_SESSION['uid'])){
            echo json_encode(['success' => false, 'message' => 'Not logged in']);
            exit();
        }
        $u = $user->get_user_by_id($_SESSION['uid']);
        if(!$u){
            echo json_encode(['success' => false, 'message' => 'User not found']);
            exit();
        }
        echo json_encode([
            'success' => true,
            'user' => [
                'id'         => $u['id'],
                'username'   => $u['username'],
                'firstName'  => $u['first_name'],
                'lastName'   => $u['last_name'],
                'email'      => $u['email'],
                'role'       => $u['role'],
            ]
        ]);
        exit();
    }

    // Unknown action
    echo json_encode(['status' => 'invalid_action']);
    exit();
}