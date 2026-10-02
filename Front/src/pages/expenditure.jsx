import { useState } from "react";
import ExpenditureModal from "../components/expenditure_modal";
import useExpenditure from "../custom_hooks/use_expenditure";
import "../styles/expenditure.css";

export default function Expenditure() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { expenditures, loading, error, refetch } = useExpenditure();

    const formatPeso = (value) => new Intl.NumberFormat("en-PH", {
        style: "currency", currency: "PHP", minimumFractionDigits: 2
    }).format(Number(value || 0));

    const formatDate = (value) => {
        if (!value) return "—";
        return new Date(value.replace(" ", "T")).toLocaleDateString("en-PH", {
            month: "short", day: "numeric", year: "numeric"
        });
    };

    const handleCloseModal = (open) => {
        setIsModalOpen(open);
        if (!open) refetch();
    };

    return (
        <div className="expenditure-page">
            <header className="expenditure-header">
                <div>
                    <h1>Expenditures</h1>
                    <p className="expenditure-sub">
                        {loading ? "Loading..." : `${expenditures.length} record${expenditures.length !== 1 ? "s" : ""}`}
                    </p>
                </div>
                <button type="button" className="expenditure-open-btn" onClick={() => setIsModalOpen(true)}>
                    + Record Expenditure
                </button>
            </header>

            {error && <div className="expenditure-error">{error}</div>}
            <div className="expenditure-card">
                {loading && <p className="muted">Loading records...</p>}
                {!loading && expenditures.length === 0 && (
                    <div className="expenditure-empty">
                        <p>No expenditure records yet.</p>
                        <p className="muted">Click "Record Expenditure" to add your first entry.</p>
                    </div>
                )}
                {!loading && expenditures.length > 0 && (
                    <table className="expenditure-table">
                        <thead>
                            <tr><th>Date</th><th>Description</th><th>Fund Allocation</th><th className="right">Amount</th></tr>
                        </thead>
                        <tbody>
                            {expenditures.map((expenditure) => (
                                <tr key={expenditure.id}>
                                    <td className="muted">{formatDate(expenditure.created_at)}</td>
                                    <td>{expenditure.description}</td>
                                    <td>{expenditure.fund_allocation
                                        ? <span className="fund-pill">{expenditure.fund_allocation}</span>
                                        : <span className="muted">—</span>}</td>
                                    <td className="right amount">{formatPeso(expenditure.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            {isModalOpen && <ExpenditureModal setIsModalOpen={handleCloseModal} />}
        </div>
    );
}
