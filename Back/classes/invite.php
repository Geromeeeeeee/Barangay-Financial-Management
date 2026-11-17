<?php

class Invite {
    private PDO $database;

    public function __construct(PDO $pdo)
    {
        $this->database = $pdo;
    }

    public function validate_code($code) {
        $stmt = $this->database->prepare('
            SELECT id, role, email, expires_at, used_by
            FROM invite_codes
            WHERE code = :code
            LIMIT 1
        ');
        $stmt->execute(['code' => $code]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return ['valid' => false, 'message' => 'Invalid code'];
        }
        if ($row['used_by'] !== null) {
            return ['valid' => false, 'message' => 'Code already used'];
        }
        if (strtotime($row['expires_at']) < time()) {
            return ['valid' => false, 'message' => 'Code expired'];
        }

        return [
            'valid' => true,
            'id'    => $row['id'],
            'role'  => $row['role'],
            'email' => $row['email'],
        ];
    }

    public function generate_code($role, $email, $hours, $created_by = null) {
        $code = 'MAL2A-'
              . strtoupper(bin2hex(random_bytes(2)))
              . '-'
              . strtoupper(bin2hex(random_bytes(2)));

        $stmt = $this->database->prepare('
            INSERT INTO invite_codes (code, role, email, expires_at, created_by)
            VALUES (:code, :role, :email, DATE_ADD(NOW(), INTERVAL :hours HOUR), :created_by)
        ');
        $stmt->execute([
            'code'       => $code,
            'role'       => $role,
            'email'      => $email,
            'hours'      => $hours,
            'created_by' => $created_by,
        ]);

        $newId = $this->database->lastInsertId();

        require_once __DIR__ . '/mailer.php';
        $mailer = new Mailer();
        $mailer->sendInvite($email, $role, $code);

        $stmtFetch = $this->database->prepare('
            SELECT id, code, role, email, expires_at AS expiresAt, used_by AS usedBy, used_at AS usedAt, created_at AS createdAt
            FROM invite_codes
            WHERE id = :id
            LIMIT 1
        ');
        $stmtFetch->execute(['id' => $newId]);
        $row = $stmtFetch->fetch(PDO::FETCH_ASSOC);

        return [
            'id'        => $row['id'],
            'code'      => $row['code'],
            'role'      => $row['role'],
            'email'     => $row['email'],
            'expiresAt' => $row['expiresAt'],
            'usedBy'    => $row['usedBy'],
        ];
    }

    public function list_all() {
        $stmt = $this->database->query('
            SELECT id, code, role, email,
                   expires_at AS expiresAt,
                   used_by    AS usedBy,
                   used_at    AS usedAt,
                   created_at AS createdAt
            FROM invite_codes
            ORDER BY created_at DESC
        ');
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function revoke($id) {
        $stmt = $this->database->prepare('DELETE FROM invite_codes WHERE id = :id');
        $stmt->execute(['id' => $id]);
        return true;
    }

    public function mark_used($code_id, $user_id) {
        $stmt = $this->database->prepare('
            UPDATE invite_codes
            SET used_by = :user_id, used_at = NOW()
            WHERE id = :id
        ');
        $stmt->execute(['user_id' => $user_id, 'id' => $code_id]);
    }

    public function is_role_filled($role) {
        $normalizedRole = strtolower(str_replace([' ', '_'], '', trim($role)));

        $stmt = $this->database->prepare("
            SELECT COUNT(*) FROM users 
            WHERE LOWER(REPLACE(role, '_', '')) = :role
        ");
        $stmt->execute(['role' => $normalizedRole]);
        if ($stmt->fetchColumn() > 0) {
            return true;
        }

        $stmt = $this->database->prepare("
            SELECT COUNT(*) FROM invite_codes 
            WHERE LOWER(REPLACE(role, '_', '')) = :role 
              AND used_by IS NULL 
              AND expires_at > NOW()
        ");
        $stmt->execute(['role' => $normalizedRole]);
        if ($stmt->fetchColumn() > 0) {
            return true;
        }

        return false;
    }

    public function is_email_registered($email) {
        $stmt = $this->database->prepare("
            SELECT COUNT(*) FROM users 
            WHERE LOWER(email) = :email
        ");
        $stmt->execute(['email' => strtolower(trim($email))]);
        return $stmt->fetchColumn() > 0;
    }
}
?>