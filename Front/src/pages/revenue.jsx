import { useState } from 'react'
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

export default function Revenue () {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [viewFilesId, setViewFilesId] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const {filters, months, years, updateFilter, clearFilters, filterParams} = useFilter({setCurrentPage})
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
                            </tr>
                        </thead>
                        <tbody>
                            {displayedRecords.map((r) => (
                                <tr key={r.id}>
                                    <td className="muted">{date(r.created_at)}</td>
                                    <td>{r.source}</td>
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
        </div>
    )
}