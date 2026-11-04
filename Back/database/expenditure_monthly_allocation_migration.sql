ALTER TABLE expenditures
    ADD COLUMN monthly_allocation_id BIGINT UNSIGNED NULL AFTER subcategory_id,
    ADD KEY idx_expenditures_monthly_allocation (monthly_allocation_id),
    ADD CONSTRAINT fk_expenditures_monthly_allocation
        FOREIGN KEY (monthly_allocation_id)
        REFERENCES monthly_subcategory_allocations(id);
