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

    if ($actionStatus === 'verified') {
        if (empty($exp['monthly_allocation_id'])) {
            throw new Exception('This expenditure has no monthly allocation linked and cannot be verified against budget rules.');
        }

        $monthlyAllocationId = (int)$exp['monthly_allocation_id'];

        $allocation = $pdo->prepare('
            SELECT amount, allocation_date
            FROM monthly_subcategory_allocations
            WHERE id = :id
            FOR UPDATE
        ');
        $allocation->execute(['id' => $monthlyAllocationId]);
        $allocationRow = $allocation->fetch(PDO::FETCH_ASSOC);
        if (!$allocationRow) {
            throw new Exception('The expenditure monthly allocation could not be found.');
        }

        $allocationAmount = (float)$allocationRow['amount'];
        // Fallback to current date if allocation_date is missing on older records
        $allocationDate = !empty($allocationRow['allocation_date']) ? $allocationRow['allocation_date'] : date('Y-m-d');

        // 1. Calculate remaining balance of THIS specific monthly allocation
        $verifiedExpenditures = $pdo->prepare('
            SELECT COALESCE(SUM(amount), 0)
            FROM expenditures
            WHERE monthly_allocation_id = :monthly_allocation_id
              AND status = \'verified\'
        ');
        $verifiedExpenditures->execute([
            'monthly_allocation_id' => $monthlyAllocationId,
        ]);
        $allocationRemaining = $allocationAmount - (float)$verifiedExpenditures->fetchColumn();

        // 2. Strict Global Unspent Reserve Pool from STRICTLY PREVIOUS MONTHS ONLY
        $globalReserveStmt = $pdo->prepare('
            SELECT COALESCE(SUM(a.amount - COALESCE((
                SELECT SUM(e.amount)
                FROM expenditures e
                WHERE e.monthly_allocation_id = a.id
                  AND e.status = \'verified\'
            ), 0)), 0)
            FROM monthly_subcategory_allocations a
            JOIN revenues r ON r.id = a.revenue_id
            WHERE r.record_type = \'monthly_receipt\' 
              AND r.status = \'verified\' 
              AND (
                  YEAR(a.allocation_date) < YEAR(:current_date)
                  OR (YEAR(a.allocation_date) = YEAR(:current_date) AND MONTH(a.allocation_date) < MONTH(:current_date))
              )
            FOR UPDATE
        ');
        $globalReserveStmt->execute(['current_date' => $allocationDate]);
        $globalUnspentPool = (float)$globalReserveStmt->fetchColumn();

        // 3. Strict Combined Maximum Limit: Current Month Allocation Remaining + Past Months Unspent Pool
        $maxAllowedExpenditure = max(0.0, $allocationRemaining) + max(0.0, $globalUnspentPool);

        if ($amount > $maxAllowedExpenditure + 0.005) {
            throw new Exception(sprintf(
                'The expenditure (₱%.2f) exceeds the available limit of ₱%.2f (Allocation Remaining: ₱%.2f + Previous Months Pool: ₱%.2f).',
                $amount,
                $maxAllowedExpenditure,
                $allocationRemaining,
                $globalUnspentPool
            ));
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