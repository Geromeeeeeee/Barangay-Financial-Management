<?php
session_start();
require_once '../../header.php';
require_once '../../classes/budget.php';

if (!isset($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Authentication required.']);
    exit();
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $stmt = $pdo->query('
            SELECT i.id, i.name, i.category_id, c.name AS category_name,
                   COALESCE(SUM(a.amount), 0) AS allocated_amount,
                   COALESCE((SELECT SUM(e.amount) FROM expenditures e WHERE e.budget_item_id = i.id), 0) AS spent_amount
            FROM budget_items i
            JOIN budget_categories c ON c.id = i.category_id
            LEFT JOIN monthly_budget_allocations a ON a.budget_item_id = i.id
            GROUP BY i.id, i.name, i.category_id, c.name
            ORDER BY c.id, i.name
        ');
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($items as &$item) {
            $item['id'] = (int)$item['id'];
            $item['category_id'] = (int)$item['category_id'];
            $item['allocated_amount'] = (float)$item['allocated_amount'];
            $item['spent_amount'] = (float)$item['spent_amount'];
            $item['balance'] = round($item['allocated_amount'] - $item['spent_amount'], 2);
        }
        echo json_encode(['status' => 'success', 'data' => $items]);
        exit();
    }

    if (strtolower((string)($_SESSION['role'] ?? '')) !== 'treasurer') {
        throw new InvalidArgumentException('Only treasurers can create budget items.');
    }
    $data = json_decode(file_get_contents('php://input'), true) ?: [];
    $name = trim((string)($data['name'] ?? ''));
    $categoryId = (int)($data['category_id'] ?? 0);
    if ($name === '' || $categoryId < 1) {
        throw new InvalidArgumentException('A budget item name and major category are required.');
    }
    $stmt = $pdo->prepare('
        INSERT INTO budget_items (category_id, name) VALUES (:category_id, :name)
    ');
    $stmt->execute(['category_id' => $categoryId, 'name' => $name]);
    echo json_encode(['status' => 'success', 'id' => (int)$pdo->lastInsertId()]);
} catch (PDOException $e) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getCode() === '23000' ? 'That budget item already exists in the selected category.' : $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
