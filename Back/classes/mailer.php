<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Use Composer's autoloader
require_once __DIR__ . '/../vendor/autoload.php';

class Mailer {
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
            error_log("MAILER ERROR: " . $mail->ErrorInfo);
            return false;
        }
    }
}