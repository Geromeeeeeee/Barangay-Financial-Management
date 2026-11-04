<?php
session_start();
require_once '../../header.php';
require_once '../../classes/audit.php';

if (!isset($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);
$id = $data['id'] ?? null;
$status = $data['status'] ?? null;
$purpose = $data['purpose'] ?? null;

if (!$id || !$status) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'ID and Status are required.']);
    exit();
}

try {
    $stmt = $pdo->prepare("UPDATE clearances SET status = :status, purpose = :purpose WHERE id = :id AND issued_by = :uid");
    $stmt->execute([
        'status' => $status,
        'purpose' => $purpose,
        'id' => $id,
        'uid' => $_SESSION['uid']
    ]);

    $audit = new Audit($pdo);
    $audit->log('Update Clearance', "Updated clearance #{$id} status to {$status}");

    echo json_encode(['status' => 'success', 'message' => 'Clearance updated.']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}