import { useState } from 'react'
import Revenue_Modal from '../components/revenue_modal'
import useRevenue from '../custom_hooks/use_revenue'
import '../styles/revenue.css'

export default function Revenue () {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const { revenues, loading, error, refetch } = useRevenue()

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

    // Refetch after modal closes so new entries appear
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
                <button
                    type="button"
                    className="revenue-open-btn"
                    onClick={() => setIsModalOpen(true)}
                >
                    + Record Revenue
                </button>
            </header>

            {error && <div className="revenue-error">{error}</div>}

            <div className="revenue-card">
                {loading && <p className="muted">Loading records…</p>}

                {!loading && revenues.length === 0 && (
                    <div className="revenue-empty">
                        <p>No revenue records yet.</p>
                        <p className="muted">Click "Record Revenue" to add your first entry.</p>
                    </div>
                )}

                {!loading && revenues.length > 0 && (
                    <table className="revenue-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Source</th>
                                <th>Fund Allocation</th>
                                <th className="right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {revenues.map((r) => (
                                <tr key={r.id}>
                                    <td className="muted">{formatDate(r.created_at)}</td>
                                    <td>{r.source}</td>
                                    <td>
                                        {r.fund_allocation
                                            ? <span className="fund-pill">{r.fund_allocation}</span>
                                            : <span className="muted">—</span>}
                                    </td>
                                    <td className="right amount">{formatPeso(r.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {isModalOpen && (
                <Revenue_Modal setIsModalOpen={handleCloseModal} />
            )}
        </div>
    )
}