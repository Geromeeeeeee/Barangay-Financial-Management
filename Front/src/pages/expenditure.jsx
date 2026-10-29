import { useState } from "react";
import BackButton from "../components/back_button";
import ExpenditureModal from "../components/expenditure_modal";
import FileListModal from "../components/file_list_modal";
import useExpenditure from "../custom_hooks/use_expenditure";
import useFormat from "../custom_hooks/use_format";
import useBudgetCategories from "../custom_hooks/use_budget_categories";
import { useRole } from "../custom_hooks/use_role";
import useFilter from "../custom_hooks/use_filter";
import usePagination from "../custom_hooks/use_pagination";
import Filter from "../components/filter";
import "../styles/expenditure.css";
import Pagination from "../components/pagination";
import "../styles/treasurer_dashboard.css";

export default function Expenditure() {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewFile, setViewFile] = useState(null);
    const [subcategoryForm, setSubcategoryForm] = useState(null);
    const [majorCategoryForm, setMajorCategoryForm] = useState(false);
    const [currentPage, setCurrentPage] = useState(1)
    const {filters, months, years, updateFilter, clearFilters, filterParams} = useFilter({setCurrentPage})
    const { expenditures, loading, error, refetch } = useExpenditure(filterParams);
    const {totalPages, displayedRecords} = usePagination({currentPage, filters, records: expenditures})
    const {peso, date} = useFormat();
    const { categories, income, loading: categoriesLoading, error: categoriesError, saveSubcategory, deleteSubcategory, saveMajorCategory } = useBudgetCategories();
    const {isTreasurer, isSK} = useRole();
    const canModify = isTreasurer;
    const displayedCategories = isSK ? categories.filter((category)=>category.name === "SK") : categories

    const handleCloseModal = (open) => {
        setIsModalOpen(open);
        if (!open) {
            setSelectedCategory(null);
            refetch();
        }
    };

    return (
        <div className="expenditure-page">
            <BackButton />

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
                <div className="expenditure-category-manager">
                    {canModify && (
                        <button type="button" className="expenditure-open-btn" onClick={() => setMajorCategoryForm(true)}>
                            + Add Major Category
                        </button>
                    )}
                    <p className="expenditure-allocation-summary">
                        Total annual income: {peso(income.total_annual_income)} · Allocated: {peso(categories.reduce((total, category) => total + Number(category.allocated_amount || 0), 0))}
                    </p>
                    <div className="expenditure-categories">
                    {displayedCategories.map((category) => (
                        <section className="expenditure-category" key={category.id}>
                            <div className="expenditure-category-head">

                                <div className="fund-card-numbers">
                                    <h2>{category.name}</h2>
                                    <div className="fund-number-row">
                                        <span className="fund-label">Allocated</span>
                                        <span className="fund-value highlight">{peso(category.allocated_amount)}</span>
                                    </div>
                                    <div className="fund-number-row">
                                        <span className="fund-label">Spent</span>
                                        <span className="fund-value highlight">{peso(category.spent_amount)}</span>
                                    </div>
                                    <div className="fund-number-row">
                                        <span className="fund-label">Remaining</span>
                                        <span className="fund-value highlight">{peso(category.balance)}</span>
                                    </div>

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
                    ))
                    }
                    </div>
                </div>
            )}
            <div className="expenditure-card">
                <Filter filters={filters} updateFilter={updateFilter} months={months} years={years} clearFilters={clearFilters}/>
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
                            {displayedRecords.map((expenditure) => (
                                <tr key={expenditure.id}>
                                    <td className="muted">{date(expenditure.created_at)}</td>
                                    <td>{expenditure.description}</td>
                                    <td>{expenditure.subcategory_name || expenditure.category_name || expenditure.fund_allocation
                                        ? <span className="fund-pill">{expenditure.subcategory_name || expenditure.category_name || expenditure.fund_allocation}</span>
                                        : <span className="muted">—</span>}</td>
                                    <td>
                                        {Number(expenditure.attachment_count) > 0 ? (
                                            <button
                                                type="button"
                                                className="fund-pill"
                                                style={{
                                                    background: '#e0f2fe',
                                                    color: '#0369a1',
                                                    fontWeight: 'bold',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '4px 10px'
                                                }}
                                                onClick={() => setViewFile(expenditure)}
                                            >
                                                📎 View document{Number(expenditure.attachment_count) > 1 ? `s (${expenditure.attachment_count})` : ''}
                                            </button>
                                        ) : <span className="muted">—</span>}
                                    </td>
                                    <td className="right amount">{peso(expenditure.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination setCurrentPage={setCurrentPage} currentPage={currentPage} totalPages={totalPages}/>
                    </>
                )}
            </div>
            {isModalOpen && canModify && <ExpenditureModal setIsModalOpen={handleCloseModal} categories={categories} selectedCategory={selectedCategory} />}
            {subcategoryForm && canModify && <SubcategoryForm subcategory={subcategoryForm} onClose={() => setSubcategoryForm(null)} onSave={saveSubcategory} />}
            {majorCategoryForm && canModify && <MajorCategoryForm onClose={() => setMajorCategoryForm(false)} onSave={saveMajorCategory} />}
            {viewFile && <FileListModal expenditure={viewFile} onClose={() => setViewFile(null)} />}
        </div>
    );
}

function MajorCategoryForm({ onClose, onSave }) {
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [error, setError] = useState("");

    const submit = async (event) => {
        event.preventDefault();
        try {
            await onSave({ name, allocated_amount: Number(amount) });
            onClose();
        } catch (requestError) {
            setError(requestError.response?.data?.message || requestError.message);
        }
    };

    return <div className="expenditure-modal-background" onClick={onClose}>
        <form className="expenditure-modal expenditure-form" onSubmit={submit} onClick={(event) => event.stopPropagation()}>
            <h2>Add Major Category</h2>
            {error && <div className="expenditure-modal-error">{error}</div>}
            <label><span>Category name</span><input value={name} onChange={(event) => setName(event.target.value)} required /></label>
            <label><span>Allocation amount (PHP)</span><input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label>
            <div className="expenditure-modal-actions">
                <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn-save">Save</button>
            </div>
        </form>
    </div>;
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