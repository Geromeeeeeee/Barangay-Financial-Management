-- Safe, additive migration for monthly releases and reusable budget items.
-- Existing revenue rows remain annual approved-budget records.

ALTER TABLE revenues
    ADD COLUMN record_type ENUM('annual_budget', 'monthly_release') NOT NULL DEFAULT 'annual_budget',
    ADD COLUMN receipt_date DATE NULL;

UPDATE revenues
SET receipt_date = DATE(created_at)
WHERE receipt_date IS NULL;

CREATE TABLE IF NOT EXISTS budget_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id INT UNSIGNED NOT NULL,
    name VARCHAR(120) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_budget_item_category_name (category_id, name),
    CONSTRAINT fk_budget_items_category
        FOREIGN KEY (category_id) REFERENCES budget_categories(id)
);

CREATE TABLE IF NOT EXISTS monthly_budget_allocations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    revenue_id INT NOT NULL,
    budget_item_id BIGINT UNSIGNED NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_monthly_release_item (revenue_id, budget_item_id),
    CONSTRAINT fk_monthly_allocations_revenue
        FOREIGN KEY (revenue_id) REFERENCES revenues(id) ON DELETE CASCADE,
    CONSTRAINT fk_monthly_allocations_item
        FOREIGN KEY (budget_item_id) REFERENCES budget_items(id)
);

ALTER TABLE expenditures
    ADD COLUMN budget_item_id BIGINT UNSIGNED NULL;

ALTER TABLE expenditures
    ADD KEY idx_expenditures_budget_item (budget_item_id);

ALTER TABLE expenditures
    ADD CONSTRAINT fk_expenditures_budget_item
        FOREIGN KEY (budget_item_id) REFERENCES budget_items(id);
