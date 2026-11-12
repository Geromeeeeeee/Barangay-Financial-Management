<?php
session_start();
require_once '../../header.php';
require_once '../../classes/audit.php';
require_once '../../classes/budget.php';

if (!isset($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Authentication required.']);
    exit();
}

if (strtolower((string)($_SESSION['role'] ?? '')) !== 'admin') {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Only administrators can update revenue verification statuses.']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true) ?? [];
$revenueId = $data['id'] ?? null;
$actionStatus = $data['status'] ?? null;

if (!$revenueId || !in_array($actionStatus, ['verified', 'rejected'], true)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Valid revenue ID and action status are required.']);
    exit();
}

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare('SELECT * FROM revenues WHERE id = :id FOR UPDATE');
    $stmt->execute(['id' => $revenueId]);
    $revenue = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$revenue) {
        throw new RuntimeException('Revenue record not found.');
    }

    $currentStatus = $revenue['status'];
    if ($currentStatus === $actionStatus) {
        throw new RuntimeException("This revenue is already {$actionStatus}.");
    }
    if ($actionStatus === 'verified' && $currentStatus !== 'pending') {
        throw new RuntimeException('Only pending revenue can be verified.');
    }
    if ($actionStatus === 'rejected' && !in_array($currentStatus, ['pending', 'verified'], true)) {
        throw new RuntimeException('Only pending or verified revenue can be rejected.');
    }

    if ($actionStatus === 'verified' && $revenue['record_type'] === 'monthly_receipt') {
        $annualBudgetRows = $pdo->query("
            SELECT nta, local_income
            FROM revenues
            WHERE record_type = 'annual_budget' AND status = 'verified'
            FOR UPDATE
        ")->fetchAll(PDO::FETCH_ASSOC);
        $annualBudget = 0.0;
        foreach ($annualBudgetRows as $annualBudgetRow) {
            $annualBudget += (float)$annualBudgetRow['nta'] + (float)$annualBudgetRow['local_income'];
        }
        $verifiedMonthlyReceipts = $pdo->query("
            SELECT COALESCE(SUM(amount), 0)
            FROM revenues
            WHERE record_type = 'monthly_receipt'
              AND status = 'verified'
              AND YEAR(receipt_date) = YEAR(CURDATE())
        ")->fetchColumn();
        if ((float)$verifiedMonthlyReceipts + (float)$revenue['amount'] > $annualBudget + 0.005) {
            throw new RuntimeException('The monthly receipt exceeds the unreleased annual budget.');
        }
    }

    $update = $pdo->prepare('UPDATE revenues SET status = :status WHERE id = :id');
    $update->execute(['status' => $actionStatus, 'id' => $revenueId]);

    if ($revenue['record_type'] === 'annual_budget') {
        Budget::refreshAllocations($pdo);
    }

    $audit = new Audit($pdo);
    $actionName = $actionStatus === 'verified' ? 'Verify Revenue' : 'Reject Revenue';
    $auditDetails = $actionStatus === 'verified'
        ? "Approved manual override for revenue #{$revenueId} amounting to ₱" . number_format((float)$revenue['amount'], 2)
        : "Rejected manual override for revenue #{$revenueId} amounting to ₱" . number_format((float)$revenue['amount'], 2);
    $audit->log($actionName, $auditDetails);

    $pdo->commit();
    echo json_encode(['status' => 'success', 'message' => "Revenue {$actionStatus} successfully."]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
