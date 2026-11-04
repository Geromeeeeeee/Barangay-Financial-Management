-- Additive revenue classification. Existing rows remain annual budget records.
ALTER TABLE revenues
    ADD COLUMN record_type ENUM('annual_budget', 'monthly_receipt') NOT NULL DEFAULT 'annual_budget',
    ADD COLUMN receipt_date DATE NULL;

UPDATE revenues
SET receipt_date = DATE(created_at)
WHERE receipt_date IS NULL;
