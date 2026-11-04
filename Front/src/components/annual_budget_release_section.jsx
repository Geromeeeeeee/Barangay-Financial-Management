export default function AnnualBudgetReleaseSection({ stats, loading, formatPeso, isVisible = true }) {
    const value = (key) => (loading ? "…" : (isVisible ? formatPeso(stats[key]) : "***"));
    const percentage = (key) => `${Math.min(100, Math.max(0, Number(stats[key] || 0))).toFixed(1)}%`;

    return (
        <section className="dash-card annual-release-section">
            <div className="dash-card-head">
                <h2>Annual Budget Release and Utilization</h2>
                <span className="annual-release-year">{stats.fiscalYear || new Date().getFullYear()}</span>
            </div>
            <div className="annual-release-grid">
                <div><span>Annual approved budget</span><strong>{value("annualApprovedBudget")}</strong></div>
                <div><span>Monthly receipts</span><strong>{value("totalMonthlyReceipts")}</strong></div>
                <div><span>Unreleased annual budget</span><strong>{value("unreleasedAnnualBudget")}</strong></div>
                <div><span>Annual expenditures</span><strong>{value("totalAnnualExpenditures")}</strong></div>
            </div>
            <div className="annual-progress-row">
                <div className="annual-progress-label"><span>Release progress</span><b>{loading ? "…" : percentage("releasePercentage")}</b></div>
                <div className="annual-progress-track"><div className="annual-progress-fill release" style={{ width: `${Math.min(100, Math.max(0, Number(stats.releasePercentage || 0)))}%` }} /></div>
            </div>
            <div className="annual-progress-row">
                <div className="annual-progress-label"><span>Annual utilization</span><b>{loading ? "…" : percentage("annualUtilizationPercentage")}</b></div>
                <div className="annual-progress-track"><div className="annual-progress-fill utilization" style={{ width: `${Math.min(100, Math.max(0, Number(stats.annualUtilizationPercentage || 0)))}%` }} /></div>
            </div>
            <div className="annual-release-balances">
                <div><span>Received but unspent</span><strong>{value("receivedButUnspent")}</strong></div>
                <div><span>Unallocated receipts</span><strong>{value("unallocatedReceiptBalance")}</strong></div>
                <div><span>Allocated but unspent</span><strong>{value("allocatedButUnspentBalance")}</strong></div>
                <div><span>Legacy expenditures</span><strong>{value("legacyExpenditures")}</strong></div>
            </div>
        </section>
    );
}
