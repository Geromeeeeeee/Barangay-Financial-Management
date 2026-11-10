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
            COUNT(ea.id) AS attachment_count,
            GROUP_CONCAT(ea.file_path ORDER BY ea.id SEPARATOR '||') AS attachment_paths
        FROM audit_logs al
        LEFT JOIN expenditures e
            ON e.id = (
                SELECT e2.id
                FROM expenditures e2
                WHERE al.details LIKE CONCAT('%', e2.description, '%')
                  AND e2.created_at >= al.created_at - INTERVAL 10 SECOND
                  AND e2.created_at <= al.created_at + INTERVAL 10 SECOND
                ORDER BY ABS(TIMESTAMPDIFF(MICROSECOND, e2.created_at, al.created_at)), e2.id
                LIMIT 1
            )
        LEFT JOIN expenditure_attachments ea
            ON ea.expenditure_id = e.id
        GROUP BY al.id, al.username, al.action, al.details, al.created_at
        ORDER BY al.created_at DESC
        LIMIT 100
    ");
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($logs as &$log) {
        $log['attachment_count'] = (int)$log['attachment_count'];
        $log['attachment_paths'] = $log['attachment_paths'] === null
            ? []
            : explode('||', $log['attachment_paths']);
    }
    unset($log);
    echo json_encode($logs);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}