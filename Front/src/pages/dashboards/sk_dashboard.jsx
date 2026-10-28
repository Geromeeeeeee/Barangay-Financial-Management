import { useState } from "react";
import "../../styles/dashboard.css";
import "../../styles/sk_dashboard.css";
import DashboardChart from "../../components/dashboard_chart";
import { 
    IconUsers, IconMoney, IconChart, 
    StatCard, ActivityRow, DashboardHero 
} from "../../components/dashboard_widgets";
import { useDashboardStats } from "../../custom_hooks/use_dashboard_stats";
import { useProjects } from "../../custom_hooks/use_projects";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function SKDashboard({ user }) {
    const { stats, loading, error } = useDashboardStats();
    const { projects, submitProject, fetchProjects } = useProjects();
    const [selectedFiles, setSelectedFiles] = useState([]);

    const skBudget = stats.categoryBalances?.find(c => c.name === "SK") || { balance: 0, allocated_amount: 0 };

    const formatPeso = (val) => "₱" + Number(val || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });

    const handleRequest = async (e) => {
        e.preventDefault();
        const form = new FormData(e.target);
        form.set("description", form.get("desc"));
        form.set("estimated_cost", form.get("cost"));
        form.delete("desc");
        form.delete("cost");
        form.delete("attachments[]");
        selectedFiles.forEach((file) => form.append("attachments[]", file));

        try {
            await submitProject(form);
            e.target.reset();
            setSelectedFiles([]);
            alert("Fund request submitted to the Treasurer.");
            fetchProjects();
        } catch (error) {
            alert(error.response?.data?.message || "The fund request could not be submitted.");
        }
    };

    const handleFileChange = (event) => {
        setSelectedFiles(Array.from(event.target.files || []));
    };

    const removeFile = (index) => {
        setSelectedFiles((files) => files.filter((_, fileIndex) => fileIndex !== index));
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
                                <div key={p.id}>
                                    <ActivityRow
                                        dot={p.status === 'approved' ? 'green' : p.status === 'declined' ? 'red' : 'amber'}
                                        title={p.title}
                                        meta={`${formatPeso(p.estimated_cost)} · ${p.status.toUpperCase()}`}
                                        time={new Date(p.created_at).toLocaleDateString()}
                                    />
                                    {(p.attachments || []).length > 0 && (
                                        <ul className="sk-request-files">
                                            {p.attachments.map((attachment) => (
                                                <li key={attachment.id}>
                                                    <a
                                                        href={`${API_URL}projects/download_attachment.php?id=${attachment.id}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        {attachment.file_name}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
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
                            <input name="cost" type="number" min="0.01" step="0.01" placeholder="Requested Amount (₱)" required />
                            <textarea name="desc" placeholder="Describe the project..." required rows="3"></textarea>
                            <label className="sk-attachment-label">
                                Supporting documents (optional, up to 5 files)
                                <input
                                    type="file"
                                    multiple
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={handleFileChange}
                                />
                                {selectedFiles.length > 0 && (
                                    <ul className="sk-selected-files">
                                        {selectedFiles.map((file, index) => (
                                            <li key={`${file.name}-${index}`}>
                                                <span>{file.name}</span>
                                                <button type="button" onClick={() => removeFile(index)}>Remove</button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </label>
                            <button type="submit" className="btn-primary">Submit to Treasurer</button>
                        </form>
                    ) : (
                        <div className="dash-tip">
                            <strong>Note:</strong> Only the SK Chairman can submit project requests.
                        </div>
                    )}
                </div>
            </section>
            <section className="dash-card sk-approved-allocations">
                <div className="dash-card-head">
                    <h2>Approved SK Allocations</h2>
                </div>
                <ul className="activity-list">
                    {(skBudget.subcategories || []).length === 0 ? (
                        <li className="muted">No approved allocations yet.</li>
                    ) : (
                        skBudget.subcategories.map((subcategory) => (
                            <ActivityRow
                                key={subcategory.id}
                                dot="green"
                                title={subcategory.name}
                                meta={formatPeso(subcategory.allocated_amount)}
                                time="Approved allocation"
                            />
                        ))
                    )}
                </ul>
            </section>
        </div>
    );
}