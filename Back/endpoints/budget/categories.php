<?php
session_start();
require_once '../../header.php';
require_once '../../classes/budget.php';

function category_payload(PDO $pdo, bool $refreshAllocations = true): array {
    $income = $refreshAllocations ? Budget::refreshAllocations($pdo) : Budget::income($pdo);
    $categories = $pdo->query("
        SELECT c.id, c.name, c.percentage, c.is_custom, c.allocated_amount, c.spent_amount,
               c.allocated_amount - c.spent_amount AS balance
        FROM budget_categories c
        LEFT JOIN budget_subcategories s ON s.category_id = c.id
        GROUP BY c.id, c.name, c.percentage, c.is_custom, c.allocated_amount, c.spent_amount
        ORDER BY c.id
    ")->fetchAll(PDO::FETCH_ASSOC);
    $subcategories = $pdo->query("
        SELECT id, category_id, name, allocated_amount, spent_amount, is_active,
               allocated_amount - spent_amount AS balance,
               COALESCE((
                   SELECT SUM(a.amount)
                   FROM monthly_subcategory_allocations a
                   WHERE a.subcategory_id = budget_subcategories.id
               ), 0) AS monthly_allocated_amount,
               COALESCE((
                   SELECT SUM(e.amount)
                   FROM expenditures e
                   INNER JOIN monthly_subcategory_allocations a ON a.id = e.monthly_allocation_id
                   WHERE a.subcategory_id = budget_subcategories.id
               ), 0) AS monthly_spent_amount,
               COALESCE((
                   SELECT SUM(a.amount)
                   FROM monthly_subcategory_allocations a
                   WHERE a.subcategory_id = budget_subcategories.id
               ), 0) - COALESCE((
                   SELECT SUM(e.amount)
                   FROM expenditures e
                   INNER JOIN monthly_subcategory_allocations a ON a.id = e.monthly_allocation_id
                   WHERE a.subcategory_id = budget_subcategories.id
               ), 0) AS monthly_remaining_amount
        FROM budget_subcategories ORDER BY category_id, name
    ")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($categories as &$category) {
        $category['id'] = (int)$category['id'];
        $category['percentage'] = (float)$category['percentage'];
        $category['is_custom'] = (bool)$category['is_custom'];
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
                $subcategory['is_active'] = (bool)$subcategory['is_active'];
                $subcategory['balance'] = (float)$subcategory['balance'];
                $subcategory['monthly_allocated_amount'] = (float)$subcategory['monthly_allocated_amount'];
                $subcategory['monthly_spent_amount'] = (float)$subcategory['monthly_spent_amount'];
                $subcategory['monthly_remaining_amount'] = (float)$subcategory['monthly_remaining_amount'];
                $category['subcategories'][] = $subcategory;
            }
        }
    }
    return [
        'categories' => $categories,
        'income' => $income,
    ];
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
        $payload = category_payload($pdo);
        echo json_encode(['status' => 'success', 'data' => $payload['categories'], 'income' => $payload['income']]);
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
    if (($data['action'] ?? '') === 'add_major_category') {
        throw new Exception('Creating major categories is not supported. Use the predefined categories and their budget items.');
    }
    if ($method === 'DELETE') {
        $stmt = $pdo->prepare('
            SELECT s.category_id, s.spent_amount,
                   EXISTS(SELECT 1 FROM monthly_subcategory_allocations a WHERE a.subcategory_id = s.id)
                   OR EXISTS(SELECT 1 FROM expenditures e WHERE e.subcategory_id = s.id) AS has_history
            FROM budget_subcategories s
            WHERE s.id = :id
        ');
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            throw new Exception('The selected budget item does not exist.');
        }
        $pdo->beginTransaction();
        $pdo->prepare('UPDATE budget_subcategories SET is_active = 0 WHERE id = :id')->execute(['id' => $id]);
        $categoryName = $pdo->prepare('SELECT name FROM budget_categories WHERE id = :id');
        $categoryName->execute(['id' => $row['category_id']]);
        if (strcasecmp((string)$categoryName->fetchColumn(), 'MOOE') === 0) {
            Budget::refreshAllocations($pdo);
        }
        $pdo->commit();
    } else {
        $categoryId = (int)($data['category_id'] ?? 0);
        $name = trim((string)($data['name'] ?? ''));
        $hasNumericAmount = is_numeric($data['allocated_amount'] ?? null);
        $amount = round((float)($data['allocated_amount'] ?? 0), 2);
        if ($categoryId < 1 || $name === '' || $amount < 0) {
            throw new Exception('A category, name, and non-negative allocation are required.');
        }
        $pdo->beginTransaction();
        $category = $pdo->prepare('SELECT id, name, allocated_amount, spent_amount FROM budget_categories WHERE id = :id FOR UPDATE');
        $category->execute(['id' => $categoryId]);
        $parent = $category->fetch(PDO::FETCH_ASSOC);
        if (!$parent) throw new Exception('The selected category does not exist.');
        $isMooe = strcasecmp((string)$parent['name'], 'MOOE') === 0;
        if (!$isMooe && !$hasNumericAmount) {
            throw new Exception('A category, name, and non-negative allocation are required.');
        }
        $wasMooe = false;
        if ($isMooe) {
            $amount = 0;
        }
        $existing = $pdo->prepare('SELECT id, spent_amount FROM budget_subcategories WHERE category_id = :category_id AND LOWER(name) = LOWER(:name) AND id <> :id');
        $existing->execute(['category_id' => $categoryId, 'name' => $name, 'id' => $id]);
        if ($existing->fetchColumn()) {
            throw new Exception('A budget item with that name already exists in the selected category.');
        }
        if ($method === 'PUT') {
            $current = $pdo->prepare('
                SELECT category_id, allocated_amount, spent_amount,
                       EXISTS(SELECT 1 FROM monthly_subcategory_allocations a WHERE a.subcategory_id = budget_subcategories.id)
                       OR EXISTS(SELECT 1 FROM expenditures e WHERE e.subcategory_id = budget_subcategories.id) AS has_history
                FROM budget_subcategories
                WHERE id = :id
                FOR UPDATE
            ');
            $current->execute(['id' => $id]);
            $currentRow = $current->fetch(PDO::FETCH_ASSOC);
            if (!$currentRow) throw new Exception('The selected budget item does not exist.');
            $currentCategoryName = $pdo->prepare('SELECT name FROM budget_categories WHERE id = :id');
            $currentCategoryName->execute(['id' => $currentRow['category_id']]);
            $wasMooe = strcasecmp((string)$currentCategoryName->fetchColumn(), 'MOOE') === 0;
            if ((int)$currentRow['category_id'] !== $categoryId && (bool)$currentRow['has_history']) {
                throw new Exception('A budget item with allocation or expenditure history cannot change category.');
            }
            if (!$isMooe && $amount + 0.005 < (float)$currentRow['spent_amount']) {
                throw new Exception('The annual allocation cannot be less than the item\'s existing spending.');
            }
        }
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
        if ($isMooe || $wasMooe) {
            Budget::refreshAllocations($pdo);
        }
        $pdo->commit();
    }
    $payload = category_payload($pdo, false);
    echo json_encode(['status' => 'success', 'data' => $payload['categories'], 'income' => $payload['income']]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
