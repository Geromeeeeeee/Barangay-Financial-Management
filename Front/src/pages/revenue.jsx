import { useCallback, useEffect, useState } from 'react'
import BackButton from '../components/back_button'
import Revenue_Modal from '../components/revenue_modal'
import FileListModal from '../components/file_list_modal'
import useRevenue from '../custom_hooks/use_revenue'
import { useRole } from '../custom_hooks/use_role'
import useFilter from '../custom_hooks/use_filter'
import usePagination from '../custom_hooks/use_pagination'
import useFormat from '../custom_hooks/use_format'
import Filter from '../components/filter'
import Pagination from '../components/pagination'
import '../styles/revenue.css'
import "../styles/expenditure.css";
import axios from 'axios'

export default function Revenue () {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [viewFilesId, setViewFilesId] = useState(null)
    const [allocationReceipt, setAllocationReceipt] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const {filters, months, years, updateFilter, clearFilters, filterParams} = useFilter({setCurrentPage})
    const { revenues, loading, error, refetch } = useRevenue(filterParams)
    const {totalPages, displayedRecords} = usePagination({currentPage, filters, records: revenues})
    const { isTreasurer, isStaff } = useRole()
    const {peso, date} = useFormat()
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

    const canRecord = isTreasurer || isStaff

    const handleCloseModal = (open) => {
        setIsModalOpen(open)
        if (!open) refetch()
    }

    return (
        <div className="revenue-page">
            <BackButton />
            
            <header className="revenue-header">
                <div>
                    <h1>Revenues</h1>
                    <p className="revenue-sub">
                        {loading
                            ? "Loading…"
                            : `${revenues.length} record${revenues.length !== 1 ? "s" : ""}`}
                    </p>
                </div>

                {canRecord && (
                    <div>
                        <button type="button" className="revenue-open-btn" onClick={() => setIsModalOpen(true)}>
                            + Record Revenue
                        </button>
                    </div>
                )}
            </header>

            {error && <div className="revenue-error">{error}</div>}

            <div className="revenue-card">
                <Filter filters={filters} updateFilter={updateFilter} months={months} years={years} clearFilters={clearFilters}/>
                {loading && <p className="muted">Loading records…</p>}

                {!loading && revenues.length === 0 && (
                    <div className="revenue-empty">
                        <p>No revenue records match the selected month and year.</p>
                    </div>
                )}

                {!loading && revenues.length > 0 && (
                    <>
                    <table className="revenue-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Particulars</th>
                                <th>Supporting Document</th>
                                <th className="right">Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedRecords.map((r) => (
                                <tr key={r.id}>
                                    <td className="muted">{date(r.receipt_date || r.created_at)}</td>
                                    <td>{r.record_type === 'monthly_receipt' ? `${r.source} (Monthly receipt)` : r.source}</td>
                                    <td>
                                        {r.attachment_count > 0 ? (
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
                                                onClick={() => setViewFilesId(r.id)}
                                            >
                                                📎 View document{Number(r.attachment_count) > 1 ? `s (${r.attachment_count})` : ''}
                                            </button>
                                        ) : (
                                            <span className="muted">—</span>
                                        )}
                                    </td>
                                    <td className="right amount">{peso(r.amount)}</td>
                                    <td>
                                        {isTreasurer && r.record_type === 'monthly_receipt' && (
                                            <button type="button" className="filter-clear" onClick={() => setAllocationReceipt(r)}>
                                                Allocate Funds
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination setCurrentPage={setCurrentPage} currentPage={currentPage} totalPages={totalPages}/>
                    </>
                )}
            </div>

            {isModalOpen && canRecord && (
                <Revenue_Modal setIsModalOpen={handleCloseModal} />
            )}
            
            {viewFilesId && (
                <FileListModal revenueId={viewFilesId} onClose={() => setViewFilesId(null)} />
            )}
            {allocationReceipt && (
                <ReceiptAllocationModal
                    receipt={allocationReceipt}
                    apiUrl={API_URL}
                    onClose={() => setAllocationReceipt(null)}
                    onSaved={refetch}
                />
            )}
        </div>
    )
}

function ReceiptAllocationModal({ receipt, apiUrl, onClose, onSaved }) {
    const [categories, setCategories] = useState([])
    const [history, setHistory] = useState([])
    const [itemType, setItemType] = useState('existing')
    const [subcategoryId, setSubcategoryId] = useState('')
    const [categoryId, setCategoryId] = useState('')
    const [name, setName] = useState('')
    const [amount, setAmount] = useState('')
    const [allocationDate, setAllocationDate] = useState(receipt.receipt_date)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const load = useCallback(() => Promise.all([
        axios.get(`${apiUrl}budget/categories.php`, { withCredentials: true }),
        axios.get(`${apiUrl}budget/allocations.php?receipt_id=${receipt.id}`, { withCredentials: true })
    ]).then(([categoryResponse, allocationResponse]) => {
        setCategories(categoryResponse.data.data || [])
        setHistory(allocationResponse.data.history || [])
    }).catch((requestError) => setError(requestError.response?.data?.message || requestError.message)), [apiUrl, receipt.id])

    useEffect(() => { load() }, [load])

    const allocated = history.reduce((total, allocation) => total + Number(allocation.amount || 0), 0)
    const remaining = Math.max(0, Number(receipt.amount) - allocated)
    const items = categories.flatMap((category) => (category.subcategories || [])
        .filter((item) => item.is_active !== false)
        .map((item) => ({ ...item, category_name: category.name })))

    const submit = async (event) => {
        event.preventDefault()
        setLoading(true)
        setError('')
        try {
            await axios.post(`${apiUrl}budget/allocations.php`, {
                revenue_id: receipt.id, item_type: itemType, subcategory_id: subcategoryId,
                category_id: categoryId, name, amount, allocation_date: allocationDate
            }, { withCredentials: true })
            await load()
            onSaved()
            setItemType('existing')
            setSubcategoryId('')
            setCategoryId('')
            setName('')
            setAmount('')
        } catch (requestError) {
            setError(requestError.response?.data?.message || requestError.message)
        } finally {
            setLoading(false)
        }
    }

    return <div className="revenue-modal-background" onClick={onClose}>
        <div className="revenue-modal" onClick={(event) => event.stopPropagation()}>
            <h2>Manage Monthly Revenue</h2>
            {error && <div className="revenue-modal-error">{error}</div>}
            <div className="expenditure-category-head">
                <div className="fund-number-row">
                    <span className="fund-number-row">Amount: </span>
                    <span className="fund-value highlight">{pesoValue(receipt.amount)}</span>
                </div>
                <div className="fund-number-row">
                    <span className="fund-number-row">Allocated: </span>
                    <span className="fund-value highlight">{pesoValue(allocated)}</span>
                </div>
                <div className="fund-number-row">
                    <span className="fund-number-row">Remaining: </span>
                    <span className="fund-value highlight">{pesoValue(remaining)}</span>
                </div>
            </div>
            {remaining > 0 && <form onSubmit={submit} className="revenue-form">
                <label><span>Budget item</span><select value={itemType} onChange={(event) => setItemType(event.target.value)}><option value="existing">Existing item</option><option value="new">Create new item</option></select></label>
                {itemType === 'existing'
                    ? <label><span>Existing item</span><select value={subcategoryId} onChange={(event) => setSubcategoryId(event.target.value)} required><option value="">Select item</option>{items.map((item) => <option key={item.id} value={item.id}>{item.category_name} / {item.name}</option>)}</select></label>
                    : <><label><span>Major category</span><select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label><span>New item name</span><input value={name} onChange={(event) => setName(event.target.value)} required /></label></>}
                <label><span>Allocation date</span><input type="date" value={allocationDate} onChange={(event) => setAllocationDate(event.target.value)} required /></label>
                <label><span>Amount</span><input type="number" min="0.01" max={remaining} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required /></label>
                <div className="revenue-modal-actions">
                    <button type="button" className="filter-clear" onClick={onClose}>Close</button>
                    <button type="submit" className="filter-clear" disabled={loading}>{loading ? 'Saving...' : 'Save allocation'}</button>
                </div>
            </form>}
            {remaining <= 0 && <p>Fully allocated. No additional allocation is available.</p>}
        </div>
    </div>
}

function pesoValue(value) {
    return `₱${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}