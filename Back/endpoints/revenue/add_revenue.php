<?php
session_start();

require_once '../../header.php';
require_once '../../classes/revenue.php';
require_once '../../classes/audit.php';

if (!isset($_SESSION['uid'])) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Authentication required.']);
    exit();
}

$isTreasurer = strtolower((string)($_SESSION['role'] ?? '')) === 'treasurer';
$isSK = strtolower((string)($_SESSION['role'] ?? '')) === 'sk_chairman';

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
$data = stripos($contentType, 'multipart/form-data') !== false
    ? $_POST
    : (json_decode(file_get_contents("php://input"), true) ?: []);

$amount         = $data['amount']         ?? null;
$particular     = $data['particular']     ?? null;
$nta            = array_key_exists('nta', $data) ? $data['nta'] : null;
$localIncome    = $data['local_income']    ?? null;
$source         = $data['source']         ?? null;
$created_by     = $_SESSION['uid'];
$request_key    = $data['request_key']    ?? null;
$record_type    = $data['record_type']    ?? 'annual_budget';
$receipt_date   = $data['receipt_date']   ?? null;
$allocationsJson = $data['allocations']   ?? '[]';
$ocrOverridden  = isset($data['ocr_overridden']) && (string)$data['ocr_overridden'] === '1';
$status         = $ocrOverridden ? 'pending' : 'verified';

$revenue = new Revenue($pdo);
$audit = new Audit($pdo);

try {
    if (!in_array($record_type, ['annual_budget', 'monthly_receipt'], true)) {
        throw new InvalidArgumentException('Invalid revenue record type.');
    }

    if ($record_type === 'monthly_receipt' || $isSK) {
        $record_type = 'monthly_receipt';
        
        if (!is_numeric($amount) || (float)$amount <= 0) {
            throw new InvalidArgumentException('A positive receipt amount is required.');
        }
        if ($source === null || trim((string)$source) === '') {
            throw new InvalidArgumentException('A receipt description/source is required.');
        }
        $parsedReceiptDate = DateTime::createFromFormat('Y-m-d', (string)$receipt_date);
        if (!$parsedReceiptDate || $parsedReceiptDate->format('Y-m-d') !== $receipt_date) {
            throw new InvalidArgumentException('A valid receipt date is required.');
        }
        $amount = round((float)$amount, 2);
        $nta = 0;
        $localIncome = 0;
        $particular = 'Monthly Receipt';
        $allocations = json_decode((string)$allocationsJson, true);
        if (!is_array($allocations)) {
            throw new InvalidArgumentException('Invalid budget item allocation data.');
        }
        $allocationTotal = 0.0;
        foreach ($allocations as $allocation) {
            $allocationAmount = $allocation['amount'] ?? null;
            $itemType = $allocation['item_type'] ?? 'existing';
            $subcategoryId = (int)($allocation['subcategory_id'] ?? 0);
            $categoryId = (int)($allocation['category_id'] ?? 0);
            $itemName = trim((string)($allocation['name'] ?? ''));
            if (!in_array($itemType, ['existing', 'new'], true)
                || !is_numeric($allocationAmount) || (float)$allocationAmount <= 0) {
                throw new InvalidArgumentException('Each budget item allocation must have a valid positive amount.');
            }
            if ($itemType === 'existing') {
                $subcategory = $pdo->prepare('SELECT id FROM budget_subcategories WHERE id = :id AND is_active = 1');
                $subcategory->execute(['id' => $subcategoryId]);
                if (!$subcategory->fetchColumn()) {
                    throw new InvalidArgumentException('One of the selected budget items does not exist or is archived.');
                }
            } else {
                if ($categoryId < 1 || $itemName === '') {
                    throw new InvalidArgumentException('A parent category and name are required for a new budget item.');
                }
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
            }
            $allocationTotal += round((float)$allocationAmount, 2);
        }
        if ($allocationTotal > $amount + 0.005) {
            throw new InvalidArgumentException('Budget item allocations cannot exceed the received amount.');
        }

        $existingRevenueId = null;
        if ($request_key) {
            $existingRevenue = $pdo->prepare('SELECT id FROM revenues WHERE request_key = :request_key');
            $existingRevenue->execute(['request_key' => $request_key]);
            $existingRevenueId = $existingRevenue->fetchColumn();
            if ($existingRevenueId) {
                echo json_encode([
                    'status' => 'revenue_recorded',
                    'data' => [
                        'nta' => 0.0,
                        'local_income' => 0.0,
                        'total_annual_income' => 0.0,
                        'record_type' => 'monthly_receipt',
                        'receipt_date' => $receipt_date,
                        'revenue_id' => (int)$existingRevenueId,
                    ],
                ]);
                exit();
            }
        }

        $pdo->beginTransaction();

        if ($isSK) {
            $skCategoryStmt = $pdo->prepare("
                SELECT allocated_amount 
                FROM budget_categories 
                WHERE name = 'SK' 
                FOR UPDATE
            ");
            $skCategoryStmt->execute();
            $skAnnualBudget = (float)$skCategoryStmt->fetchColumn();

            $verifiedSKReceipts = (float)$pdo->query("
                SELECT COALESCE(SUM(r.amount), 0)
                FROM revenues r
                JOIN users u ON r.created_by = u.id
                WHERE r.record_type = 'monthly_receipt'
                  AND r.status = 'verified'
                  AND YEAR(r.receipt_date) = YEAR(CURDATE())
                  AND LOWER(u.role) = 'sk_chairman'
            ")->fetchColumn();

            if ($verifiedSKReceipts + $amount > $skAnnualBudget + 0.005) {
                throw new InvalidArgumentException('The SK monthly receipt exceeds the SK annual budget limit.');
            }
        } else {
            $annualBudgetRows = $pdo->query("
                SELECT nta, local_income
                FROM revenues
                WHERE record_type = 'annual_budget' AND status = 'verified'
                AND YEAR(created_at) = YEAR(CURDATE())
                FOR UPDATE
            ")->fetchAll(PDO::FETCH_ASSOC);
            $annualBudget = 0.0;
            foreach ($annualBudgetRows as $annualBudgetRow) {
                $annualBudget += (float)$annualBudgetRow['nta'] + (float)$annualBudgetRow['local_income'];
            }
            $verifiedMonthlyReceipts = (float)$pdo->query("
                SELECT COALESCE(SUM(amount), 0)
                FROM revenues
                WHERE record_type = 'monthly_receipt'
                  AND status = 'verified'
                  AND YEAR(receipt_date) = YEAR(CURDATE())
            ")->fetchColumn();
            if ($verifiedMonthlyReceipts + $amount > $annualBudget + 0.005) {
                throw new InvalidArgumentException('The monthly receipt exceeds the unreleased annual budget.');
            }
        }

    } elseif ($record_type === 'annual_budget') {
        if ($particular !== null && $particular !== '') {
            if (!is_numeric($amount) || (float)$amount <= 0) {
                throw new InvalidArgumentException('A positive amount is required.');
            }

            $amount = round((float)$amount, 2);
            if ($particular === 'NTA') {
                $nta = $amount;
                $localIncome = 0;
                $source = 'NTA';
            } elseif ($particular === 'Local Income') {
                $nta = 0;
                $localIncome = $amount;
                $source = 'Local Income';
            } elseif ($particular === 'Others') {
                $nta = 0;
                $localIncome = 0;
                if ($source === null || trim((string)$source) === '') {
                    throw new InvalidArgumentException('A specific revenue particular/source is required.');
                }
            } else {
                throw new InvalidArgumentException('Invalid revenue particular/source.');
            }
        } else {
            if ($nta === null || $localIncome === null || trim((string)$nta) === '' || trim((string)$localIncome) === ''
                || !is_numeric($nta) || (float)$nta < 0
                || !is_numeric($localIncome) || (float)$localIncome < 0) {
                throw new InvalidArgumentException('NTA and Local Income are required valid non-negative amounts.');
            }

            $amount = round((float)$nta + (float)$localIncome, 2);
            if ($amount <= 0 || $source === null || trim((string)$source) === '') {
                throw new InvalidArgumentException('A positive total annual income and source are required.');
            }
        }
    } else {
        throw new InvalidArgumentException('Invalid record type configuration.');
    }
    
    $files = $_FILES['attachments'] ?? null;
    $hasFiles = false;
    
    if ($files && isset($files['error'])) {
        if (is_array($files['error'])) {
            foreach ($files['error'] as $errorCode) {
                if ($errorCode !== UPLOAD_ERR_NO_FILE) {
                    $hasFiles = true;
                    break;
                }
            }
        } elseif ($files['error'] !== UPLOAD_ERR_NO_FILE) {
            $hasFiles = true;
        }
    }

    if (($isTreasurer || $isSK || $record_type === 'monthly_receipt') && !$hasFiles) {
        throw new InvalidArgumentException('Supporting documents are required.');
    }

    $uploadedFilesData = [];
    $uploadedPaths = [];

    if ($hasFiles) {
        if (!($isTreasurer || $isSK)) {
            throw new InvalidArgumentException('Only authorized officers can upload supporting documents.');
        }

        $allowedMimeTypes = ['application/pdf' => 'pdf', 'image/jpeg' => 'jpg', 'image/png' => 'png'];
        $uploadDirectory = __DIR__ . '/../../uploads/revenues';
        
        if (!is_dir($uploadDirectory) && !mkdir($uploadDirectory, 0750, true)) {
            throw new RuntimeException('The supporting document could not be stored.');
        }

        $fileCount = is_array($files['name']) ? count($files['name']) : 1;

        for ($i = 0; $i < $fileCount; $i++) {
            $currentError = is_array($files['error']) ? $files['error'][$i] : $files['error'];
            if ($currentError === UPLOAD_ERR_NO_FILE) continue;

            $currentSize = is_array($files['size']) ? $files['size'][$i] : $files['size'];
            if ($currentError !== UPLOAD_ERR_OK || $currentSize > 5 * 1024 * 1024) {
                throw new InvalidArgumentException('One or more files could not be uploaded or exceed 5 MB.');
            }

            $tmpName = is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'];
            $originalName = is_array($files['name']) ? $files['name'][$i] : $files['name'];

            $mimeType = (new finfo(FILEINFO_MIME_TYPE))->file($tmpName);
            if (!isset($allowedMimeTypes[$mimeType])) {
                throw new InvalidArgumentException('Only PDF, JPG, and PNG documents are allowed.');
            }

            $safeFilename = bin2hex(random_bytes(16)) . '.' . $allowedMimeTypes[$mimeType];
            $uploadedPath = $uploadDirectory . DIRECTORY_SEPARATOR . $safeFilename;

            if (!move_uploaded_file($tmpName, $uploadedPath)) {
                throw new RuntimeException('A supporting document could not be stored.');
            }

            $uploadedPaths[] = $uploadedPath;
            
            $uploadedFilesData[] = [
                'path' => 'uploads/revenues/' . $safeFilename,
                'name' => basename((string)$originalName),
                'mime' => $mimeType,
                'size' => (int)$currentSize
            ];
        }
    }

    if ($record_type === 'monthly_receipt') {
        if (!$pdo->inTransaction()) {
            $pdo->beginTransaction();
        }
    }

    $revenue_id = $revenue->record_revenue(
        $nta,
        $localIncome,
        $source,
        $created_by,
        $request_key,
        null,
        null,
        null,
        null,
        $amount,
        $particular ?? 'Others',
        $record_type,
        $record_type === 'monthly_receipt' ? $receipt_date : null,
        $record_type !== 'monthly_receipt',
        $status
    );

    if (!empty($uploadedFilesData) && $revenue_id) {
        $stmt = $pdo->prepare("
            INSERT INTO revenue_attachments (revenue_id, file_path, file_name, file_type, file_size) 
            VALUES (:rev_id, :path, :name, :type, :size)
        ");
        
        foreach ($uploadedFilesData as $fileData) {
            $stmt->execute([
                'rev_id' => $revenue_id,
                'path'   => $fileData['path'],
                'name'   => $fileData['name'],
                'type'   => $fileData['mime'],
                'size'   => $fileData['size']
            ]);
        }
    }

    if ($record_type === 'monthly_receipt' && !empty($allocations)) {
        $insertAllocation = $pdo->prepare('
            INSERT INTO monthly_subcategory_allocations
                (revenue_id, subcategory_id, amount, allocation_date, created_by)
            VALUES (:revenue_id, :subcategory_id, :amount, :allocation_date, :created_by)
        ');
        foreach ($allocations as $allocation) {
            $subcategoryId = (int)($allocation['subcategory_id'] ?? 0);
            if (($allocation['item_type'] ?? 'existing') === 'new') {
                $categoryId = (int)$allocation['category_id'];
                $duplicate = $pdo->prepare('
                    SELECT id FROM budget_subcategories
                    WHERE category_id = :category_id AND LOWER(name) = LOWER(:name)
                ');
                $duplicate->execute(['category_id' => $categoryId, 'name' => trim($allocation['name'])]);
                if ($duplicate->fetchColumn()) {
                    throw new InvalidArgumentException('A budget item with that name already exists in the selected category.');
                }

                $createItem = $pdo->prepare('
                    INSERT INTO budget_subcategories (category_id, name, allocated_amount)
                    VALUES (:category_id, :name, 0)
                ');
                $createItem->execute([
                    'category_id' => $categoryId,
                    'name' => trim($allocation['name']),
                ]);
                $subcategoryId = (int)$pdo->lastInsertId();
            }
            $insertAllocation->execute([
                'revenue_id' => $revenue_id,
                'subcategory_id' => $subcategoryId,
                'amount' => round((float)$allocation['amount'], 2),
                'allocation_date' => $receipt_date,
                'created_by' => $created_by,
            ]);
        }
    }

    if ($record_type === 'monthly_receipt') {
        $pdo->commit();
    }

    $auditDescription = "Recorded revenue of ₱" . number_format($amount, 2) . " for {$source}";
    if ($ocrOverridden) {
        $auditDescription .= " [WARNING: Receipt doesn't match the input number - Manually Overridden]";
    }

    $audit->log('Record Revenue', $auditDescription);

    echo json_encode([
        'status' => 'revenue_recorded',
        'data' => [
            'nta' => round((float)$nta, 2),
            'local_income' => round((float)$localIncome, 2),
            'total_annual_income' => $record_type === 'annual_budget' ? $amount : 0.0,
            'record_type' => $record_type,
            'receipt_date' => $record_type === 'monthly_receipt' ? $receipt_date : null,
            'revenue_id' => (int)$revenue_id,
        ],
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if (isset($uploadedPaths) && is_array($uploadedPaths)) {
        foreach ($uploadedPaths as $path) {
            if (is_file($path)) unlink($path);
        }
    }
    http_response_code($e instanceof InvalidArgumentException ? 400 : 500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}
?>