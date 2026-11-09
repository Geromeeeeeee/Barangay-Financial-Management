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
            $targetRoles = ['admin'];

            $moneyKeywords = ['Revenue', 'Expenditure', 'Allocate', 'Budget', 'Fund'];
            $isMoneyAction = false;
            foreach ($moneyKeywords as $keyword) {
                if (stripos($action, $keyword) !== false) {
                    $isMoneyAction = true;
                    break;
                }
            }

            if ($isMoneyAction) {
                $targetRoles[] = 'treasurer';
            }

            $placeholders = implode(',', array_fill(0, count($targetRoles), '?'));
            $recipientStmt = $this->database->prepare("SELECT id FROM users WHERE role IN ($placeholders)");
            $recipientStmt->execute($targetRoles);
            $recipients = $recipientStmt->fetchAll(PDO::FETCH_COLUMN);

            if (!empty($recipients)) {
                $notifStmt = $this->database->prepare("
                    INSERT INTO notifications (user_id, title, message, created_at) 
                    VALUES (:user_id, :title, :message, NOW())
                ");

                foreach ($recipients as $recipientId) {
                    if ($recipientId != $userId) {
                        $notifStmt->execute([
                            ':user_id' => $recipientId,
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