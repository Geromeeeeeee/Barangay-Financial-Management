-- Preserve budget item identities while allowing items to be archived safely.
-- Integrity checks completed before applying this migration:
-- no duplicate (category_id, name) pairs and no orphaned category references.

ALTER TABLE budget_subcategories
    ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER spent_amount,
    ADD UNIQUE KEY unique_category_subcategory (category_id, name),
    ADD CONSTRAINT fk_budget_subcategories_category
        FOREIGN KEY (category_id) REFERENCES budget_categories(id);
