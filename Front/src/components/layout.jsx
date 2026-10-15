import { useState } from "react"
import { Outlet, Link, useNavigate } from "react-router-dom"
import { useRole } from "../custom_hooks/use_role"
import axios from "axios"
import '../styles/layout.css'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function DashboardLayout() {
    const { isAdmin } = useRole();
    const navigate = useNavigate();

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const confirmLogout = async () => {
        setLoggingOut(true);
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
                <h3>Barangay <br /> Finance</h3>

                <nav>
                    <Link to="/Dashboard">Dashboard</Link>
                    <Link to="/Revenue">Revenue</Link>
                    <Link to="/Expenditure">Expenditures</Link>

                    {isAdmin && (
                        <Link to="/admin/invite-codes">Invite Codes</Link>
                    )}
                </nav>

                <div className="sidebar-footer">
                    <button
                        type="button"
                        className="logout-btn"
                        onClick={() => setShowLogoutConfirm(true)}
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

            {/* ===== Logout Confirmation Modal ===== */}
            {showLogoutConfirm && (
                <div
                    className="logout-modal-backdrop"
                    onClick={() => !loggingOut && setShowLogoutConfirm(false)}
                >
                    <div
                        className="logout-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="logout-modal-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </div>

                        <h3>Log out?</h3>
                        <p>Are you sure you want to end your session?</p>

                        <div className="logout-modal-actions">
                            <button
                                type="button"
                                className="logout-modal-cancel"
                                onClick={() => setShowLogoutConfirm(false)}
                                disabled={loggingOut}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="logout-modal-confirm"
                                onClick={confirmLogout}
                                disabled={loggingOut}
                            >
                                {loggingOut ? "Logging out…" : "Yes, log out"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}