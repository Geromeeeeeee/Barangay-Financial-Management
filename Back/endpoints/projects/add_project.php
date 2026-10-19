<?php
session_start();
require_once '../../header.php';

$data = json_decode(file_get_contents("php://input"), true);
$title = $data['title'] ?? '';
$desc = $data['description'] ?? '';
$cost = (float)($data['estimated_cost'] ?? 0);
$requested_by = $_SESSION['uid'] ?? null;

if (!$requested_by) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']); exit();
}

$stmt = $pdo->prepare("INSERT INTO projects (title, description, estimated_cost, requested_by) VALUES (?, ?, ?, ?)");
$stmt->execute([$title, $desc, $cost, $requested_by]);

echo json_encode(['success' => true, 'message' => 'Project requested successfully']);