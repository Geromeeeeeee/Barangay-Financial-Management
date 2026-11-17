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
            (
                SELECT COUNT(ea.id)
                FROM expenditure_attachments ea
                JOIN expenditures e ON ea.expenditure_id = e.id
                WHERE al.details LIKE CONCAT('%', e.description, '%')
                  AND e.created_at >= al.created_at - INTERVAL 10 SECOND
                  AND e.created_at <= al.created_at + INTERVAL 10 SECOND
            ) + (
                SELECT COUNT(ra.id)
                FROM revenue_attachments ra
                JOIN revenues r ON ra.revenue_id = r.id
                WHERE al.details LIKE CONCAT('%', r.source, '%')
                  AND r.created_at >= al.created_at - INTERVAL 10 SECOND
                  AND r.created_at <= al.created_at + INTERVAL 10 SECOND
            ) AS attachment_count,
            (
                SELECT GROUP_CONCAT(ea.file_path ORDER BY ea.id SEPARATOR '||')
                FROM expenditure_attachments ea
                JOIN expenditures e ON ea.expenditure_id = e.id
                WHERE al.details LIKE CONCAT('%', e.description, '%')
                  AND e.created_at >= al.created_at - INTERVAL 10 SECOND
                  AND e.created_at <= al.created_at + INTERVAL 10 SECOND
            ) AS expenditure_paths,
            (
                SELECT GROUP_CONCAT(ra.file_path ORDER BY ra.id SEPARATOR '||')
                FROM revenue_attachments ra
                JOIN revenues r ON ra.revenue_id = r.id
                WHERE al.details LIKE CONCAT('%', r.source, '%')
                  AND r.created_at >= al.created_at - INTERVAL 10 SECOND
                  AND r.created_at <= al.created_at + INTERVAL 10 SECOND
            ) AS revenue_paths
        FROM audit_logs al
        ORDER BY al.created_at DESC
        LIMIT 100
    ");
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($logs as &$log) {
        $log['attachment_count'] = (int)$log['attachment_count'];
        
        $allPaths = [];
        if (!empty($log['expenditure_paths'])) {
            $allPaths = array_merge($allPaths, explode('||', $log['expenditure_paths']));
        }
        if (!empty($log['revenue_paths'])) {
            $allPaths = array_merge($allPaths, explode('||', $log['revenue_paths']));
        }
        
        $log['attachment_paths'] = $allPaths;
        unset($log['expenditure_paths'], $log['revenue_paths']);
    }
    unset($log);
    
    echo json_encode($logs);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}