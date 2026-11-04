INSERT INTO budget_categories (name, percentage, is_custom, allocated_amount, spent_amount)
SELECT 'MOOE', 0, 0, 0, 0
WHERE NOT EXISTS (
    SELECT 1 FROM budget_categories WHERE name = 'MOOE'
);
