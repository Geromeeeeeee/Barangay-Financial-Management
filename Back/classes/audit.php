<?php

class Audit {
    private PDO $database;

    public function __construct(PDO $pdo)
    {
        $this->database = $pdo;
    }

    public function log($action, $details = null) {
        $userId = $_SESSION['uid'] ?? null;
        $username = 'System/Guest';

        if ($userId) {
            $stmt = $this->database->prepare("SELECT username FROM users WHERE id = :id");
            $stmt->execute(['id' => $userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($user) {
                $username = $user['username'];
            }
        }

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

        try {
            $adminStmt = $this->database->query("SELECT id FROM users WHERE role = 'admin'");
            $admins = $adminStmt->fetchAll(PDO::FETCH_COLUMN);

            if (!empty($admins)) {
                $notifStmt = $this->database->prepare("
                    INSERT INTO notifications (user_id, title, message, created_at) 
                    VALUES (:user_id, :title, :message, NOW())
                ");

                foreach ($admins as $adminId) {
                    if ($adminId != $userId) {
                        $notifStmt->execute([
                            ':user_id' => $adminId,
                            ':title' => $action,
                            ':message' => $details
                        ]);
                    }
                }
            }
        } catch (Exception $e) {
        }
    }
}