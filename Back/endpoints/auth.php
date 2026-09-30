<?php
session_start();

require_once '../header.php';
require_once '../classes/user.php';

$data = json_decode(file_get_contents("php://input"), true);

$email = $data['email'] ?? '';
$password = $data['password'] ?? '';
$action = $data['action'] ?? '';
$role = $data['role'] ?? '';
$first_name = $data['firstName'] ?? '';
$last_name = $data['lastName'] ?? '';
$username = $data['userName'] ?? '';

$user = new User($pdo);

if(isset($action) && !empty($action)){
    if($action === 'signup'){
        $result = $user->sign_up($email, $password, $first_name, $last_name, $role, $username);
        if($result){
            echo json_encode(["status"=>"account_created"]);
        } else {
            echo json_encode(["status"=>"email_taken"]);
        }
        exit();
    }
    if($action === 'login'){
        $result = $user->login($username, $password);
        if($result['success']){
            $_SESSION['uid'] = $result['user'];
            echo json_encode(['status'=>'logged']);
        } else {
            echo json_encode(['status'=>$result['status']]);
        }
        exit();
    }
    if($action === 'logOut'){
        $user->Logout();
        echo json_encode(['status'=>'logged_out']);
    }
}
?>