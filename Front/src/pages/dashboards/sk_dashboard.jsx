import "../../styles/dashboard.css";
import "../../styles/sk_dashboard.css";
import DashboardChart from "../../components/dashboard_chart"; 
import { 
    IconUsers, IconMoney, IconChart, 
    StatCard, ActivityRow, DashboardHero 
} from "../../components/dashboard_widgets";
import { useDashboardStats } from "../../custom_hooks/use_dashboard_stats";
import { useProjects } from "../../custom_hooks/use_projects";

export default function SKDashboard({ user }) {
    const { stats, loading, error } = useDashboardStats();
    const { projects, submitProject, fetchProjects } = useProjects();

    const skBudget = stats.categoryBalances?.find(c => c.name === "SK") || { balance: 0, allocated_amount: 0 };

    const formatPeso = (val) => "₱" + Number(val || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });

    const handleRequest = async (e) => {
        e.preventDefault();
        const form = new FormData(e.target);
        
        await submitProject({
            title: form.get("title"),
            description: form.get("desc"),
            estimated_cost: form.get("cost")
        });
        
        e.target.reset();
        alert("Project Request Submitted to Treasurer!");
        fetchProjects();
    };

    return (
        <div className="dashboard-page sk-view">
            <DashboardHero user={user} />

            {error && <div className="alert alert-error">{error}</div>}

            <section className="stat-grid">
                <StatCard 
                    Icon={IconMoney} 
                    label="SK Fund Balance" 
                    value={loading ? "…" : formatPeso(skBudget.balance)} 
                    trend="Available for projects" 
                    accent="green" 
                />
                <StatCard 
                    Icon={IconChart} 
                    label="Allocated Budget" 
                    value={loading ? "…" : formatPeso(skBudget.allocated_amount)} 
                    trend="For the year" 
                    accent="blue" 
                />
                <StatCard 
                    Icon={IconUsers} 
                    label="SK Role" 
                    value={user.role === 'sk_chairman' ? "Chairman" : "Member"} 
                    trend="Access level" 
                    accent="purple" 
                />
            </section>

        
            <DashboardChart />
            <section className="dash-columns">
                <div className="dash-card">
                    <div className="dash-card-head">
                        <h2>My Project Requests</h2>
                        <button className="dash-link" onClick={fetchProjects}>Refresh</button>
                    </div>
                    
                    {projects.length === 0 ? (
                        <p className="muted">No projects requested yet.</p>
                    ) : (
                        <ul className="activity-list">
                            {projects.map((p) => (
                                <ActivityRow 
                                    key={p.id}
                                    dot={p.status === 'approved' ? 'green' : p.status === 'rejected' ? 'red' : 'amber'} 
                                    title={p.title} 
                                    meta={`${formatPeso(p.estimated_cost)} · ${p.status.toUpperCase()}`} 
                                    time={new Date(p.created_at).toLocaleDateString()} 
                                />
                            ))}
                        </ul>
                    )}
                </div>
                <div className="dash-card">
                    <div className="dash-card-head">
                        <h2>Request a New Project</h2>
                    </div>
                
                    {user.role === 'sk_chairman' ? (
                        <form onSubmit={handleRequest} className="sk-project-form">
                            <input name="title" placeholder="Project Title (e.g., Basketball Court)" required />
                            <input name="cost" type="number" placeholder="Estimated Cost (₱)" required />
                            <textarea name="desc" placeholder="Describe the project..." required rows="3"></textarea>
                            <button type="submit" className="btn-primary">Submit to Treasurer</button>
                        </form>
                    ) : (
                        <div className="dash-tip">
                            <strong>Note:</strong> Only the SK Chairman can submit project requests.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}