<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();
require_once '../config/database.php'; 

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Unauthorized. Please log in."]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->current_password) || !isset($data->new_password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Please fill in all fields."]);
    exit();
}

$user_id = $_SESSION['user_id'];
$current_password = $data->current_password;
$new_password = $data->new_password;

try {
    $database = new Database();
    $db = $database->getConnection();

    $stmt = $db->prepare("SELECT password FROM users WHERE id = :id");
    $stmt->execute([':id' => $user_id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "User not found."]);
        exit();
    }

    if (!password_verify($current_password, $user['password'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Current password is incorrect."]);
        exit();
    }

    $new_hashed_password = password_hash($new_password, PASSWORD_DEFAULT);

    $updateStmt = $db->prepare("UPDATE users SET password = :password WHERE id = :id");
    $updateStmt->execute([
        ':password' => $new_hashed_password,
        ':id' => $user_id
    ]);

    $auditStmt = $db->prepare("INSERT INTO audit_logs (user_id, action, details, created_at) VALUES (:user_id, 'Password Change', 'User changed their account password', NOW())");
    $auditStmt->execute([':user_id' => $user_id]);

    echo json_encode(["success" => true, "message" => "Password updated successfully."]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>