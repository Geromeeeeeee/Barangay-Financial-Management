import { timeAgo } from "../pages/dashboards/admin_dashboard";
import { ActivityRow } from "./dashboard_widgets";

export default function RecentActivity(){
    <div className="activity-wrapper dash-card">
        <div className="dash-card-head" style={{ marginBottom: '10px' }}>
            <h2>{activityType === "revenue" ? "Recent Revenue" : "Recent Expenditures"}</h2>
            <button className="dash-link" onClick={refresh}>Refresh</button>
        </div>

        {loading && <p className="muted">Loading…</p>}
        {!loading && selectedActivity.length === 0 && (
                        <p className="muted">No recent activity.</p>
        )}

        {!loading && selectedActivity.length > 0 && (
            <ul className="activity-list">
                {selectedActivity.map((row) => (
                    <ActivityRow
                        key={`${activityType}-${row.id}`}
                        dot={activityType === "revenue" ? "green" : "red"}
                        title={activityType === "revenue" ? row.source : `Expenditure: ${row.description}`}
                        meta={`₱${Number(row.amount).toLocaleString()}`}
                        time={timeAgo(row.created_at)}
                    />
                ))}
            </ul>
        )}
                    
        <div className="activity-toggle">
            <button
                type="button"
                className={activityType === "revenue" ? "active" : ""}
                onClick={() => setActivityType("revenue")}
            >
                Revenue
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
}