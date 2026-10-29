ALTER TABLE revenues
    ADD COLUMN particular VARCHAR(30) NOT NULL DEFAULT 'Others' AFTER source;

UPDATE revenues
SET particular = CASE
    WHEN source = 'NTA' AND nta > 0 AND local_income = 0 THEN 'NTA'
    WHEN source = 'Local Income' AND local_income > 0 AND nta = 0 THEN 'Local Income'
    ELSE 'Others'
END;
