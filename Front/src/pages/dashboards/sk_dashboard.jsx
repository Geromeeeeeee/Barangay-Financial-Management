import { useState } from "react";
import "../../styles/dashboard.css";
import "../../styles/sk_dashboard.css";
import DashboardChart from "../../components/dashboard_chart";
import { 
    IconUsers, IconChart, ActivityRow, DashboardHero 
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
            
            <div className="sk-top-split">
                <DashboardHero user={user} />
                <div className="sk-budget-card">
                    <div className="sk-budget-inner">
                        <div className="sk-budget-icon">
                            ₱
                        </div>
                        <div>
                            <span>Available SK Funds</span>
                            <strong>{loading ? "…" : formatPeso(skBudget.balance)}</strong>
                        </div>
                    </div>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <section className="sk-main-layout">
                
                <div className="dash-card sk-action-card">
                    <div className="dash-card-head">
                        <h2>Submit New Project Request</h2>
                    </div>
                
                    {user.role === 'sk_chairman' ? (
                        <form onSubmit={handleRequest} className="sk-project-form">
                            <div className="form-group">
                                <label>Project Title</label>
                                <input name="title" placeholder="e.g., Basketball Court Repair" required />
                            </div>
                            <div className="form-group">
                                <label>Requested Amount (₱)</label>
                                <input name="cost" type="number" min="0.01" step="0.01" placeholder="0.00" required />
                            </div>
                            <div className="form-group">
                                <label>Project Description</label>
                                <textarea name="desc" placeholder="Describe the purpose and details of the project..." required rows="3"></textarea>
                            </div>
                            <div className="form-group">
                                <label className="sk-attachment-label">
                                    Supporting Documents (You can attach multiple files, e.g., PDFs, images)
                                </label>
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
                            </div>
                            <button type="submit" className="btn-primary sk-submit-btn">Submit to Treasurer</button>
                        </form>
                    ) : (
                        <div className="dash-tip">
                            <strong>Note:</strong> Only the SK Chairman can submit project requests.
                        </div>
                    )}
                </div>

                <div className="sk-right-column">
                    <div className="dash-card sk-status-card">
                        <div className="dash-card-head">
                            <h2>Your Requests</h2>
                            <button className="dash-link" onClick={fetchProjects}>Refresh</button>
                        </div>
                        
                        {projects.length === 0 ? (
                            <div className="sk-empty-state">
                                <p>You haven't submitted any project requests yet.</p>
                            </div>
                        ) : (
                            <div className="sk-scroll-area">
                                <ul className="activity-list">
                                    {projects.map((p) => (
                                        <div key={p.id} className="sk-request-item">
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
                                                                📎 {attachment.file_name}
                                                            </a>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="dash-card sk-approved-allocations">
                        <div className="dash-card-head">
                            <h2>Approved SK Allocations</h2>
                        </div>
                        <div className="sk-scroll-area">
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
                        </div>
                    </div>
                </div>

            </section>
            
            <DashboardChart />
        </div>
    );
}