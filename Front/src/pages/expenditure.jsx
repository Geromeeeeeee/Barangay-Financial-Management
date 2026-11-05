import { useEffect, useState } from "react";
import axios from "axios";
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
import { useToast } from "../context/toast_context";
import "../styles/expenditure.css";
import "../styles/category_card.css"
import Pagination from "../components/pagination";
import "../styles/treasurer_dashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function Expenditure() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [viewFile, setViewFile] = useState(null);
    const [subcategoryForm, setSubcategoryForm] = useState(null);
    const [monthlyAllocations, setMonthlyAllocations] = useState([]);
    const [allocationError, setAllocationError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const { showToast } = useToast();

    const {filters, months, years, updateFilter, clearFilters, filterParams} = useFilter({setCurrentPage})
    const { expenditures, loading, error, refetch } = useExpenditure(filterParams);
    const {peso, date} = useFormat();
    {/**
    const { categories, income, loading: categoriesLoading, error: categoriesError, saveSubcategory, deleteSubcategory } = useBudgetCategories();
    */}
    const { categories, loading: categoriesLoading, error: categoriesError, saveSubcategory, deleteSubcategory } = useBudgetCategories();
    const {isTreasurer, isSK} = useRole();
    const canModify = isTreasurer || isSK;
    const displayedCategories = isSK ? categories.filter((category)=>category.name === "SK") : categories

    const skFilteredExpenditures = isSK
        ? expenditures.filter(e => e.category_name === "SK" || e.subcategory_name?.toUpperCase().includes("SK"))
        : expenditures;

    const {totalPages, displayedRecords} = usePagination({currentPage, filters, records: skFilteredExpenditures})
    
    const allocationsBySubcategory = monthlyAllocations.reduce((groups, allocation) => {
        const key = String(allocation.subcategory_id);
        if (!groups[key]) groups[key] = [];
        groups[key].push(allocation);
        return groups;
    }, {});

    const categoriesWithMonthlyAllocations = displayedCategories
    .map((category) => ({
        ...category,
        subcategories: category.subcategories
            .map((subcategory) => ({ ...subcategory, category_name: category.name }))
    }))
    .filter((category) => category.subcategories.length > 0 || isSK);

    const loadMonthlyAllocations = () => axios.get(`${API_URL}budget/allocations.php`, {
        withCredentials: true
    }).then((response) => {
        setMonthlyAllocations(response.data.history || []);
        setAllocationError("");
    }).catch((requestError) => {
        setAllocationError(requestError.response?.data?.message || "Failed to load monthly allocations.");
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isTreasurer || isSK) loadMonthlyAllocations();
        }, 0);
        return () => clearTimeout(timer);
    }, [isTreasurer, isSK]);

    const handleCloseModal = (open) => {
        setIsModalOpen(open);
        if (!open) {
            setSelectedItem(null);
            refetch();
            if (isTreasurer || isSK) loadMonthlyAllocations();
        }
    };

    const openExpenditureModal = (subcategory, allocations) => {
        setSelectedItem({ ...subcategory, allocations });
        setIsModalOpen(true);
    };

    const handleArchive = async (id) => {
        try {
            await deleteSubcategory(id);
            showToast("Subcategory archived successfully.", "success");
        } catch (e) {
            showToast(e.response?.data?.message || e.message, "error");
        }
    };

    return (
        <div className="expenditure-page">
            <BackButton />

            <header className="expenditure-header">
                <div>
                    <h1>Expenditures</h1>
                    <p className="expenditure-sub">
                        {loading ? "Loading..." : `${skFilteredExpenditures.length} record${skFilteredExpenditures.length !== 1 ? "s" : ""}`}
                    </p>
                </div>
            </header>

            {error && <div className="expenditure-error">{error}</div>}
            {categoriesError && <div className="expenditure-error">{categoriesError}</div>}
            {allocationError && <div className="expenditure-error">{allocationError}</div>}
            {!categoriesLoading && categories.length > 0 && (
                <div className="expenditure-category-manager">
                    {/**
                    <p className="expenditure-allocation-summary">
                        {isSK ? (
                            <>Allocated SK Budget: {peso(displayedCategories.reduce((total, category) => total + Number(category.allocated_amount || 0), 0))}</>
                        ) : (
                            <>Total annual income: {peso(income.total_annual_income)} · Allocated: {peso(categories.reduce((total, category) => total + Number(category.allocated_amount || 0), 0))}</>
                        )}
                    </p>
                    */}
                    <div className="expenditure-categories">
                    {categoriesWithMonthlyAllocations.map((category) => (
                        <section className="expenditure-category" key={category.id}>
                            <div className="expenditure-category-head">
                                <div>
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
                            </div>
                            <div className="subcategory-list">
                                {category.subcategories.map((subcategory) => {
                                        const allocations = allocationsBySubcategory[String(subcategory.id)] || [];
                                        const hasAvailableAllocation = allocations.some((allocation) => Number(allocation.remaining_amount) > 0);
                                        return (
                                            <div className="subcategory-row" key={subcategory.id}>
                                                <div className="subcategory-details">
                                                    <div className="subcategory-title">
                                                        <span>{subcategory.name} {!subcategory.is_active && <em>(Archived)</em>}</span>
                                                        {canModify && subcategory.is_active && (
                                                            <button type="button" onClick={() => openExpenditureModal(subcategory, allocations)} disabled={!hasAvailableAllocation}>
                                                                Record Expenditure
                                                            </button>
                                                        )}
                                                    </div>
                                                    <details className="allocation-history">
                                                        <summary>View individual monthly allocations ({allocations.length})</summary>
                                                        <div className="allocation-history-list">
                                                            {allocations.map((allocation) => (
                                                                <div className="allocation-history-row" key={allocation.id}>
                                                                    <span>
                                                                        {allocation.receipt_source || "Monthly receipt"} ({allocation.receipt_date || "Date unavailable"})
                                                                        <small>Allocated {allocation.allocation_date}</small>
                                                                    </span>
                                                                    <span>{peso(allocation.amount)} allocated</span>
                                                                    <span>{peso(allocation.expenditure_amount)} spent</span>
                                                                    <span>{peso(allocation.remaining_amount)} remaining</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </details>
                                                </div>
                                                {canModify && subcategory.is_active && (
                                                    <div className="subcategory-actions">
                                                        <button type="button" onClick={() => setSubcategoryForm(subcategory)}>Edit</button>
                                                        <button type="button" onClick={() => handleArchive(subcategory.id)}>Archive</button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                            </div>
                            {/** Comment out. Ibabalik if may problems. */}
                            {/** 
                            {canModify && category.name.toUpperCase() === "MOOE" && (
                                <button type="button" onClick={() => setSubcategoryForm({ category_id: category.id, category_name: category.name, name: "", allocated_amount: "" })}>+ Add MOOE item</button>
                            )}
                            {canModify && category.name.toUpperCase() !== "MOOE" && (
                                <button type="button" onClick={() => setSubcategoryForm({ category_id: category.id, category_name: category.name, name: "", allocated_amount: "" })}>+ Add subcategory</button>
                            )}
                            */}
                        </section>
                    ))}
                    </div>
                </div>
            )}
            <div className="expenditure-card">
                <Filter filters={filters} updateFilter={updateFilter} months={months} years={years} clearFilters={clearFilters}/>
                {loading && <p className="muted">Loading records...</p>}
                {!loading && skFilteredExpenditures.length === 0 && (
                    <div className="expenditure-empty">
                        <p>No expenditure records match the selected month and year.</p>
                    </div>
                )}
                {!loading && skFilteredExpenditures.length > 0 && (
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
            {isModalOpen && canModify && <ExpenditureModal
                setIsModalOpen={handleCloseModal}
                monthlyAllocations={selectedItem?.allocations || []}
            />}
            {subcategoryForm && canModify && <SubcategoryForm subcategory={subcategoryForm} onClose={() => setSubcategoryForm(null)} onSave={saveSubcategory} />}
            {viewFile && <FileListModal expenditure={viewFile} onClose={() => setViewFile(null)} />}
        </div>
    );
}

function SubcategoryForm({ subcategory, onClose, onSave }) {
    const [name, setName] = useState(subcategory.name || "");
    const [amount, setAmount] = useState(subcategory.allocated_amount || "");
    const [error, setError] = useState("");
    const { showToast } = useToast();
    const isMooe = (subcategory.category_name || "").toUpperCase() === "MOOE";
    
    const submit = async (event) => {
        event.preventDefault();
        setError("");
        try {
            await onSave({ 
                id: subcategory.id, 
                category_id: subcategory.category_id, 
                name, 
                allocated_amount: Number(amount) 
            });
            showToast(subcategory.id ? "Budget item updated!" : "Budget item added!", "success");
            onClose();
        } catch (requestError) { 
            setError(requestError.response?.data?.message || requestError.message); 
            showToast("Failed to save budget item.", "error");
        }
    };

    return (
        <div className="expenditure-modal-background" onClick={onClose}>
            <form className="expenditure-modal expenditure-form" onSubmit={submit} onClick={(event) => event.stopPropagation()}>
                <h2>{subcategory.id ? "Edit Budget Item" : "Add Budget Item"}</h2>
                {subcategory.category_name && (
                    <p style={{ marginTop: '-10px', marginBottom: '16px', fontSize: '0.85rem', color: '#64748b' }}>
                        Adding to: <strong>{subcategory.category_name}</strong> category
                    </p>
                )}
                {error && <div className="expenditure-modal-error">{error}</div>}
                
                <label>
                    <span>Item Name</span>
                    <input 
                        value={name} 
                        onChange={(event) => setName(event.target.value)} 
                        placeholder="e.g., Youth Sports Program"
                        required 
                    />
                </label>

                {isMooe
                    ? <p className="muted">Annual allocation is calculated equally across active MOOE items.</p>
                    : <label>
                        <span>Planned Allocation (₱)</span>
                        <input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            value={amount} 
                            onChange={(event) => setAmount(event.target.value)} 
                            placeholder="0.00"
                        />
                      </label>}

                <div className="expenditure-modal-actions">
                    <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button type="submit" className="btn-save">Save Plan</button>
                </div>
            </form>
        </div>
    );
}