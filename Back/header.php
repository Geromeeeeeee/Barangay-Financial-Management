<?php
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($origin && preg_match('#^http://localhost(:\d+)?$#', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
    header("Access-Control-Allow-Credentials: true");
}

header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, PATCH, DELETE");
header("Content-Type: application/json");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ===== DATABASE =====
$server   = "localhost";
$username = "root";
$password = "";
$dbname   = "capstone_db";
$charset  = "utf8mb4";

try {
    $dsn = "mysql:host=$server;dbname=$dbname;charset=$charset";
    $pdo = new PDO($dsn, $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo "Connection Failed: " . $e->getMessage();
}