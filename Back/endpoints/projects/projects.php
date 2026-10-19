<?php
session_start();
require_once '../../header.php';

$data = json_decode(file_get_contents("php://input"), true);
$action = $data['action'] ?? $_GET['action'] ?? 'list';

if ($action === 'list') {
    $stmt = $pdo->query("
        SELECT p.*, u.first_name, u.last_name 
        FROM projects p 
        JOIN users u ON p.requested_by = u.id 
        ORDER BY p.created_at DESC
    ");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    exit();
}

if ($action === 'update_status') {
    $id = (int)$data['id'];
    $status = $data['status']; // 'approved' or 'rejected'
    $reviewer_id = $_SESSION['uid'] ?? null;

    $stmt = $pdo->prepare("UPDATE projects SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?");
    $stmt->execute([$status, $reviewer_id, $id]);
    
    echo json_encode(['success' => true]);
    exit();
}