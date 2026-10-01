import { Outlet, Link, useNavigate } from "react-router-dom"
import { useRole } from "../custom_hooks/use_role"
import axios from "axios"
import '../styles/layout.css'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function DashboardLayout() {
    const { user, isAdmin } = useRole();
    const navigate = useNavigate();

    const handleLogout = async () => {
    try {
        await axios.post(
            `${API_URL}auth.php`,
            { action: 'logOut' },
            { withCredentials: true }
        );
    } catch (e) {
        console.error("Logout request failed:", e);
    } finally {
        localStorage.removeItem("user");
        navigate("/");
    }
};

    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <h2>Barangay Finance</h2>

                {user && (
                    <div className="user-badge">
                        <div className="user-name">
                            {user.firstName} {user.lastName}
                        </div>
                        <div className="user-role">{user.role}</div>
                    </div>
                )}

                <nav>
                    <Link to="/Dashboard">Dashboard</Link>
                    <Link to="/Revenue">Revenue</Link>

                    {isAdmin && (
                        <>
                            <div className="nav-section">Admin</div>
                            <Link to="/admin/invite-codes">Invite Codes</Link>
                            <Link to="/admin/pending-users">Pending Users</Link>
                        </>
                    )}
                </nav>

                {/* Logout pinned to bottom */}
                <div className="sidebar-footer">
                    <button
                        type="button"
                        className="logout-btn"
                        onClick={handleLogout}
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>Log out</span>
                    </button>
                </div>
            </aside>

            <main className="main-content" style={{ flex: 1, padding: '30px', overflowY: 'auto', background: '#f8fafc' }}>
                <Outlet />
            </main>
        </div>
    );
}