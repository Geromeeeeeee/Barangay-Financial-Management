ALTER TABLE budget_categories
    ADD COLUMN is_custom TINYINT(1) NOT NULL DEFAULT 0 AFTER percentage;

UPDATE budget_categories
SET name = CASE id
    WHEN 1 THEN 'Development Fund'
    WHEN 2 THEN 'SK'
    WHEN 3 THEN 'BDRRMF'
    WHEN 4 THEN 'GAD'
    WHEN 5 THEN 'SCPWD & BCPC'
    WHEN 6 THEN 'PSA'
    ELSE name
END,
percentage = CASE id
    WHEN 1 THEN 20.00
    WHEN 2 THEN 10.00
    WHEN 3 THEN 5.00
    WHEN 4 THEN 5.00
    WHEN 5 THEN 1.00
    WHEN 6 THEN 55.00
    ELSE percentage
END,
is_custom = 0
WHERE id BETWEEN 1 AND 6;
