<?php
session_start();
require_once '../header.php';
$data = json_decode(file_get_contents("php://input"), true);
$action = $data['action'] ?? '';

if(isset($_SESSION['uid'])){
    echo json_encode(['status'=>'logged']);
} else {
    echo json_encode(['status'=>'logged_out']);
}

?>