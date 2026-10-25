<?php
class Budget
{
    public static function income(PDO $database): array
    {
        $row = $database->query('
            SELECT COALESCE(SUM(nta), 0) AS nta,
                   COALESCE(SUM(local_income), 0) AS local_income
            FROM revenues
        ')->fetch(PDO::FETCH_ASSOC);

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
        return [
            'Development Fund' => round((float)$income['nta'] * 0.20, 2),
            'SK' => round($total * 0.10, 2),
            'BDRRMF' => round($total * 0.05, 2),
            'GAD' => round($total * 0.05, 2),
            'SCPWD' => round($total * 0.02, 2),
            'PSA' => round($total * 0.55, 2),
            'BCPC' => round($total * 0.01, 2),
        ];
    }

    public static function refreshAllocations(PDO $database): array
    {
        $income = self::income($database);
        $allocations = self::predefinedAllocations($income);
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
}
