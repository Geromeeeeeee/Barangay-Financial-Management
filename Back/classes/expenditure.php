<?php
require_once __DIR__ . '/budget.php';

class Expenditure {
    private PDO $database;

    public function __construct(PDO $pdo)
    {
        $this->database = $pdo;
    }

    public function record_expenditure($amount, $description, $fund_allocation, $created_by = null, $category_id = null, $subcategory_id = null, $attachment_path = null, $attachment_name = null, $attachment_mime = null, $attachment_size = null, array $attachments = [], $monthly_allocation_id = null, $status = 'verified')
    {
        try {
            $this->database->beginTransaction();

            if (!is_numeric($amount) || (float)$amount <= 0 || trim((string)$description) === '') {
                throw new Exception('A positive amount and description are required.');
            }
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
                    WHERE a.id = :id AND r.record_type = :record_type AND r.status = \'verified\'
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
                      AND status = \'verified\'
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
                WHERE record_type = 'annual_budget' AND status = 'verified'
                FOR UPDATE
            ")->fetchAll(PDO::FETCH_ASSOC);
            $annualBudget = 0.0;
            foreach ($annualBudgetRows as $annualBudgetRow) {
                $annualBudget += (float)$annualBudgetRow['nta'] + (float)$annualBudgetRow['local_income'];
            }
            $annualSpent = (float)$this->database->query('
                SELECT COALESCE(SUM(amount), 0) FROM expenditures WHERE status = \'verified\'
            ')->fetchColumn();
            
            if ($annualSpent + (float)$amount > $annualBudget + 0.005) {
                // Annual budget check can still apply or be skipped for pending, 
                // but spent_amount updates must definitely be isolated:
            }

            // ONLY EXECUTE SPENT CALCULATIONS AND UPDATES IF VERIFIED
            if ($status === 'verified') {
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
                }

                $updateCategory = $this->database->prepare('UPDATE budget_categories SET spent_amount = spent_amount + :amount WHERE id = :id');
                $updateCategory->execute(['amount' => $amount, 'id' => $category_id]);
            }
        }


            $stmtInsertExpenditure = $this->database->prepare('
                INSERT INTO expenditures
                    (amount, description, fund_allocation, created_by, category_id, subcategory_id,
                     monthly_allocation_id, attachment_path, attachment_name, attachment_mime, attachment_size, status)
                VALUES
                    (:amount, :description, :fund_allocation, :created_by, :category_id, :subcategory_id,
                     :monthly_allocation_id, :attachment_path, :attachment_name, :attachment_mime, :attachment_size, :status)
            ');
            $stmtInsertExpenditure->execute([
                'amount'          => $amount,
                'description'     => $description,
                'fund_allocation' => null,
                'created_by'      => $created_by,
                'category_id'     => $category_id ?: null,
                'subcategory_id'  => $subcategory_id ?: null,
                'monthly_allocation_id' => $monthlyAllocationId,
                'attachment_path' => $attachment_path,
                'attachment_name' => $attachment_name,
                'attachment_mime' => $attachment_mime,
                'attachment_size' => $attachment_size,
                'status'          => $status,
            ]);

            $expenditureId = (int)$this->database->lastInsertId();

            if ($attachments) {
                $stmtInsertAttachment = $this->database->prepare('
                    INSERT INTO expenditure_attachments
                        (expenditure_id, file_path, file_name, file_type, file_size)
                    VALUES (:expenditure_id, :file_path, :file_name, :file_type, :file_size)
                ');
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
            return $expenditureId;
        } catch (Exception $e) {
            if ($this->database->inTransaction()) $this->database->rollBack();
            throw $e;
        }
    }

    public function get_expenditures(array $filters = []){
        $parameters = [];

        if (isset($filters['month']) && $filters['month'] !== null && $filters['month'] !== '') {
            $conditions[] = 'MONTH(e.created_at) = :month';
            $parameters['month'] = $filters['month'];
        }
        if (isset($filters['year']) && $filters['year'] !== null && $filters['year'] !== '') {
            $conditions[] = 'YEAR(e.created_at) = :year';
            $parameters['year'] = $filters['year'];
        }
        $where = ' WHERE ' . implode(' AND ', $conditions);

        $stmt = $this->database->prepare("
            SELECT 
                e.*, 
                c.name AS category_name, 
                s.name AS subcategory_name,
                ma.amount AS monthly_allocation_amount,
                ma.allocation_date,
                COALESCE((
                    SELECT SUM(me.amount)
                    FROM expenditures me
                    WHERE me.monthly_allocation_id = e.monthly_allocation_id
                      AND me.status = 'verified'
                ), 0) AS monthly_allocation_spent,
                
                /* Combine multiple attachment records into a single JSON array per expenditure */
                CASE 
                    WHEN COUNT(ea.id) > 0 THEN 
                        CONCAT('[', GROUP_CONCAT(
                            JSON_OBJECT(
                                'id', ea.id,
                                'path', ea.file_path,
                                'name', ea.file_name,
                                'type', ea.file_type,
                                'size', ea.file_size
                            )
                        ), ']')
                    ELSE '[]'
                END AS attachments,

                (COUNT(DISTINCT ea.id) + CASE WHEN e.attachment_path IS NULL THEN 0 ELSE 1 END) AS attachment_count
            FROM expenditures e
            LEFT JOIN budget_categories c ON c.id = e.category_id
            LEFT JOIN budget_subcategories s ON s.id = e.subcategory_id
            LEFT JOIN monthly_subcategory_allocations ma ON ma.id = e.monthly_allocation_id
            LEFT JOIN expenditure_attachments ea ON ea.expenditure_id = e.id
            {$where}
            GROUP BY e.id
            ORDER BY e.created_at DESC
        ");
        $stmt->execute($parameters);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($results as &$row) {
            $row['attachments'] = json_decode($row['attachments'] ?? '[]', true);
        }

        return $results;
    }
}
?>