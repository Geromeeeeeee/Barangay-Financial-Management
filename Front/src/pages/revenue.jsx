import { useState } from 'react'
import Revenue_Modal from '../components/revenue_modal'
import useRevenue from '../custom_hooks/use_revenue'
import { useRole } from '../custom_hooks/use_role'
import useFilter from '../custom_hooks/use_filter'
import usePagination from '../custom_hooks/use_pagination'
import useFormat from '../custom_hooks/use_format'
import Filter from '../components/filter'
import '../styles/revenue.css'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function Revenue () {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const {filters, months, updateFilter, clearFilters, filterParams} = useFilter({setCurrentPage})
    const { revenues, loading, error, refetch } = useRevenue(filterParams)
    const {totalPages, displayedRecords} = usePagination({currentPage, filters, records: revenues})
    const { isTreasurer, isStaff } = useRole()
    const {peso, date} = useFormat()

    const canRecord = isTreasurer || isStaff

    const handleCloseModal = (open) => {
        setIsModalOpen(open)
        if (!open) refetch()
    }

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
                <Filter filters={filters} updateFilter={updateFilter} months={months} clearFilters={clearFilters}/>
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
                            {displayedRecords.map((r) => (
                                <tr key={r.id}>
                                    <td className="muted">{date(r.created_at)}</td>
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
                                    <td className="right amount">{peso(r.amount)}</td>
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