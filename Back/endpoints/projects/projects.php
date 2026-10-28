<?php
session_start();
require_once '../../header.php';

$data = json_decode(file_get_contents("php://input"), true) ?: [];
$action = $data['action'] ?? $_GET['action'] ?? 'list';

if ($action === 'list') {
    if (!isset($_SESSION['uid'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Authentication required.']);
        exit();
    }
    $isTreasurer = strtolower((string)($_SESSION['role'] ?? '')) === 'treasurer';
    $isSkChair = strtolower((string)($_SESSION['role'] ?? '')) === 'sk_chairman';
    if (!$isTreasurer && !$isSkChair) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'You are not authorized to view fund requests.']);
        exit();
    }
    $where = $isTreasurer ? '' : 'WHERE p.requested_by = :requested_by';
    $stmt = $pdo->prepare("
        SELECT p.*, u.first_name, u.last_name 
        FROM projects p 
        JOIN users u ON p.requested_by = u.id 
        {$where}
        ORDER BY p.created_at DESC
    ");
    if (!$isTreasurer) {
        $stmt->execute(['requested_by' => $_SESSION['uid']]);
    } else {
        $stmt->execute();
    }
    $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $attachments = $pdo->query('
        SELECT id, project_id, file_name, file_type, file_size
        FROM project_attachments ORDER BY id
    ')->fetchAll(PDO::FETCH_ASSOC);
    foreach ($projects as &$project) {
        $project['attachments'] = array_values(array_filter(
            $attachments,
            static fn($attachment) => (int)$attachment['project_id'] === (int)$project['id']
        ));
    }
    unset($project);
    echo json_encode($projects);
    exit();
}

if ($action === 'update_status') {
    if (!isset($_SESSION['uid']) || strtolower((string)($_SESSION['role'] ?? '')) !== 'treasurer') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Only authorized Treasurers can review fund requests.']);
        exit();
    }
    $id = (int)$data['id'];
    $status = strtolower((string)($data['status'] ?? ''));
    if ($status === 'rejected') {
        $status = 'declined';
    }
    if (!in_array($status, ['approved', 'declined'], true) || $id < 1) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid fund request decision.']);
        exit();
    }

    try {
        $pdo->beginTransaction();
        $request = $pdo->prepare('SELECT * FROM projects WHERE id = :id FOR UPDATE');
        $request->execute(['id' => $id]);
        $project = $request->fetch(PDO::FETCH_ASSOC);
        if (!$project) {
            throw new InvalidArgumentException('Fund request not found.');
        }
        if (strtolower((string)$project['status']) !== 'pending') {
            throw new InvalidArgumentException('Only pending fund requests can be reviewed.');
        }

        $subcategoryId = null;
        if ($status === 'approved') {
            require_once '../../classes/budget.php';
            Budget::refreshAllocations($pdo);
            $category = $pdo->prepare('
                SELECT c.id, c.allocated_amount, c.spent_amount,
                       COALESCE(SUM(s.allocated_amount), 0) AS reserved_amount
                FROM budget_categories c
                LEFT JOIN budget_subcategories s ON s.category_id = c.id
                WHERE c.name = "SK"
                GROUP BY c.id, c.allocated_amount, c.spent_amount
                FOR UPDATE
            ');
            $category->execute();
            $sk = $category->fetch(PDO::FETCH_ASSOC);
            if (!$sk) {
                throw new RuntimeException('The SK budget category does not exist.');
            }
            $available = (float)$sk['allocated_amount'] - (float)$sk['spent_amount'] - (float)$sk['reserved_amount'];
            $amount = round((float)$project['estimated_cost'], 2);
            if ($amount <= 0 || $amount > $available + 0.005) {
                throw new InvalidArgumentException('The requested amount exceeds the available SK allocation.');
            }

            $name = trim((string)$project['title']);
            if (strlen($name) > 120) {
                $name = substr($name, 0, 120);
            }
            $duplicate = $pdo->prepare('SELECT id FROM budget_subcategories WHERE category_id = :category_id AND name = :name');
            $duplicate->execute(['category_id' => $sk['id'], 'name' => $name]);
            if ($duplicate->fetchColumn()) {
                $suffix = ' #' . $id;
                $name = substr($name, 0, 120 - strlen($suffix)) . $suffix;
            }
            $insert = $pdo->prepare('
                INSERT INTO budget_subcategories (category_id, name, allocated_amount)
                VALUES (:category_id, :name, :amount)
            ');
            $insert->execute(['category_id' => $sk['id'], 'name' => $name, 'amount' => $amount]);
            $subcategoryId = (int)$pdo->lastInsertId();
        }

        $update = $pdo->prepare('
            UPDATE projects
            SET status = :status, reviewed_by = :reviewed_by, reviewed_at = NOW(),
                approved_subcategory_id = :subcategory_id
            WHERE id = :id AND status = "pending"
        ');
        $update->execute([
            'status' => $status,
            'reviewed_by' => $_SESSION['uid'],
            'subcategory_id' => $subcategoryId,
            'id' => $id,
        ]);
        if ($update->rowCount() !== 1) {
            throw new RuntimeException('The fund request could not be updated.');
        }
        $pdo->commit();
        echo json_encode(['success' => true, 'message' => "Fund request {$status}."]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code($e instanceof InvalidArgumentException ? 400 : 500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit();
}