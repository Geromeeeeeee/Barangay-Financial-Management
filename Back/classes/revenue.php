<?php
class Revenue {
    private PDO $database;

    public function __construct(PDO $pdo)
    {
        $this->database = $pdo;
    }

    public function record_revenue($amount, $source, $fund_allocation)
    {
        try {
            $this->database->beginTransaction();

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

            $stmtInsertRevenue = $this->database->prepare('INSERT INTO revenues (amount, source, fund_allocation) VALUES (:amount, :source, :fund_allocation)');
            $stmtInsertRevenue->execute([
                'amount' => $amount,
                'source' => $source,
                'fund_allocation' => $allocation_val,
            ]);

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