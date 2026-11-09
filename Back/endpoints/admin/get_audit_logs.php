<?php
session_start();
require_once '../../header.php';

if (strtolower($_SESSION['role'] ?? '') !== 'admin') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit();
}

try {
    $stmt = $pdo->query("
        SELECT 
            al.id, 
            al.username, 
            al.action, 
            al.details, 
            al.created_at,
            ea.file_path AS attachment_path
        FROM audit_logs al
        LEFT JOIN expenditures e 
            ON al.details LIKE CONCAT('%', e.description, '%')
            AND e.created_at >= al.created_at - INTERVAL 10 SECOND
            AND e.created_at <= al.created_at + INTERVAL 10 SECOND
        LEFT JOIN expenditure_attachments ea 
            ON ea.expenditure_id = e.id
        ORDER BY al.created_at DESC
        LIMIT 100
    ");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}