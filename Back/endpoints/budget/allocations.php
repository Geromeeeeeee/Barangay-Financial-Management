<?php
session_start();
require_once '../../header.php';
require_once '../../classes/audit.php';

if (!isset($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Authentication required.']);
    exit();
}

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $receipts = $pdo->query("
            SELECT r.id, r.receipt_date, r.amount, r.source,
                   COALESCE(SUM(a.amount), 0) AS allocated_amount,
                   r.amount - COALESCE(SUM(a.amount), 0) AS remaining_amount
            FROM revenues r
            LEFT JOIN monthly_subcategory_allocations a ON a.revenue_id = r.id
            WHERE r.record_type = 'monthly_receipt' AND r.status = 'verified'
            GROUP BY r.id, r.receipt_date, r.amount, r.source
            ORDER BY r.receipt_date DESC, r.id DESC
        ")->fetchAll(PDO::FETCH_ASSOC);

        $conditions = [];
        $parameters = [];
        if (isset($_GET['receipt_id']) && $_GET['receipt_id'] !== '') {
            $conditions[] = 'a.revenue_id = :receipt_id';
            $parameters['receipt_id'] = (int)$_GET['receipt_id'];
        }
        if (isset($_GET['subcategory_id']) && $_GET['subcategory_id'] !== '') {
            $conditions[] = 'a.subcategory_id = :subcategory_id';
            $parameters['subcategory_id'] = (int)$_GET['subcategory_id'];
        }
        $where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';
        $history = $pdo->prepare("
            SELECT a.id, a.revenue_id, a.subcategory_id, a.amount,
                   a.allocation_date, a.created_by, a.created_at,
                   r.receipt_date, r.source AS receipt_source,
                   s.name AS subcategory_name, s.category_id, s.is_active,
                   c.name AS category_name,
                   u.username AS created_by_username,
                   COALESCE(SUM(e.amount), 0) AS expenditure_amount,
                   a.amount - COALESCE(SUM(e.amount), 0) AS remaining_amount
            FROM monthly_subcategory_allocations a
            JOIN revenues r ON r.id = a.revenue_id AND r.status = 'verified'
            JOIN budget_subcategories s ON s.id = a.subcategory_id
            JOIN budget_categories c ON c.id = s.category_id
            LEFT JOIN users u ON u.id = a.created_by
            LEFT JOIN expenditures e
                ON e.monthly_allocation_id = a.id
                AND e.status = 'verified'
            {$where}
            GROUP BY a.id, a.revenue_id, a.subcategory_id, a.amount,
                     a.allocation_date, a.created_by, a.created_at,
                     r.receipt_date, r.source, s.name, s.category_id,
                     s.is_active, c.name, u.username
            ORDER BY a.allocation_date DESC, a.id DESC
        ");
        $history->execute($parameters);
        echo json_encode([
            'status' => 'success',
            'receipts' => $receipts,
            'history' => $history->fetchAll(PDO::FETCH_ASSOC),
        ]);
        exit();
    }

    $allowed_roles = ['treasurer', 'sk_chairman'];
    if (!in_array(strtolower((string)($_SESSION['role'] ?? '')), $allowed_roles, true)) {
        throw new InvalidArgumentException('Only authorized personnel can record monthly allocations.');
    }
    $data = json_decode(file_get_contents('php://input'), true) ?: [];
    $revenueId = (int)($data['revenue_id'] ?? 0);
    $subcategoryId = (int)($data['subcategory_id'] ?? 0);
    $itemType = $data['item_type'] ?? 'existing';
    $categoryId = (int)($data['category_id'] ?? 0);
    $itemName = trim((string)($data['name'] ?? ''));
    $amount = round((float)($data['amount'] ?? 0), 2);
    $allocationDate = (string)($data['allocation_date'] ?? date('Y-m-d'));
    $parsedDate = DateTime::createFromFormat('Y-m-d', $allocationDate);
    if ($revenueId < 1 || !in_array($itemType, ['existing', 'new'], true) || $amount <= 0
        || !$parsedDate || $parsedDate->format('Y-m-d') !== $allocationDate) {
        throw new InvalidArgumentException('A valid receipt, budget item, positive amount, and allocation date are required.');
    }
    if ($itemType === 'existing' && $subcategoryId < 1) {
        throw new InvalidArgumentException('An existing budget item is required.');
    }
    if ($itemType === 'new' && ($categoryId < 1 || $itemName === '')) {
        throw new InvalidArgumentException('A parent category and name are required for a new budget item.');
    }

    $pdo->beginTransaction();

    $receipt = $pdo->prepare("
        SELECT id, amount FROM revenues
        WHERE id = :id AND record_type = 'monthly_receipt' AND status = 'verified'
        FOR UPDATE
    ");
    $receipt->execute(['id' => $revenueId]);
    $receiptRow = $receipt->fetch(PDO::FETCH_ASSOC);
    if (!$receiptRow) {
        throw new InvalidArgumentException('The selected receipt is not a valid monthly receipt.');
    }

    if ($itemType === 'existing') {
        $subcategory = $pdo->prepare('SELECT id, name FROM budget_subcategories WHERE id = :id AND is_active = 1');
        $subcategory->execute(['id' => $subcategoryId]);
        if (!$subcategory->fetch(PDO::FETCH_ASSOC)) {
            throw new InvalidArgumentException('The selected budget item does not exist or is archived.');
        }
    } else {
        $category = $pdo->prepare('SELECT id FROM budget_categories WHERE id = :id');
        $category->execute(['id' => $categoryId]);
        if (!$category->fetchColumn()) {
            throw new InvalidArgumentException('The selected parent category does not exist.');
        }
        $duplicate = $pdo->prepare('
            SELECT id FROM budget_subcategories
            WHERE category_id = :category_id AND LOWER(name) = LOWER(:name)
        ');
        $duplicate->execute(['category_id' => $categoryId, 'name' => $itemName]);
        if ($duplicate->fetchColumn()) {
            throw new InvalidArgumentException('A budget item with that name already exists in the selected category.');
        }
        $createItem = $pdo->prepare('
            INSERT INTO budget_subcategories (category_id, name, allocated_amount, spent_amount, is_active)
            VALUES (:category_id, :name, 0, 0, 1)
        ');
        $createItem->execute(['category_id' => $categoryId, 'name' => $itemName]);
        $subcategoryId = (int)$pdo->lastInsertId();
    }

    $allocated = $pdo->prepare("
        SELECT COALESCE(SUM(amount), 0)
        FROM monthly_subcategory_allocations
        WHERE revenue_id = :revenue_id
    ");
    $allocated->execute(['revenue_id' => $revenueId]);
    $remaining = round((float)$receiptRow['amount'] - (float)$allocated->fetchColumn(), 2);
    if ($amount > $remaining + 0.005) {
        throw new InvalidArgumentException('The allocation exceeds the remaining receipt balance.');
    }

    $insert = $pdo->prepare("
        INSERT INTO monthly_subcategory_allocations
            (revenue_id, subcategory_id, amount, allocation_date, created_by)
        VALUES (:revenue_id, :subcategory_id, :amount, :allocation_date, :created_by)
    ");
    $insert->execute([
        'revenue_id' => $revenueId,
        'subcategory_id' => $subcategoryId,
        'amount' => $amount,
        'allocation_date' => $allocationDate,
        'created_by' => $_SESSION['uid'],
    ]);
    $allocationId = (int)$pdo->lastInsertId();

    $audit = new Audit($pdo);
    $audit->log(
        'Record Monthly Allocation',
        'Allocated ₱' . number_format($amount, 2) . ' from monthly receipt #' . $revenueId . ' to budget item #' . $subcategoryId
    );
    $pdo->commit();
    echo json_encode(['status' => 'success', 'id' => $allocationId]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
