<?php
require_once __DIR__ . '/budget.php';

class Revenue {
    private PDO $database;

    public function __construct(PDO $pdo)
    {
        $this->database = $pdo;
    }

    public function record_revenue($nta, $local_income, $source, $created_by = null, $request_key = null, $attachment_path = null, $attachment_name = null, $attachment_mime = null, $attachment_size = null, $amount = null, $particular = 'Others', $record_type = 'annual_budget', $receipt_date = null, $manageTransaction = true)
    {
        try {
            if ($manageTransaction) {
                $this->database->beginTransaction();
            }
            $amount = $amount === null
                ? round((float)$nta + (float)$local_income, 2)
                : round((float)$amount, 2);

            if ($request_key) {
                $existing = $this->database->prepare('SELECT id FROM revenues WHERE request_key = :request_key');
                $existing->execute(['request_key' => $request_key]);
                $existing_id = $existing->fetchColumn();
                if ($existing_id) {
                    if ($manageTransaction) {
                        $this->database->commit();
                    }
                    return $existing_id; 
                }
            }

            $stmtInsertRevenue = $this->database->prepare('
                INSERT INTO revenues (amount, nta, local_income, source, particular, created_by, request_key, attachment_path, attachment_name, attachment_mime, attachment_size, record_type, receipt_date)
                VALUES (:amount, :nta, :local_income, :source, :particular, :created_by, :request_key, :attachment_path, :attachment_name, :attachment_mime, :attachment_size, :record_type, :receipt_date)
            ');
            $stmtInsertRevenue->execute([
                'amount'          => $amount,
                'nta'             => round((float)$nta, 2),
                'local_income'    => round((float)$local_income, 2),
                'source'          => $source,
                'particular'      => $particular,
                'created_by'      => $created_by,
                'request_key'     => $request_key,
                'attachment_path' => $attachment_path,
                'attachment_name' => $attachment_name,
                'attachment_mime' => $attachment_mime,
                'attachment_size' => $attachment_size,
                'record_type'     => $record_type,
                'receipt_date'    => $receipt_date,
            ]);

            $newRevenueId = $this->database->lastInsertId();

            if ($record_type === 'annual_budget') {
                Budget::refreshAllocations($this->database);
            }
            if ($manageTransaction) {
                $this->database->commit();
            }
            
            return $newRevenueId; 

        } catch (Exception $e) {
            if ($manageTransaction && $this->database->inTransaction()) {
                $this->database->rollBack();
            }
            throw $e;
        }
    }

    public function get_revenue(array $filters = []){
        $conditions = [];
        $parameters = [];

        if (isset($filters['month']) && $filters['month'] !== null && $filters['month'] !== '') {
            $conditions[] = "MONTH(CASE WHEN r.record_type = 'monthly_receipt' THEN r.receipt_date ELSE r.created_at END) = :month";
            $parameters['month'] = $filters['month'];
        }
        if (isset($filters['year']) && $filters['year'] !== null && $filters['year'] !== '') {
            $conditions[] = "YEAR(CASE WHEN r.record_type = 'monthly_receipt' THEN r.receipt_date ELSE r.created_at END) = :year";
            $parameters['year'] = $filters['year'];
        }
        
        $where = $conditions ? ' WHERE ' . implode(' AND ', $conditions) : '';
        
        // 👇 THIS IS THE FIX: Joining the attachments table and counting the rows
        $stmt = $this->database->prepare("
            SELECT r.*, 
                   COUNT(ra.id) as attachment_count
            FROM revenues r
            LEFT JOIN revenue_attachments ra ON r.id = ra.revenue_id
            {$where}
            GROUP BY r.id
            ORDER BY r.created_at DESC
        ");
        $stmt->execute($parameters);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>