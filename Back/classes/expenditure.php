<?php
class Expenditure {
    private PDO $database;

    public function __construct(PDO $pdo)
    {
        $this->database = $pdo;
    }

    public function record_expenditure($amount, $description, $fund_allocation, $created_by = null)
    {
        try {
            $this->database->beginTransaction();

            $allocation_val = null;

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
                INSERT INTO expenditures (amount, description, fund_allocation, created_by)
                VALUES (:amount, :description, :fund_allocation, :created_by)
            ');
            $stmtInsertExpenditure->execute([
                'amount'          => $amount,
                'description'      => $description,
                'fund_allocation' => $allocation_val,
                'created_by'      => $created_by,
            ]);

            $this->database->commit();
            return true;
        } catch (Exception $e) {
            if ($this->database->inTransaction()) $this->database->rollBack();
            throw $e;
        }
    }

    public function get_expenditures(){
        $stmt = $this->database->query('SELECT * FROM expenditures ORDER BY created_at DESC');
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
