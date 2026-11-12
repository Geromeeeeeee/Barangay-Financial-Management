<?php
class Budget
{
    public static function income(PDO $database): array
    {
        $row = $database->query("
            SELECT COALESCE(SUM(nta), 0) AS nta,
                   COALESCE(SUM(local_income), 0) AS local_income
            FROM revenues
            WHERE record_type = 'annual_budget' AND status = 'verified'
        ")->fetch(PDO::FETCH_ASSOC);

        $nta = round((float)$row['nta'], 2);
        $localIncome = round((float)$row['local_income'], 2);

        return [
            'nta' => $nta,
            'local_income' => $localIncome,
            'total_annual_income' => round($nta + $localIncome, 2),
        ];
    }

    public static function predefinedAllocations(array $income): array
    {
        $total = (float)$income['total_annual_income'];
        $allocations = [
            'Development Fund' => round((float)$income['nta'] * 0.20, 2),
            'SK' => round($total * 0.10, 2),
            'BDRRMF' => round($total * 0.05, 2),
            'GAD' => round($total * 0.05, 2),
            'SCPWD' => round($total * 0.02, 2),
            'PSA' => round($total * 0.55, 2),
            'BCPC' => round($total * 0.01, 2),
        ];
        $prescribedTotal = array_sum($allocations);
        $allocations['MOOE'] = max(0.0, round($total - $prescribedTotal, 2));
        return $allocations;
    }

    public static function refreshAllocations(PDO $database): array
    {
        $income = self::income($database);
        $allocations = self::predefinedAllocations($income);
        $mooeCategory = $database->prepare('
            SELECT id, name, allocated_amount
            FROM budget_categories
            WHERE name = :name AND is_custom = 0
            FOR UPDATE
        ');
        $mooeCategory->execute(['name' => 'MOOE']);
        $mooeCategoryRow = $mooeCategory->fetch(PDO::FETCH_ASSOC);

        if ($mooeCategoryRow) {
            self::validateMooeDistribution($database, (int)$mooeCategoryRow['id'], $allocations['MOOE']);
        }

        $update = $database->prepare('
            UPDATE budget_categories
            SET allocated_amount = :allocated_amount
            WHERE name = :name AND is_custom = 0
        ');

        foreach ($allocations as $name => $amount) {
            $update->execute(['name' => $name, 'allocated_amount' => $amount]);
        }

        return $income;
    }

    public static function validateMooeDistribution(PDO $database, int $categoryId, float $allocation): void
    {
        $items = $database->prepare('
            SELECT id, spent_amount
            FROM budget_subcategories
            WHERE category_id = :category_id AND is_active = 1
            ORDER BY id
            FOR UPDATE
        ');
        $items->execute(['category_id' => $categoryId]);
        $rows = $items->fetchAll(PDO::FETCH_ASSOC);
        $count = count($rows);
        if ($count === 0) {
            return;
        }

        $allocationCents = max(0, (int)round($allocation * 100));
        $baseCents = intdiv($allocationCents, $count);
        $remainderCents = $allocationCents % $count;
        foreach ($rows as $index => $row) {
            $itemAllocation = ($baseCents + ($index < $remainderCents ? 1 : 0)) / 100;
            if ($itemAllocation + 0.005 < (float)$row['spent_amount']) {
                throw new InvalidArgumentException(
                    'MOOE items cannot be redistributed because the annual allocation for item #' .
                    $row['id'] . ' would fall below its recorded spending.'
                );
            }
        }

        $update = $database->prepare('
            UPDATE budget_subcategories
            SET allocated_amount = :allocated_amount
            WHERE id = :id
        ');
        foreach ($rows as $index => $row) {
            $itemAllocation = ($baseCents + ($index < $remainderCents ? 1 : 0)) / 100;
            $update->execute([
                'id' => $row['id'],
                'allocated_amount' => number_format($itemAllocation, 2, '.', ''),
            ]);
        }
    }
}
