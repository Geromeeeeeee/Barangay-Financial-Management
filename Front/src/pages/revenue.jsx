import { useMemo, useState } from 'react'
import Revenue_Modal from '../components/revenue_modal'
import useRevenue from '../custom_hooks/use_revenue'
import { useRole } from '../custom_hooks/use_role'
import '../styles/revenue.css'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function Revenue () {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [filters, setFilters] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        show: "10"
    })
    const [currentPage, setCurrentPage] = useState(1)
    const filterParams = useMemo(() => ({
        month: filters.month,
        year: filters.year
    }), [filters.month, filters.year])
    const { revenues, loading, error, refetch } = useRevenue(filterParams)
    const { isTreasurer, isStaff } = useRole()

    const canRecord = isTreasurer || isStaff
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    const formatPeso = (n) =>
        new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            minimumFractionDigits: 2,
        }).format(Number(n || 0))

    const formatDate = (d) => {
        if (!d) return "—"
        return new Date(d.replace(" ", "T")).toLocaleDateString("en-PH", {
            month: "short", day: "numeric", year: "numeric",
        })
    }

    const handleCloseModal = (open) => {
        setIsModalOpen(open)
        if (!open) refetch()
    }

    const updateFilter = (event) => {
        const { name, value } = event.target

        setFilters((current) => ({
            ...current,
            [name]: value
        }))

        setCurrentPage(1)
    }

    const clearFilters = () => {
        setFilters({
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            show: "10"
        })

        setCurrentPage(1)
    }

    const pageSize = filters.show === "all"
        ? revenues.length
        : Number(filters.show)

    const totalPages = Math.max(
        1,
        Math.ceil(revenues.length / pageSize)
    )

    const startIndex = (currentPage - 1) * pageSize

    const displayedRevenues = revenues.slice(
        startIndex,
        startIndex + pageSize
    )

    return (
        <div className="revenue-page">
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
                    <button
                        type="button"
                        className="revenue-open-btn"
                        onClick={() => setIsModalOpen(true)}
                    >
                        + Record Revenue
                    </button>
                )}
            </header>

            {error && <div className="revenue-error">{error}</div>}

            <div className="revenue-card">
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
                                <th>Source</th>
                                <th>Fund Allocation</th>
                                <th>Document</th>
                                <th className="right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedRevenues.map((r) => (
                                <tr key={r.id}>
                                    <td className="muted">{formatDate(r.created_at)}</td>
                                    <td>{r.source}</td>
                                    <td>
                                        {r.fund_allocation
                                            ? <span className="fund-pill">{r.fund_allocation}</span>
                                            : <span className="muted">—</span>}
                                    </td>
                                    <td>
                                        {r.attachment_path ? (
                                            <a href={`${API_URL}revenue/download_attachment.php?id=${encodeURIComponent(r.id)}`} target="_blank" rel="noreferrer">
                                                {r.attachment_name || "View document"}
                                            </a>
                                        ) : <span className="muted">—</span>}
                                    </td>
                                    <td className="right amount">{formatPeso(r.amount)}</td>
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

            {isModalOpen && canRecord && (
                <Revenue_Modal setIsModalOpen={handleCloseModal} />
            )}
        </div>
    )
}