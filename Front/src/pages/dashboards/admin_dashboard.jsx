import { useState } from "react";
import "../../styles/dashboard.css";
import "../../styles/admin_dashboard.css";
import DashboardChart from "../../components/dashboard_chart";
import {
    StatCard, DashboardHero,
} from "../../components/dashboard_widgets";
import { useDashboardStats } from "../../custom_hooks/use_dashboard_stats";
import RecentActivity from "../../components/recent_activity";
import BudgetBalances from "../../components/budget_balances";
import AnnualBudgetReleaseSection from "../../components/annual_budget_release_section";

export default function AdminDashboard({ user }) {
    const { stats, loading, error, refresh } = useDashboardStats();
    const [activityType, setActivityType] = useState("revenue");
    const [hiddenCategories, setHiddenCategories] = useState({});

    const toggleCategory = (id) => {
        setHiddenCategories(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const toggleAll = () => {
        const allHidden = stats.categoryBalances.length > 0 && 
                          stats.categoryBalances.every(c => hiddenCategories[c.id]);
        if (allHidden) {
            setHiddenCategories({});
        } else {
            const allHiddenState = {};
            stats.categoryBalances.forEach(c => allHiddenState[c.id] = true);
            setHiddenCategories(allHiddenState);
        }
    };

    const isFullyHidden = stats.categoryBalances.length > 0 && 
                          stats.categoryBalances.every(c => hiddenCategories[c.id]);

    const formatPeso = (value) => {
        return "₱" + Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });
    };
    
    const selectedActivity = activityType === "revenue"
        ? stats.recentActivity.slice(0, 2)
        : stats.recentExpenditures?.slice(0, 2) || [];

    const getCategoryStatus = (percentage) => {
        if (percentage >= 75) return "Critical";
        if (percentage >= 50) return "Warning";
        if (percentage >= 20) return "Good";
        return "Excellent";
    };

    return (
        <div className="dashboard-page admin-view">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="top-split-layout">
                <div className="hero-wrapper">
                    <DashboardHero user={user} />
                </div>

                <RecentActivity activityType={activityType} refresh={refresh} loading={loading} selectedActivity={selectedActivity} setActivityType={setActivityType}/>
            </div>

            <section className="stat-grid">
                <StatCard Icon="₱" label="Total Revenue" value={loading ? "…" : (isFullyHidden ? "***" : formatPeso(stats.totalRevenue))} trend="All time collection" accent="green" />
                <StatCard Icon="₱" label="Annual Income" value={loading ? "…" : (isFullyHidden ? "***" : formatPeso(stats.totalAnnualIncome))} trend="NTA + Local Income" accent="blue" />
                <StatCard Icon="₱" label="Total Allocated" value={loading ? "…" : (isFullyHidden ? "***" : formatPeso(stats.totalAllocated))} trend="All major categories" accent="purple" />
                <StatCard Icon="₱" label="Total Expenditures" value={loading ? "…" : (isFullyHidden ? "***" : formatPeso(stats.totalExpenditures))} trend="Recorded spending" accent="red" />
                <StatCard Icon="₱" label="Total Remaining" value={loading ? "…" : (isFullyHidden ? "***" : formatPeso(stats.totalRemaining))} trend="Category balances" accent="amber" />
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

            <AnnualBudgetReleaseSection stats={stats} loading={loading} formatPeso={formatPeso} isVisible={!isFullyHidden} />

            <DashboardChart />
        </div>
    );
}