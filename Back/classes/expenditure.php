<?php
require_once __DIR__ . '/budget.php';

class Expenditure {
    private PDO $database;

    public function __construct(PDO $pdo)
    {
        $this->database = $pdo;
    }

    public function record_expenditure($amount, $description, $fund_allocation, $created_by = null, $category_id = null, $subcategory_id = null, $attachment_path = null, $attachment_name = null, $attachment_mime = null, $attachment_size = null, array $attachments = [], $monthly_allocation_id = null)
    {
        try {
            $this->database->beginTransaction();

            if (!is_numeric($amount) || (float)$amount <= 0 || trim((string)$description) === '') {
                throw new Exception('A positive amount and description are required.');
            }
            $allocation_val = null;
            $monthlyAllocationId = $monthly_allocation_id !== null && $monthly_allocation_id !== ''
                ? (int)$monthly_allocation_id
                : null;

            if ($monthlyAllocationId !== null) {
                if ($monthlyAllocationId < 1) {
                    throw new Exception('The selected monthly allocation is invalid.');
                }
                $monthlyAllocation = $this->database->prepare('
                    SELECT a.id, a.amount AS allocation_amount,
                           r.record_type,
                           s.id AS allocation_subcategory_id,
                           s.category_id AS allocation_category_id,
                           s.is_active
                    FROM monthly_subcategory_allocations a
                    JOIN revenues r ON r.id = a.revenue_id
                    JOIN budget_subcategories s ON s.id = a.subcategory_id AND s.is_active = 1
                    JOIN budget_categories c ON c.id = s.category_id
                    WHERE a.id = :id AND r.record_type = :record_type
                    FOR UPDATE
                ');
                $monthlyAllocation->execute([
                    'id' => $monthlyAllocationId,
                    'record_type' => 'monthly_receipt',
                ]);
                $monthlyAllocationRow = $monthlyAllocation->fetch(PDO::FETCH_ASSOC);
                if (!$monthlyAllocationRow) {
                    throw new Exception('The selected monthly allocation does not exist or is invalid.');
                }

                $allocationExpenditures = $this->database->prepare('
                    SELECT COALESCE(SUM(amount), 0)
                    FROM expenditures
                    WHERE monthly_allocation_id = :monthly_allocation_id
                ');
                $allocationExpenditures->execute(['monthly_allocation_id' => $monthlyAllocationId]);
                $allocationRemaining = (float)$monthlyAllocationRow['allocation_amount']
                    - (float)$allocationExpenditures->fetchColumn();
                if ((float)$amount > $allocationRemaining + 0.005) {
                    throw new Exception('The selected monthly allocation has insufficient balance.');
                }

                $category_id = (int)$monthlyAllocationRow['allocation_category_id'];
                $subcategory_id = (int)$monthlyAllocationRow['allocation_subcategory_id'];
                $fund_allocation = '';
            }

            if ($category_id) {
                Budget::refreshAllocations($this->database);
                $annualBudgetRows = $this->database->query("
                    SELECT nta, local_income
                    FROM revenues
                    WHERE record_type = 'annual_budget'
                    FOR UPDATE
                ")->fetchAll(PDO::FETCH_ASSOC);
                $annualBudget = 0.0;
                foreach ($annualBudgetRows as $annualBudgetRow) {
                    $annualBudget += (float)$annualBudgetRow['nta'] + (float)$annualBudgetRow['local_income'];
                }
                $annualSpent = (float)$this->database->query('
                    SELECT COALESCE(SUM(amount), 0) FROM expenditures
                ')->fetchColumn();
                if ($annualSpent + (float)$amount > $annualBudget + 0.005) {
                    throw new Exception('The expenditure exceeds the remaining approved annual budget.');
                }
                $category = $this->database->prepare('
                    SELECT c.allocated_amount, c.spent_amount,
                           COALESCE(SUM(s.allocated_amount), 0) AS reserved_amount
                    FROM budget_categories c
                    LEFT JOIN budget_subcategories s ON s.category_id = c.id
                    WHERE c.id = :id
                    GROUP BY c.id, c.allocated_amount, c.spent_amount
                    FOR UPDATE
                ');
                $category->execute(['id' => $category_id]);
                $categoryRow = $category->fetch(PDO::FETCH_ASSOC);
                if (!$categoryRow) throw new Exception('The selected category does not exist.');

                if ($subcategory_id) {
                    $subcategory = $this->database->prepare('
                        SELECT allocated_amount, spent_amount FROM budget_subcategories
                        WHERE id = :id AND category_id = :category_id FOR UPDATE
                    ');
                    $subcategory->execute(['id' => $subcategory_id, 'category_id' => $category_id]);
                    $subcategoryRow = $subcategory->fetch(PDO::FETCH_ASSOC);
                    if (!$subcategoryRow || (
                        $monthlyAllocationId === null
                        && (float)$subcategoryRow['allocated_amount'] - (float)$subcategoryRow['spent_amount'] < (float)$amount
                    )) {
                        throw new Exception('The selected subcategory has insufficient balance.');
                    }
                    $updateSubcategory = $this->database->prepare('UPDATE budget_subcategories SET spent_amount = spent_amount + :amount WHERE id = :id');
                    $updateSubcategory->execute(['amount' => $amount, 'id' => $subcategory_id]);
                } elseif (
                    ($monthlyAllocationId === null
                        ? (float)$categoryRow['allocated_amount'] - (float)$categoryRow['spent_amount'] - (float)$categoryRow['reserved_amount']
                        : (float)$categoryRow['allocated_amount'] - (float)$categoryRow['spent_amount']) < (float)$amount
                ) {
                    throw new Exception('The selected category has insufficient balance.');
                }
                $updateCategory = $this->database->prepare('UPDATE budget_categories SET spent_amount = spent_amount + :amount WHERE id = :id');
                $updateCategory->execute(['amount' => $amount, 'id' => $category_id]);
            }

            if (!empty($fund_allocation)) {
                $stmtCheck = $this->database->prepare('SELECT balance FROM fund_balances WHERE fund_name = :fund_name');
                $stmtCheck->execute(['fund_name' => $fund_allocation]);
                $existingFund = $stmtCheck->fetch(PDO::FETCH_ASSOC);

                if (!$existingFund || $existingFund['balance'] < $amount) {
                    throw new Exception('The selected fund does not exist or has insufficient balance.');
                }

                $stmtUpdate = $this->database->prepare('UPDATE fund_balances SET balance = balance - :amount WHERE fund_name = :fund_name');
                $stmtUpdate->execute(['amount' => $amount, 'fund_name' => $fund_allocation]);

                $allocation_val = $fund_allocation;
            }

            $stmtInsertExpenditure = $this->database->prepare('
                INSERT INTO expenditures
                    (amount, description, fund_allocation, created_by, category_id, subcategory_id,
                     monthly_allocation_id, attachment_path, attachment_name, attachment_mime, attachment_size)
                VALUES
                    (:amount, :description, :fund_allocation, :created_by, :category_id, :subcategory_id,
                     :monthly_allocation_id, :attachment_path, :attachment_name, :attachment_mime, :attachment_size)
            ');
            $stmtInsertExpenditure->execute([
                'amount'          => $amount,
                'description'     => $description,
                'fund_allocation' => $allocation_val,
                'created_by'      => $created_by,
                'category_id'     => $category_id ?: null,
                'subcategory_id'  => $subcategory_id ?: null,
                'monthly_allocation_id' => $monthlyAllocationId,
                'attachment_path' => $attachment_path,
                'attachment_name' => $attachment_name,
                'attachment_mime' => $attachment_mime,
                'attachment_size' => $attachment_size,
            ]);

            if ($attachments) {
                $stmtInsertAttachment = $this->database->prepare('
                    INSERT INTO expenditure_attachments
                        (expenditure_id, file_path, file_name, file_type, file_size)
                    VALUES (:expenditure_id, :file_path, :file_name, :file_type, :file_size)
                ');
                $expenditureId = (int)$this->database->lastInsertId();
                foreach ($attachments as $attachment) {
                    $stmtInsertAttachment->execute([
                        'expenditure_id' => $expenditureId,
                        'file_path' => $attachment['path'],
                        'file_name' => $attachment['name'],
                        'file_type' => $attachment['mime'],
                        'file_size' => $attachment['size'],
                    ]);
                }
            }

            $this->database->commit();
            return (int)$this->database->lastInsertId();
        } catch (Exception $e) {
            if ($this->database->inTransaction()) $this->database->rollBack();
            throw $e;
        }
    }

    public function get_expenditures(array $filters = []){
        $conditions = [];
        $parameters = [];

        if ($filters['month'] !== null && $filters['month'] !== '') {
            $conditions[] = 'MONTH(e.created_at) = :month';
            $parameters['month'] = $filters['month'];
        }
        if ($filters['year'] !== null && $filters['year'] !== '') {
            $conditions[] = 'YEAR(e.created_at) = :year';
            $parameters['year'] = $filters['year'];
        }
        $where = $conditions ? ' WHERE ' . implode(' AND ', $conditions) : '';
        $stmt = $this->database->prepare("
            SELECT e.*, c.name AS category_name, s.name AS subcategory_name,
                   ma.amount AS monthly_allocation_amount,
                   ma.allocation_date,
                   COALESCE((
                       SELECT SUM(me.amount)
                       FROM expenditures me
                       WHERE me.monthly_allocation_id = e.monthly_allocation_id
                   ), 0) AS monthly_allocation_spent,
                   (SELECT COUNT(*) FROM expenditure_attachments ea WHERE ea.expenditure_id = e.id)
                   + CASE WHEN e.attachment_path IS NULL THEN 0 ELSE 1 END AS attachment_count
            FROM expenditures e
            LEFT JOIN budget_categories c ON c.id = e.category_id
            LEFT JOIN budget_subcategories s ON s.id = e.subcategory_id
            LEFT JOIN monthly_subcategory_allocations ma ON ma.id = e.monthly_allocation_id
            {$where}
            ORDER BY e.created_at DESC
        ");
        $stmt->execute($parameters);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>