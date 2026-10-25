<?php
require_once __DIR__ . '/budget.php';

class Revenue {
    private PDO $database;

    public function __construct(PDO $pdo)
    {
        $this->database = $pdo;
    }

    public function record_revenue($nta, $local_income, $source, $fund_allocation, $created_by = null, $request_key = null, $attachment_path = null, $attachment_name = null, $attachment_mime = null, $attachment_size = null)
    {
        try {
            $this->database->beginTransaction();
            $amount = round((float)$nta + (float)$local_income, 2);

            if ($request_key) {
                $existing = $this->database->prepare('SELECT id FROM revenues WHERE request_key = :request_key');
                $existing->execute(['request_key' => $request_key]);
                if ($existing->fetchColumn()) {
                    $this->database->commit();
                    return true;
                }
            }

            $allocation_val = null;

            if (!empty($fund_allocation)) {
                $stmtCheck = $this->database->prepare('SELECT balance FROM fund_balances WHERE fund_name = :fund_name');
                $stmtCheck->execute(['fund_name' => $fund_allocation]);
                $existingFund = $stmtCheck->fetch(PDO::FETCH_ASSOC);

                if ($existingFund) {
                    $stmtUpdate = $this->database->prepare('UPDATE fund_balances SET balance = balance + :amount WHERE fund_name = :fund_name');
                    $stmtUpdate->execute(['amount' => $amount, 'fund_name' => $fund_allocation]);
                } else {
                    $stmtInsertFund = $this->database->prepare('INSERT INTO fund_balances (fund_name, balance) VALUES (:fund_name, :amount)');
                    $stmtInsertFund->execute(['fund_name' => $fund_allocation, 'amount' => $amount]);
                }

                $allocation_val = $fund_allocation;
            }

            $stmtInsertRevenue = $this->database->prepare('
                INSERT INTO revenues (amount, nta, local_income, source, fund_allocation, created_by, request_key, attachment_path, attachment_name, attachment_mime, attachment_size)
                VALUES (:amount, :nta, :local_income, :source, :fund_allocation, :created_by, :request_key, :attachment_path, :attachment_name, :attachment_mime, :attachment_size)
            ');
            $stmtInsertRevenue->execute([
                'amount'          => $amount,
                'nta'             => round((float)$nta, 2),
                'local_income'    => round((float)$local_income, 2),
                'source'          => $source,
                'fund_allocation' => $allocation_val,
                'created_by'      => $created_by,
                'request_key'     => $request_key,
                'attachment_path' => $attachment_path,
                'attachment_name' => $attachment_name,
                'attachment_mime' => $attachment_mime,
                'attachment_size' => $attachment_size,
            ]);

            Budget::refreshAllocations($this->database);
            $this->database->commit();
            return true;
        } catch (Exception $e) {
            if ($this->database->inTransaction()) {
                $this->database->rollBack();
            }
            throw $e;
        }
    }

    public function get_revenue(array $filters = []){
        $conditions = [];
        $parameters = [];

        if ($filters['month'] !== null && $filters['month'] !== '') {
            $conditions[] = 'MONTH(created_at) = :month';
            $parameters['month'] = $filters['month'];
        }
        if ($filters['year'] !== null && $filters['year'] !== '') {
            $conditions[] = 'YEAR(created_at) = :year';
            $parameters['year'] = $filters['year'];
        }
        $where = $conditions ? ' WHERE ' . implode(' AND ', $conditions) : '';
        $stmt = $this->database->prepare("SELECT * FROM revenues{$where} ORDER BY created_at DESC");
        $stmt->execute($parameters);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>