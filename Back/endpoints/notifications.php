<?php
session_start();
require_once '../header.php';

if (!isset($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Authentication required.']);
    exit();
}

$userId = (int)$_SESSION['uid'];

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->prepare("
            SELECT id, username, action, details, is_read, created_at
            FROM audit_logs
            WHERE user_id = :user_id
            ORDER BY created_at DESC
            LIMIT 50
        ");
        $stmt->execute(['user_id' => $userId]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        exit();
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['status' => 'error', 'message' => 'Method not allowed.']);
        exit();
    }

    $data = json_decode(file_get_contents('php://input'), true) ?: [];
    if (($data['action'] ?? '') !== 'mark_all_read') {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Invalid notification action.']);
        exit();
    }

    $stmt = $pdo->prepare("
        UPDATE audit_logs
        SET is_read = 1
        WHERE user_id = :user_id AND is_read = 0
    ");
    $stmt->execute(['user_id' => $userId]);

    echo json_encode([
        'status' => 'success',
        'updated' => $stmt->rowCount()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Unable to update notifications.']);
}
