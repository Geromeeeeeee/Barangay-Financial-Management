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
        return $stmt -> fetch(PDO::FETCH_ASSOC);
    }

    public function get_user_uid ($uid){
        $stmt = $this->database->prepare('SELECT password FROM users WHERE id = :user_id');
        $stmt->execute(['user_id' => $uid]);
        return $stmt -> fetch(PDO::FETCH_ASSOC);
    }

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

        return([
            'success' => true,
            'user' => $user['id']
        ]);
    }

    public function sign_up ($email, $password, $first_name, $last_name, $role, $username){
        $user = $this->get_user($username);
        
        if(!$user){
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $this->database->prepare('INSERT INTO users (username, email, password, first_name, last_name, role) VALUES (:username, :email, :password, :first_name, :last_name, :role)');
            $stmt->execute(['username'=>$username, 'email'=>$email, 'password'=>$hashed_password, 'first_name'=>$first_name,'last_name'=>$last_name, 'role'=>$role]);
            return true;
        }

        return false;
    }

    public function Logout(){
        session_unset();
        session_destroy();
    }

    public function change_pass($old_pass, $new_pass, $uid){
        $curr_pass = $this->get_user_uid($uid);
        if(password_verify($old_pass, $curr_pass['password'])){
            $hash = password_hash($new_pass, PASSWORD_DEFAULT);
            $stmt = $this->database->prepare('UPDATE user_account SET password = :new_pass WHERE user_id = :user_id');
            $stmt->execute(['new_pass' => $hash, 'user_id' => $uid]);
            return true;
        }   

        return false;
    }
}
?>