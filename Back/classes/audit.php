<?php

class Audit {
    private PDO $database;

    public function __construct(PDO $pdo)
    {
        $this->database = $pdo;
    }

    public function log($action, $details = null) {
        // Get user info from session if available
        $userId = $_SESSION['uid'] ?? null;
        $username = 'System/Guest';

        if ($userId) {
            // Fetch username from db to ensure accuracy
            $stmt = $this->database->prepare("SELECT username FROM users WHERE id = :id");
            $stmt->execute(['id' => $userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($user) {
                $username = $user['username'];
            }
        }

        // Insert log
        $stmt = $this->database->prepare("
            INSERT INTO audit_logs (user_id, username, action, details) 
            VALUES (:uid, :uname, :action, :details)
        ");
        $stmt->execute([
            'uid' => $userId,
            'uname' => $username,
            'action' => $action,
            'details' => $details
        ]);
    }
}