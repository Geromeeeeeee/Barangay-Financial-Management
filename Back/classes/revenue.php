<?php
class Revenue {
    private PDO $database;

    public function __construct(PDO $pdo)
    {
        $this->database = $pdo;
    }

    public function record_revenue($amount, $source, $fund_allocation, $created_by = null, $request_key = null)
    {
        try {
            $this->database->beginTransaction();

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
                INSERT INTO revenues (amount, source, fund_allocation, created_by, request_key)
                VALUES (:amount, :source, :fund_allocation, :created_by, :request_key)
            ');
            $stmtInsertRevenue->execute([
                'amount'          => $amount,
                'source'          => $source,
                'fund_allocation' => $allocation_val,
                'created_by'      => $created_by,   // ← NEW
                'request_key'     => $request_key,
            ]);

            $revenueId = (int)$this->database->lastInsertId();
            $categories = $this->database->query('SELECT id, percentage FROM budget_categories ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
            $remaining = round((float)$amount, 2);
            foreach ($categories as $index => $category) {
                $categoryAmount = $index === count($categories) - 1
                    ? $remaining
                    : round((float)$amount * ((float)$category['percentage'] / 100), 2);
                $remaining = round($remaining - $categoryAmount, 2);
                $insertAllocation = $this->database->prepare('
                    INSERT INTO revenue_allocations (revenue_id, category_id, amount)
                    VALUES (:revenue_id, :category_id, :amount)
                    ON DUPLICATE KEY UPDATE amount = VALUES(amount)
                ');
                $insertAllocation->execute([
                    'revenue_id' => $revenueId,
                    'category_id' => $category['id'],
                    'amount' => $categoryAmount
                ]);
                $updateCategory = $this->database->prepare('UPDATE budget_categories SET allocated_amount = allocated_amount + :amount WHERE id = :id');
                $updateCategory->execute(['amount' => $categoryAmount, 'id' => $category['id']]);
            }
            $this->database->commit();
            return true;
        } catch (Exception $e) {
            if ($this->database->inTransaction()) {
                $this->database->rollBack();
            }
            throw $e;
        }
    }

    public function get_revenue(){
        $stmt = $this->database->query('SELECT * FROM revenues ORDER BY created_at DESC');
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>