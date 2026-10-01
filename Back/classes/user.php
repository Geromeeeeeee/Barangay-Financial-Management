<?php

class User {
    private PDO $database;

    public function __construct(PDO $pdo)
    {
        $this->database = $pdo;
    }

    public function get_user ($username){
        $stmt = $this->database->prepare('SELECT * FROM users WHERE username = :username');
        $stmt->execute(['username' => $username]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function get_user_by_id ($id){
        $stmt = $this->database->prepare('SELECT * FROM users WHERE id = :id LIMIT 1');
        $stmt->execute(['id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function get_user_uid ($uid){
        $stmt = $this->database->prepare('SELECT password FROM users WHERE id = :user_id');
        $stmt->execute(['user_id' => $uid]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // ===== LOGIN =====
    public function login ($username, $password){
        $user = $this->get_user($username);

        if(!$user){
            return([
                'success' => false,
                'status' => 'account_not_found'
            ]);
        }

        if(!password_verify($password, $user['password'])){
            return([
                'success' => false,
                'status' => 'Incorrect_password'
            ]);
        }

        if(isset($user['status'])){
            if($user['status'] === 'pending'){
                return([
                    'success' => false,
                    'status' => 'pending_approval'
                ]);
            }
            if($user['status'] === 'rejected'){
                return([
                    'success' => false,
                    'status' => 'account_rejected'
                ]);
            }
        }

        // Return full user info (needed for role-based UI)
        return([
            'success' => true,
            'user' => [
                'id'         => $user['id'],
                'username'   => $user['username'],
                'first_name' => $user['first_name'],
                'last_name'  => $user['last_name'],
                'email'      => $user['email'],
                'role'       => $user['role'],
            ]
        ]);
    }

    // ===== SIGN UP =====
    public function sign_up ($email, $password, $first_name, $last_name, $role, $username, $invite_code) {
        require_once __DIR__ . '/invite.php';
        $invite = new Invite($this->database);
        $check = $invite->validate_code($invite_code);

        if (!$check['valid']) {
            return [
                'success' => false,
                'status'  => 'invalid_invite',
                'message' => $check['message']
            ];
        }

        if (!preg_match('/^(?![.])(?!.*[.]{2})(?![.])[a-z0-9.]{6,30}$/i', $username)) {
            return [
                'success' => false,
                'status'  => 'invalid_username',
                'message' => 'Username must be 6-30 characters, using only letters, numbers, and periods.'
            ];
        }

        if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*]{6,12}$/', $password)) {
            return [
                'success' => false,
                'status'  => 'weak_password',
                'message' => 'Password must be 6-12 characters with uppercase, lowercase, and a number.'
            ];
        }

        $user = $this->get_user($username);
        if ($user) {
            return [
                'success' => false,
                'status'  => 'username_taken'
            ];
        }

        $hashed_password = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $this->database->prepare("
            INSERT INTO users
                (username, email, password, first_name, last_name, role, status)
            VALUES
                (:username, :email, :password, :first_name, :last_name, :role, 'pending')
        ");
        $stmt->execute([
            'username'   => $username,
            'email'      => $email,
            'password'   => $hashed_password,
            'first_name' => $first_name,
            'last_name'  => $last_name,
            'role'       => strtolower($check['role']),
        ]);

        $new_user_id = $this->database->lastInsertId();

        $invite->mark_used($check['id'], $new_user_id);

        return [
            'success' => true,
            'status'  => 'account_pending'
        ];
    }

    public function Logout(){
        session_unset();
        session_destroy();
    }

    public function change_pass($old_pass, $new_pass, $uid){
        $curr_pass = $this->get_user_uid($uid);
        if(password_verify($old_pass, $curr_pass['password'])){
            $hash = password_hash($new_pass, PASSWORD_DEFAULT);
            $stmt = $this->database->prepare('UPDATE users SET password = :new_pass WHERE id = :user_id');
            $stmt->execute(['new_pass' => $hash, 'user_id' => $uid]);
            return true;
        }
        return false;
    }

    // ===== PENDING USERS (admin) =====
    public function get_pending(){
        $stmt = $this->database->query("
            SELECT id,
                   first_name AS firstName,
                   last_name  AS lastName,
                   username   AS userName,
                   email, role, status,
                   created_at AS createdAt
            FROM users
            WHERE status = 'pending'
            ORDER BY created_at ASC
        ");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    // ===== APPROVE =====
    public function approve($id, $admin_id = null){
        $stmt = $this->database->prepare("
            UPDATE users
            SET status = 'active', approved_by = :admin_id, approved_at = NOW()
            WHERE id = :id AND status = 'pending'
        ");
        $stmt->execute(['admin_id' => $admin_id, 'id' => $id]);
        return $stmt->rowCount() > 0;
    }

    // ===== REJECT =====
    public function reject($id, $admin_id = null){
        $stmt = $this->database->prepare("
            UPDATE users
            SET status = 'rejected', approved_by = :admin_id, approved_at = NOW()
            WHERE id = :id AND status = 'pending'
        ");
        $stmt->execute(['admin_id' => $admin_id, 'id' => $id]);
        return $stmt->rowCount() > 0;
    }
}