<?php
session_start();
require_once '../../header.php';

// Only Admins can see Audit Logs
if (strtolower($_SESSION['role'] ?? '') !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit();
}

$stmt = $pdo->query("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));