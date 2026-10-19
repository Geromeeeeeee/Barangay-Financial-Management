<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Use Composer's autoloader
require_once __DIR__ . '/../vendor/autoload.php';

class Mailer {
    
    // ===== 1. SEND INVITE CODE =====
    public function sendInvite($toEmail, $role, $code) {
        $mail = new PHPMailer(true);

        try {
            // Gmail SMTP Settings
            $mail->isSMTP();
            $mail->Host       = 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            
            $mail->Username   = $_ENV['MAIL_USERNAME'];
            $mail->Password   = $_ENV['MAIL_PASSWORD'];
            
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = 587;

            // Recipients
            $mail->setFrom($_ENV['MAIL_USERNAME'], 'Barangay Malagasang II-A');
            $mail->addAddress($toEmail);

            // Content
            $mail->isHTML(true);
            $mail->Subject = 'Your Barangay System Invite Code';
            $mail->Body    = "
                <h2>Welcome to Barangay Malagasang II-A</h2>
                <p>You have been invited to join as a <strong>{$role}</strong>.</p>
                <p>Your one-time invite code is:</p>
                <h1 style='color: #166534; letter-spacing: 2px;'>{$code}</h1>
                <p>Go to the system and click 'Request an account' to use this code.</p>
                <p><em>This code expires in 24 hours.</em></p>
            ";

            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log("MAILER ERROR (Invite): " . $mail->ErrorInfo);
            return false;
        }
    }

    // ===== 2. SEND PASSWORD RESET LINK =====
    public function sendPasswordReset($toEmail, $token) {
        $mail = new PHPMailer(true);

        try {
            // Gmail SMTP Settings
            $mail->isSMTP();
            $mail->Host       = 'smtp.gmail.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = $_ENV['MAIL_USERNAME'];
            $mail->Password   = $_ENV['MAIL_PASSWORD'];
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = 587;

            // Recipients
            $mail->setFrom($_ENV['MAIL_USERNAME'], 'Barangay Malagasang II-A');
            $mail->addAddress($toEmail);

            // Link goes to your React frontend
            $resetLink = "http://localhost:5173/reset-password?token=" . $token;

            // Content
            $mail->isHTML(true);
            $mail->Subject = 'Password Reset Request';
            $mail->Body    = "
                <h2>Password Reset</h2>
                <p>We received a request to reset the password for your Barangay System account.</p>
                <p>Click the button below to set a new password:</p>
                <p style='margin: 30px 0;'>
                    <a href='{$resetLink}' style='background: #166534; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;'>Reset My Password</a>
                </p>
                <p style='font-size: 12px; color: #666;'>Or copy and paste this link into your browser:<br>
                <a href='{$resetLink}'>{$resetLink}</a></p>
                <hr>
                <p><em>If you didn't request this, you can safely ignore this email. This link expires in 1 hour.</em></p>
            ";

            $mail->send();
            return true;
        } catch (Exception $e) {
            error_log("MAILER ERROR (Reset): " . $mail->ErrorInfo);
            return false;
        }
    }
}