import { useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/dashboard.css";
import "../../styles/sk_dashboard.css";
import { 
    IconChart, IconFile,
    DashboardHero, ActivityRow 
} from "../../components/dashboard_widgets";
import { useDashboardStats } from "../../custom_hooks/use_dashboard_stats";
import useExpenditure from "../../custom_hooks/use_expenditure";
import useFormat from "../../custom_hooks/use_format";
import SKChart from "../../components/sk_chart";

export default function SKDashboard({ user }) {
    const { stats, loading, error } = useDashboardStats();
    const { expenditures, loading: expLoading } = useExpenditure({});
    const { peso, date } = useFormat();
    
    const skBudget = stats.categoryBalances?.find(c => c.name === "SK") || { balance: 0, allocated_amount: 0 };

    // Filter for the 5 most recent SK transactions
    const recentSkTransactions = expenditures
        ?.filter(e => e.category_name === "SK" || e.fund_allocation === "SK")
        .slice(0, 5) || [];

    return (
        <div className="dashboard-page sk-view">
            <div className="top-split-layout">
                <div className="hero-wrapper">
                    <DashboardHero user={user} />
                </div>
                
                <div className="dash-card sk-summary-card">
                    <div className="dash-card-head">
                        <h2>SK Financial Summary</h2>
                    </div>
                    <div className="sk-summary-content">
                        <div className="summary-item">
                            <div className="summary-icon green">₱</div>
                            <div>
                                <span className="summary-label">Available Funds</span>
                                <strong className="summary-value">{loading ? "…" : peso(skBudget.balance)}</strong>
                            </div>
                        </div>
                        <div className="summary-item">
                            <div className="summary-icon blue"><IconChart size={24} /></div>
                            <div>
                                <span className="summary-label">Allocated Budget</span>
                                <strong className="summary-value">{loading ? "…" : peso(skBudget.allocated_amount)}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <section className="sk-main-layout">
                <div className="dash-card">
                    <div className="dash-card-head">
                        <h2>Budget Breakdown</h2>
                        <Link to="/Expenditure" className="dash-link" style={{ textDecoration: 'none' }}>
                            + Record Expense
                        </Link>
                    </div>
                    <div className="sk-scroll-area">
                        <ul className="activity-list">
                            {(skBudget.subcategories || []).length === 0 ? (
                                <li className="muted">No budget items created yet.</li>
                            ) : (
                                skBudget.subcategories.map((subcategory) => (
                                    <ActivityRow
                                        key={subcategory.id}
                                        dot="blue"
                                        title={subcategory.name}
                                        meta={peso(subcategory.allocated_amount)}
                                        time="Planned budget"
                                    />
                                ))
                            )}
                        </ul>
                    </div>
                </div>

                <SKChart />
            </section>

            <section className="dash-card" style={{ marginBottom: '24px' }}>
                <div className="dash-card-head">
                    <h2>Recent SK Transactions</h2>
                    <Link to="/Expenditure" className="dash-link" style={{ textDecoration: 'none' }}>
                        View All
                    </Link>
                </div>
                <div className="sk-scroll-area" style={{ maxHeight: '300px' }}>
                    {expLoading ? (
                        <p className="muted">Loading transactions...</p>
                    ) : recentSkTransactions.length === 0 ? (
                        <p className="muted">No recent transactions found.</p>
                    ) : (
                        <ul className="activity-list">
                            {recentSkTransactions.map((t) => (
                                <ActivityRow
                                    key={t.id}
                                    dot="red"
                                    title={t.description}
                                    meta={`${peso(t.amount)} · ${t.subcategory_name || "SK"}`}
                                    time={date(t.created_at)}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            </section>
        </div>
    );
}