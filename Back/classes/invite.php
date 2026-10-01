<?php

class Invite {
    private PDO $database;

    public function __construct(PDO $pdo)
    {
        $this->database = $pdo;
    }

    // Check if a code is valid (not used, not expired)
    public function validate_code($code) {
        $stmt = $this->database->prepare('
            SELECT id, role, expires_at, used_by
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
        ];
    }

    // Generate a new code
    public function generate_code($role, $hours, $created_by = null) {
        $code = 'SAL1-'
              . strtoupper(bin2hex(random_bytes(2)))
              . '-'
              . strtoupper(bin2hex(random_bytes(2)));

        $stmt = $this->database->prepare('
            INSERT INTO invite_codes (code, role, expires_at, created_by)
            VALUES (:code, :role, DATE_ADD(NOW(), INTERVAL :hours HOUR), :created_by)
        ');
        $stmt->execute([
            'code'       => $code,
            'role'       => $role,
            'hours'      => $hours,
            'created_by' => $created_by,
        ]);

        return [
            'id'        => $this->database->lastInsertId(),
            'code'      => $code,
            'role'      => $role,
            'expiresAt' => date('Y-m-d H:i:s', strtotime("+$hours hours")),
            'usedBy'    => null,
        ];
    }

    // List all codes
    public function list_all() {
        $stmt = $this->database->query('
            SELECT id, code, role,
                   expires_at AS expiresAt,
                   used_by    AS usedBy,
                   used_at    AS usedAt,
                   created_at AS createdAt
            FROM invite_codes
            ORDER BY created_at DESC
        ');
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // Revoke a code
    public function revoke($id) {
        $stmt = $this->database->prepare('DELETE FROM invite_codes WHERE id = :id');
        $stmt->execute(['id' => $id]);
        return true;
    }

    // Mark a code as used by a specific user
    public function mark_used($code_id, $user_id) {
        $stmt = $this->database->prepare('
            UPDATE invite_codes
            SET used_by = :user_id, used_at = NOW()
            WHERE id = :id
        ');
        $stmt->execute(['user_id' => $user_id, 'id' => $code_id]);
    }
}