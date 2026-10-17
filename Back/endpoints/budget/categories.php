<?php
session_start();
require_once '../../header.php';

function category_payload(PDO $pdo): array {
    $categories = $pdo->query("
        SELECT c.id, c.name, c.percentage, c.allocated_amount, c.spent_amount,
               c.allocated_amount - c.spent_amount - COALESCE(SUM(s.allocated_amount), 0) AS balance
        FROM budget_categories c
        LEFT JOIN budget_subcategories s ON s.category_id = c.id
        GROUP BY c.id, c.name, c.percentage, c.allocated_amount, c.spent_amount
        ORDER BY c.id
    ")->fetchAll(PDO::FETCH_ASSOC);
    $subcategories = $pdo->query("
        SELECT id, category_id, name, allocated_amount, spent_amount,
               allocated_amount - spent_amount AS balance
        FROM budget_subcategories ORDER BY category_id, name
    ")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($categories as &$category) {
        $category['id'] = (int)$category['id'];
        $category['percentage'] = (float)$category['percentage'];
        $category['allocated_amount'] = (float)$category['allocated_amount'];
        $category['spent_amount'] = (float)$category['spent_amount'];
        $category['balance'] = (float)$category['balance'];
        $category['subcategories'] = [];
        foreach ($subcategories as $subcategory) {
            if ((int)$subcategory['category_id'] === $category['id']) {
                $subcategory['id'] = (int)$subcategory['id'];
                $subcategory['category_id'] = (int)$subcategory['category_id'];
                $subcategory['allocated_amount'] = (float)$subcategory['allocated_amount'];
                $subcategory['spent_amount'] = (float)$subcategory['spent_amount'];
                $subcategory['balance'] = (float)$subcategory['balance'];
                $category['subcategories'][] = $subcategory;
            }
        }
    }
    return $categories;
}

if (!isset($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Authentication required.']);
    exit();
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $data = json_decode(file_get_contents('php://input'), true) ?: [];

    if ($method === 'GET') {
        echo json_encode(['status' => 'success', 'data' => category_payload($pdo)]);
        exit;
    }

    if ($method !== 'POST' && $method !== 'PUT' && $method !== 'DELETE') {
        http_response_code(405);
        throw new Exception('Unsupported request method.');
    }

    if ($method !== 'GET' && ($_SESSION['role'] ?? '') === 'admin') {
        http_response_code(403);
        throw new Exception('Administrators cannot modify expenditure categories.');
    }

    $id = (int)($data['id'] ?? $_GET['id'] ?? 0);
    if ($method === 'DELETE') {
        $stmt = $pdo->prepare('SELECT spent_amount FROM budget_subcategories WHERE id = :id');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row || (float)$row['spent_amount'] > 0) {
            throw new Exception('A subcategory with expenditure history cannot be deleted.');
        }
        $pdo->prepare('DELETE FROM budget_subcategories WHERE id = :id')->execute(['id' => $id]);
    } else {
        $categoryId = (int)($data['category_id'] ?? 0);
        $name = trim((string)($data['name'] ?? ''));
        $amount = round((float)($data['allocated_amount'] ?? 0), 2);
        if ($categoryId < 1 || $name === '' || $amount <= 0) {
            throw new Exception('A category, name, and positive allocation are required.');
        }
        $pdo->beginTransaction();
        $category = $pdo->prepare('SELECT allocated_amount, spent_amount FROM budget_categories WHERE id = :id FOR UPDATE');
        $category->execute(['id' => $categoryId]);
        $parent = $category->fetch(PDO::FETCH_ASSOC);
        if (!$parent) throw new Exception('The selected category does not exist.');
        $used = $pdo->prepare('SELECT COALESCE(SUM(allocated_amount), 0) FROM budget_subcategories WHERE category_id = :category_id AND id <> :id');
        $used->execute(['category_id' => $categoryId, 'id' => $id]);
        $available = (float)$parent['allocated_amount'] - (float)$parent['spent_amount'] - (float)$used->fetchColumn();
        if ($amount > $available + 0.005) throw new Exception('The subcategory allocation exceeds the available category balance.');
        if ($method === 'POST') {
            $stmt = $pdo->prepare('INSERT INTO budget_subcategories (category_id, name, allocated_amount) VALUES (:category_id, :name, :amount)');
            $stmt->execute(['category_id' => $categoryId, 'name' => $name, 'amount' => $amount]);
        } else {
            $stmt = $pdo->prepare('UPDATE budget_subcategories SET category_id = :category_id, name = :name, allocated_amount = :amount WHERE id = :id');
            $stmt->execute(['category_id' => $categoryId, 'name' => $name, 'amount' => $amount, 'id' => $id]);
        }
        $pdo->commit();
    }
    echo json_encode(['status' => 'success', 'data' => category_payload($pdo)]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
