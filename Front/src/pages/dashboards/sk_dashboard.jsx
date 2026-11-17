import { useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/dashboard.css";
import "../../styles/sk_dashboard.css";
import { 
    IconChart, IconReceipt,
    DashboardHero, ActivityRow, StatCard
} from "../../components/dashboard_widgets";
import { useSKStats } from "../../custom_hooks/use_sk_stats";
import useFormat from "../../custom_hooks/use_format";
import SKChart from "../../components/sk_chart";
import RecentActivity from "../../components/recent_activity";
import BudgetBalances from "../../components/budget_balances";

export default function SKDashboard({ user }) {
    const { stats, loading, error, refresh } = useSKStats();
    const { peso } = useFormat();
    const [activityType, setActivityType] = useState("allocation");
    const [hiddenCategories, setHiddenCategories] = useState({});
    const selectedActivity = activityType === "allocation"
        ? stats.recentAllocations
        : stats.recentExpenditures;

    const formatPeso = (value) => peso(value);
    const toggleCategory = (id) => {
        setHiddenCategories((previous) => ({
            ...previous,
            [id]: !previous[id],
        }));
    };
    const toggleAll = () => {
        const allHidden = stats.categoryBalances.length > 0
            && stats.categoryBalances.every((category) => hiddenCategories[category.id]);
        if (allHidden) {
            setHiddenCategories({});
        } else {
            setHiddenCategories(Object.fromEntries(
                stats.categoryBalances.map((category) => [category.id, true])
            ));
        }
    };
    const getCategoryStatus = (percentage) => {
        if (percentage >= 75) return "Critical";
        if (percentage >= 50) return "Warning";
        if (percentage >= 20) return "Good";
        return "Excellent";
    };

    return (
        <div className="dashboard-page sk-view">
            <div className="top-split-layout">
                <div className="hero-wrapper">
                    <DashboardHero user={user} />
                </div>
                <RecentActivity
                    activityType={activityType}
                    refresh={refresh}
                    loading={loading}
                    selectedActivity={selectedActivity}
                    setActivityType={setActivityType}
                />
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <section className="stat-grid">
                <StatCard Icon="₱" label="SK Annual Budget" value={loading ? "…" : formatPeso(stats.annualAllocation)} trend="Current annual allocation" accent="green" />
                <StatCard Icon={IconReceipt} label="SK Expenditures" value={loading ? "…" : formatPeso(stats.totalExpenditures)} trend="Current fiscal year" accent="red" />
                <StatCard Icon="₱" label="Remaining SK Budget" value={loading ? "…" : formatPeso(stats.remainingBudget)} trend={`${Number(stats.utilizationPercentage).toFixed(1)}% utilized`} accent="blue" />
                <StatCard Icon={IconChart} label="SK Monthly Funding" value={loading ? "…" : formatPeso(stats.monthlyFunding)} trend="Allocated releases, not additional revenue" accent="purple" />
            </section>

            <BudgetBalances
                loading={loading}
                stats={stats}
                getCategoryStatus={getCategoryStatus}
                hiddenCategories={hiddenCategories}
                toggleCategory={toggleCategory}
                toggleAll={toggleAll}
                formatPeso={formatPeso}
            />

            <section className="sk-main-layout">
                <div className="dash-card">
                    <div className="dash-card-head">
                        <h2>SK Budget Items</h2>
                        <Link to="/Expenditure" className="dash-link" style={{ textDecoration: 'none', fontWeight: 600 }}>
                            + Record Expense
                        </Link>
                    </div>
                    <div className="sk-scroll-area" style={{ flex: 1, marginTop: '10px', overflowY: 'auto' }}>
                        {(stats.categoryBalances[0]?.subcategories || []).length === 0 ? (
                            <div style={{ 
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                                height: '100%', padding: '20px', textAlign: 'center'
                            }}>
                                <div style={{ 
                                    backgroundColor: '#eff6ff', width: '64px', height: '64px', borderRadius: '50%', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '16px' 
                                }}>
                                    📁
                                </div>
                                <h4 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '1.05rem', fontWeight: '600' }}>No SK Budget Items Yet</h4>
                                <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '0.85rem', maxWidth: '280px', lineHeight: '1.5' }}>
                                    You haven't created any specific budget items for the SK yet. Create one to start tracking expenses.
                                </p>
                                <Link to="/Expenditure" className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem', textDecoration: 'none', color: '#fff', borderRadius: '8px', fontWeight: '600' }}>
                                    + Create Budget Item
                                </Link>
                            </div>
                        ) : (
                            <ul className="activity-list">
                                {stats.categoryBalances[0].subcategories.map((subcategory) => (
                                    <ActivityRow
                                        key={subcategory.id}
                                        dot="blue"
                                        title={subcategory.name}
                                        meta={`${formatPeso(subcategory.spent_amount)} spent · ${formatPeso(subcategory.balance)} remaining`}
                                        time={`${formatPeso(subcategory.allocated_amount)} allocated`}
                                    />
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <SKChart />
            </section>
        </div>
    );
}