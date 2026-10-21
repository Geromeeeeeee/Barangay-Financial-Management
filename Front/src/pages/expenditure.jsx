import { useMemo, useState } from "react";
import ExpenditureModal from "../components/expenditure_modal";
import useExpenditure from "../custom_hooks/use_expenditure";
import useFormat from "../custom_hooks/use_format";
import useBudgetCategories from "../custom_hooks/use_budget_categories";
import { useRole } from "../custom_hooks/use_role";
import "../styles/expenditure.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function Expenditure() {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [subcategoryForm, setSubcategoryForm] = useState(null);
    const [currentPage, setCurrentPage] = useState(1)
    const [filters, setFilters] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        show: "10"
    })
    const filterParams = useMemo(() => Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== "")
    ), [filters]);
    const { expenditures, loading, error, refetch } = useExpenditure(filterParams);
    const {peso, date} = useFormat();
    const { categories, loading: categoriesLoading, error: categoriesError, saveSubcategory, deleteSubcategory } = useBudgetCategories();
    const {isTreasurer} = useRole();
    const canModify = isTreasurer;
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const handleCloseModal = (open) => {
        setIsModalOpen(open);
        if (!open) {
            setSelectedCategory(null);
            refetch();
        }
    };

    const updateFilter = (event) => {
        const { name, value } = event.target;
        setFilters((current) => ({ ...current, [name]: value }));
    };

    const clearFilters = () => {
        setFilters({
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            show: "10"
        })

        setCurrentPage(1)
    }

    const pageSize = filters.show === "all"
        ? expenditures.length
        : Number(filters.show)

    const totalPages = Math.max(
        1,
        Math.ceil(expenditures.length / pageSize)
    )

    const startIndex = (currentPage - 1) * pageSize

    const displayedExpenditure = expenditures.slice(
        startIndex,
        startIndex + pageSize
    )

    return (
        <div className="expenditure-page">
            <header className="expenditure-header">
                <div>
                    <h1>Expenditures</h1>
                    <p className="expenditure-sub">
                        {loading ? "Loading..." : `${expenditures.length} record${expenditures.length !== 1 ? "s" : ""}`}
                    </p>
                </div>
            </header>

            {error && <div className="expenditure-error">{error}</div>}
            {categoriesError && <div className="expenditure-error">{categoriesError}</div>}
            {!categoriesLoading && categories.length > 0 && (
                <div className="expenditure-categories">
                    {categories.map((category) => (
                        <section className="expenditure-category" key={category.id}>
                            <div className="expenditure-category-head">
                                <div>
                                    <h2>{category.name}</h2>
                                    <p>{peso(category.allocated_amount)} allocated · {peso(category.spent_amount)} spent · {peso(category.balance)} remaining</p>
                                </div>
                                {canModify && (
                                    <button type="button" className="expenditure-open-btn" onClick={() => { setSelectedCategory(category); setIsModalOpen(true); }}>
                                        Record Expenditure
                                    </button>
                                )}
                            </div>
                            <div className="subcategory-list">
                                {category.subcategories.map((subcategory) => (
                                    <div className="subcategory-row" key={subcategory.id}>
                                        <span>{subcategory.name}</span>
                                        <span>{peso(subcategory.balance)} remaining</span>
                                        {canModify && (
                                            <>
                                                <button type="button" onClick={() => setSubcategoryForm(subcategory)}>Edit</button>
                                                <button type="button" onClick={() => deleteSubcategory(subcategory.id).catch((e) => window.alert(e.response?.data?.message || e.message))}>Delete</button>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {canModify && (
                                <button type="button" onClick={() => setSubcategoryForm({ category_id: category.id, name: "", allocated_amount: "" })}>+ Add subcategory</button>
                            )}
                        </section>
                    ))}
                </div>
            )}
            <div className="expenditure-card">
                <div className="records-filters">
                    <label><span>Month</span><select name="month" value={filters.month} onChange={updateFilter}>{months.map((month, index) => <option key={index + 1} value={index + 1}>{month}</option>)}</select></label>
                    <label><span>Year</span><input type="number" name="year" value={filters.year} onChange={updateFilter} /></label>
                    <label>
                        <span>Show</span>
                        <select name="show" value={filters.show} onChange={updateFilter}>
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="all">All</option>
                        </select>
                    </label>
                    <button type="button" className="filter-clear" onClick={clearFilters}>Reset</button>
                </div>
                {loading && <p className="muted">Loading records...</p>}
                {!loading && expenditures.length === 0 && (
                    <div className="expenditure-empty">
                        <p>No expenditure records match the selected month and year.</p>
                    </div>
                )}
                {!loading && expenditures.length > 0 && (
                    <>
                    <table className="expenditure-table">
                        <thead>
                            <tr><th>Date</th><th>Description</th><th>Fund Allocation</th><th>Supporting Document</th><th className="right">Amount</th></tr>
                        </thead>
                        <tbody>
                            {displayedExpenditure.map((expenditure) => (
                                <tr key={expenditure.id}>
                                    <td className="muted">{date(expenditure.created_at)}</td>
                                    <td>{expenditure.description}</td>
                                    <td>{expenditure.subcategory_name || expenditure.category_name || expenditure.fund_allocation
                                        ? <span className="fund-pill">{expenditure.subcategory_name || expenditure.category_name || expenditure.fund_allocation}</span>
                                        : <span className="muted">—</span>}</td>
                                    <td>
                                        {expenditure.attachment_path ? (
                                            <a
                                                className="attachment-link"
                                                href={`${API_URL}expenditure/download_attachment.php?id=${encodeURIComponent(expenditure.id)}`}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                {expenditure.attachment_name || "View document"}
                                            </a>
                                        ) : <span className="muted">—</span>}
                                    </td>
                                    <td className="right amount">{peso(expenditure.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="pagination">
                        <button
                            type="button"
                            onClick={() => setCurrentPage(page => page - 1)}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </button>

                        <span>
                            Page {currentPage} of {totalPages}
                        </span>

                        <button
                            type="button"
                            onClick={() => setCurrentPage(page => page + 1)}
                            disabled={currentPage >= totalPages}
                        >
                            Next
                        </button>
                    </div>
                    </>
                )}
            </div>
            {isModalOpen && canModify && <ExpenditureModal setIsModalOpen={handleCloseModal} categories={categories} selectedCategory={selectedCategory} />}
            {subcategoryForm && canModify && <SubcategoryForm subcategory={subcategoryForm} onClose={() => setSubcategoryForm(null)} onSave={saveSubcategory} />}
        </div>
    );
}

function SubcategoryForm({ subcategory, onClose, onSave }) {
    const [name, setName] = useState(subcategory.name || "");
    const [amount, setAmount] = useState(subcategory.allocated_amount || "");
    const [error, setError] = useState("");
    const submit = async (event) => {
        event.preventDefault();
        try {
            await onSave({ id: subcategory.id, category_id: subcategory.category_id, name, allocated_amount: Number(amount) });
            onClose();
        } catch (requestError) { setError(requestError.response?.data?.message || requestError.message); }
    };
    return <div className="expenditure-modal-background" onClick={onClose}><form className="expenditure-modal expenditure-form" onSubmit={submit} onClick={(event) => event.stopPropagation()}>
        <h2>{subcategory.id ? "Edit subcategory" : "Add subcategory"}</h2>
        {error && <div className="expenditure-modal-error">{error}</div>}
        <label><span>Name</span><input value={name} onChange={(event) => setName(event.target.value)} required /></label>
        <label><span>Allocated amount</span><input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label>
        <div className="expenditure-modal-actions"><button type="button" className="btn-cancel" onClick={onClose}>Cancel</button><button type="submit" className="btn-save">Save</button></div>
    </form></div>;
}
