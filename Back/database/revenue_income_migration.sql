ALTER TABLE revenues
    ADD COLUMN nta DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER amount,
    ADD COLUMN local_income DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER nta;

UPDATE revenues
SET nta = amount,
    local_income = 0.00;
