import eyeCloseIcon from "../assets/eye_close.svg";
import eyeOpenIcon from "../assets/eye_open.svg";

export default function BudgetBalances({isVisible, setIsVisible, loading, stats, getCategoryStatus, hiddenCategories, toggleCategory, formatPeso}){
    return(
        <section className="dash-card">
            <div className="dash-card-head">
                <h2>Budget Balances</h2>
                <img 
                    src={isVisible ? eyeCloseIcon : eyeOpenIcon} 
                    alt="Toggle All" 
                    style={{ cursor: 'pointer', width: '20px', height: '20px' }} 
                    onClick={() => setIsVisible(!isVisible)}
                />
            </div>

            {loading && <p className="muted">Loading…</p>}
            {!loading && stats.categoryBalances.length === 0 && <p className="muted">No data yet.</p>}

            {!loading && stats.categoryBalances.length > 0 && (
                <div className="fund-grid">
                    {stats.categoryBalances.map((category) => {
                        const allocated = Number(category.allocated_amount || 0);
                        const spent = Number(category.spent_amount || 0);
                        const balance = Number(category.balance || 0);
                        const percentage = allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0;
                        const status = getCategoryStatus(percentage);
                        const isCardHidden = !isVisible || hiddenCategories[category.id];

                        return (
                            <div key={category.id} className="fund-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between',alignItems: 'center', marginBottom: '12px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '8px' }}>
                                    <div className="fund-card-title" style={{ margin: 0, padding: 0, border: 'none' }}>
                                        {category.name}
                                    </div>
                                    <img 
                                        src={isCardHidden ? eyeCloseIcon : eyeOpenIcon} 
                                        alt="Toggle" 
                                        style={{ cursor: 'pointer', width: '18px', height: '18px', opacity: 0.7 }} 
                                        onClick={() => toggleCategory(category.id)}
                                    />
                                </div>

                                <div className="fund-card-numbers">
                                    <div className="fund-number-row">
                                        <span className="fund-label">Balance</span>
                                        <span className="fund-value highlight">{isCardHidden ? "***" : formatPeso(balance)}</span>
                                    </div>
                                    <div className="fund-number-row">
                                        <span className="fund-label">Allocated</span>
                                        <span className="fund-value">{isCardHidden ? "***" : formatPeso(allocated)}</span>
                                    </div>
                                    <div className="fund-number-row">
                                        <span className="fund-label">Spent</span>
                                        <span className="fund-value">{isCardHidden ? "***" : formatPeso(spent)}</span>
                                    </div>
                                </div>
                                <div className="fund-card-footer">
                                    <div className="fund-progress-wrap">
                                        <div className="fund-progress-bar" style={{ width: `${percentage}%` }}></div>
                                    </div>
                                    <div className="fund-footer-text">
                                        <span>{percentage.toFixed(1)}% utilized</span>
                                        <span className={`fund-status fund-status-${status.toLowerCase()}`}>{status}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    )
}