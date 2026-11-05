import { useState } from "react"
import { Outlet, NavLink, useNavigate } from "react-router-dom"
import { useRole } from "../custom_hooks/use_role"
import axios from "axios"
{/**
import { Home, Inbox, Folder, BarChart, Users, Shield, Settings, LogOut, FileText } from "lucide-react"
*/}
import { Home, Inbox, Folder, BarChart, Users, Shield, Settings, LogOut } from "lucide-react"
import sealLogo from "../assets/barangay-malagasang-logo.jpg"
import NotificationBell from "../components/notification_bell"
import UserMenu from "../components/user_menu"
import '../styles/layout.css'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function DashboardLayout() {
    {/** 
    const { isAdmin, isTreasurer, isStaff, isSK } = useRole(); 
    */}
    const { isAdmin, isTreasurer, isSK } = useRole();
    const navigate = useNavigate();

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const confirmLogout = async () => {
        setLoggingOut(true);
        try {
            await axios.post(`${API_URL}auth.php`, { action: 'logOut' }, { withCredentials: true });
        } catch (e) {
            console.error("Logout request failed:", e);
        } finally {
            localStorage.removeItem("user");
            navigate("/");
        }
    };

    const linkClass = ({ isActive }) => `nav-item ${isActive ? 'active' : ''}`;

    return (
        <div className="topnav-layout">
            
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <img src={sealLogo} alt="Malagasang II-A Seal" className="sidebar-logo" />
                    <span className="sidebar-brand-text">Malagasang II-A</span>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/Dashboard" className={linkClass}>
                        <div className="nav-icon"><Home size={22} /></div>
                        <span className="nav-text">Dashboard</span>
                    </NavLink>

                    {(isAdmin || isTreasurer || isSK) && (
                        <>
                            <NavLink to="/Revenue" className={linkClass}>
                                <div className="nav-icon"><Inbox size={22} /></div>
                                <span className="nav-text">Revenue</span>
                            </NavLink>
                            <NavLink to="/Expenditure" className={linkClass}>
                                <div className="nav-icon"><Folder size={22} /></div>
                                <span className="nav-text">Expenditures</span>
                            </NavLink>
                        </>
                    )}
                    
                    {isTreasurer && (
                        <NavLink to="/Reports" className={linkClass}>
                            <div className="nav-icon"><BarChart size={22} /></div>
                            <span className="nav-text">Financial Reports</span>
                        </NavLink>
                    )}

                    {/**
                    {(isStaff || isAdmin) && (
                        <NavLink to="/ClearanceReport" className={linkClass}>
                            <div className="nav-icon"><FileText size={22} /></div>
                            <span className="nav-text">Clearance Reports</span>
                        </NavLink>
                    )}
                    */}

                    {isAdmin && (
                        <>
                            <NavLink to="/admin/invite-codes" className={linkClass}>
                                <div className="nav-icon"><Users size={22} /></div>
                                <span className="nav-text">Invite Codes</span>
                            </NavLink>
                            <NavLink to="/admin/audit-trail" className={linkClass}>
                                <div className="nav-icon"><Shield size={22} /></div>
                                <span className="nav-text">Audit Trail</span>
                            </NavLink>
                        </>
                    )}

                    <NavLink to="/Settings" className={linkClass}>
                        <div className="nav-icon"><Settings size={22} /></div>
                        <span className="nav-text">Settings</span>
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <button onClick={() => setShowLogoutConfirm(true)} className="nav-item logout-btn">
                        <div className="nav-icon"><LogOut size={22} /></div>
                        <span className="nav-text">Logout</span>
                    </button>
                </div>
            </aside>

            <div className="main-wrapper">
                <header className="topnav-header">
                    <div className="topnav-actions">
                        <NotificationBell /> 
                        <div onClick={() => navigate("/Settings")} style={{ cursor: 'pointer' }}>
                            <UserMenu />
                        </div>
                    </div>
                </header>

                <main className="topnav-content">
                    <Outlet />
                </main>
            </div>

            {showLogoutConfirm && (
                <div className="logout-modal-backdrop" onClick={() => !loggingOut && setShowLogoutConfirm(false)}>
                    <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="logout-modal-icon">
                            <LogOut />
                        </div>
                        <h3>Log out?</h3>
                        <p>Are you sure you want to end your session?</p>
                        <div className="logout-modal-actions">
                            <button type="button" className="logout-modal-cancel" onClick={() => setShowLogoutConfirm(false)} disabled={loggingOut}>Cancel</button>
                            <button type="button" className="logout-modal-confirm" onClick={confirmLogout} disabled={loggingOut}>
                                {loggingOut ? "Logging out…" : "Yes, log out"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}