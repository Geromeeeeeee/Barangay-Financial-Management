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
$residentName = trim($data['resident_name'] ?? '');
$clearanceType = trim($data['clearance_type'] ?? '');
$purpose = trim($data['purpose'] ?? '');
$status = $data['status'] ?? 'Issued';
$uid = $_SESSION['uid'];

if (empty($residentName) || empty($clearanceType)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Resident name and clearance type are required.']);
    exit();
}

try {
    $stmt = $pdo->prepare("INSERT INTO clearances (resident_name, clearance_type, purpose, issued_by, status) VALUES (:name, :type, :purpose, :uid, :status)");
    $stmt->execute([
        'name' => $residentName,
        'type' => $clearanceType,
        'purpose' => $purpose,
        'uid' => $uid,
        'status' => $status
    ]);

    $audit = new Audit($pdo);
    $audit->log('Issue Clearance', "Issued {$clearanceType} for {$residentName}");

    echo json_encode(['status' => 'success', 'message' => 'Clearance recorded successfully.']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}