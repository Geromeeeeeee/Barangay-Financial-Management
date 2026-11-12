<?php
session_start();
require_once '../../header.php';
require_once '../../classes/audit.php';

if (!isset($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Authentication required.']);
    exit();
}

$role = strtolower((string)($_SESSION['role'] ?? ''));
if ($role !== 'admin') {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Only administrators can update manual override statuses.']);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true) ?? [];
$expenditureId = $data['id'] ?? null;
$actionStatus  = $data['status'] ?? null;

if (!$expenditureId || !in_array($actionStatus, ['verified', 'rejected'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Valid expenditure ID and action status are required.']);
    exit();
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("SELECT * FROM expenditures WHERE id = :id FOR UPDATE");
    $stmt->execute(['id' => $expenditureId]);
    $exp = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$exp) {
        throw new Exception('Expenditure record not found.');
    }

    $currentStatus = $exp['status'];
    if ($currentStatus === $actionStatus) {
        throw new Exception("This expenditure is already {$actionStatus}.");
    }

    if ($actionStatus === 'verified' && $currentStatus !== 'pending') {
        throw new Exception('Only pending expenditures can be verified.');
    }
    if ($actionStatus === 'rejected' && !in_array($currentStatus, ['pending', 'verified'], true)) {
        throw new Exception('Only pending or verified expenditures can be rejected.');
    }

    $amount = (float)$exp['amount'];
    $categoryId = $exp['category_id'];
    $subcategoryId = $exp['subcategory_id'];

    if ($actionStatus === 'verified' && $exp['monthly_allocation_id']) {
        $allocation = $pdo->prepare('
            SELECT amount
            FROM monthly_subcategory_allocations
            WHERE id = :id
            FOR UPDATE
        ');
        $allocation->execute(['id' => $exp['monthly_allocation_id']]);
        $allocationAmount = $allocation->fetchColumn();
        if ($allocationAmount === false) {
            throw new Exception('The expenditure monthly allocation could not be found.');
        }

        $verifiedExpenditures = $pdo->prepare('
            SELECT COALESCE(SUM(amount), 0)
            FROM expenditures
            WHERE monthly_allocation_id = :monthly_allocation_id
              AND status = \'verified\'
        ');
        $verifiedExpenditures->execute([
            'monthly_allocation_id' => $exp['monthly_allocation_id'],
        ]);
        $verifiedAmount = (float)$verifiedExpenditures->fetchColumn();
        if ($verifiedAmount + $amount > (float)$allocationAmount + 0.005) {
            throw new Exception('The selected monthly allocation has insufficient balance.');
        }
    }

    if ($categoryId && ($actionStatus === 'verified' || $currentStatus === 'verified')) {
        $isReversal = $actionStatus === 'rejected' && $currentStatus === 'verified';
        if ($subcategoryId) {
            $updateSub = $pdo->prepare($isReversal
                ? 'UPDATE budget_subcategories
                   SET spent_amount = spent_amount - :amount
                   WHERE id = :id AND category_id = :category_id AND spent_amount >= :amount'
                : 'UPDATE budget_subcategories
                   SET spent_amount = spent_amount + :amount
                   WHERE id = :id AND category_id = :category_id');
            $updateSub->execute([
                'amount' => $amount,
                'id' => $subcategoryId,
                'category_id' => $categoryId,
            ]);
            if ($updateSub->rowCount() !== 1) {
                throw new Exception($isReversal
                    ? 'The expenditure subcategory spending could not be reversed.'
                    : 'The expenditure subcategory could not be found.');
            }
        }
        $updateCat = $pdo->prepare($isReversal
            ? 'UPDATE budget_categories
               SET spent_amount = spent_amount - :amount
               WHERE id = :id AND spent_amount >= :amount'
            : 'UPDATE budget_categories
               SET spent_amount = spent_amount + :amount
               WHERE id = :id');
        $updateCat->execute(['amount' => $amount, 'id' => $categoryId]);
        if ($updateCat->rowCount() !== 1) {
            throw new Exception($isReversal
                ? 'The expenditure category spending could not be reversed.'
                : 'The expenditure category could not be found.');
        }
    }

    $update = $pdo->prepare("UPDATE expenditures SET status = :status WHERE id = :id");
    $update->execute(['status' => $actionStatus, 'id' => $expenditureId]);

    $audit = new Audit($pdo);
    $actionName = $actionStatus === 'verified' ? 'Verify Expenditure' : 'Reject Expenditure';
    $auditDetails = $actionStatus === 'verified' 
        ? "Approved manual override for expenditure #{$expenditureId} amounting to ₱" . number_format($amount, 2)
        : "Rejected manual override for expenditure #{$expenditureId} amounting to ₱" . number_format($amount, 2);

    $audit->log($actionName, $auditDetails);

    $pdo->commit();
    echo json_encode(['status' => 'success', 'message' => "Expenditure {$actionStatus} successfully."]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>