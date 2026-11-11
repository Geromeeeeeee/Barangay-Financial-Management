import { useState } from "react";
import { ActivityRow } from "./dashboard_widgets";
import RecentActivityModal from "./recent_activity_modal";
import "../styles/dashboard.css"

function timeAgo(dateString) {
    if (!dateString) return "";
    const then = new Date(dateString.replace(" ", "T")).getTime();
    const now = Date.now();
    const diff = Math.floor((now - then) / 1000);

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;

    return new Date(dateString).toLocaleDateString("en-PH", {
        month: "short", day: "numeric", year: "numeric",
    });
}

export default function RecentActivity({activityType, refresh, loading, selectedActivity, setActivityType}){
    const [isModalOpen, setIsModalOpen] = useState(false);
    const isAllocation = activityType === "allocation";
    const isRevenue = activityType === "revenue";

    return(
    <>
        <div className="activity-wrapper dash-card">
            <div className="dash-card-head" style={{ marginBottom: '10px' }}>
                <h2>{isAllocation ? "Recent SK Funding" : isRevenue ? "Recent Revenue" : "Recent Expenditures"}</h2>
                <button className="dash-link" onClick={() => setIsModalOpen(true)}>
                    View All
                </button>
            </div>

            {loading && <p className="muted">Loading…</p>}
            {!loading && selectedActivity.length === 0 && (
                <p className="muted">No recent activity.</p>
            )}

            {!loading && selectedActivity.length > 0 && (
                <div className="recent-revenue-list">
                    <ul className="activity-list">
                        {selectedActivity.map((row) => (
                            <ActivityRow
                                key={`${activityType}-${row.id}`}
                                dot={isRevenue || isAllocation ? "green" : "red"}
                                title={isRevenue || isAllocation ? row.source : `Expenditure: ${row.description}`}
                                meta={`₱${Number(row.amount).toLocaleString()}`}
                                time={timeAgo(row.created_at)}
                            />
                        ))}
                    </ul>
                </div>
            )}
                        
            <div className="activity-toggle">
                <button
                    type="button"
                    className={isAllocation || isRevenue ? "active" : ""}
                    onClick={() => setActivityType(isAllocation ? "allocation" : "revenue")}
                >
                    {isAllocation ? "SK Funding" : "Revenue"}
                </button>
                <button
                    type="button"
                    className={activityType === "expenditure" ? "active" : ""}
                    onClick={() => setActivityType("expenditure")}
                >
                    Expenditures
                </button>
            </div>
        </div>
        
        <RecentActivityModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            activityType={activityType} 
            selectedActivity={selectedActivity}
            refresh={refresh}
            loading={loading}
        />
    </>
    )
}