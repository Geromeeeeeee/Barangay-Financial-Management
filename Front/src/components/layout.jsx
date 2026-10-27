import { useState, useEffect, useRef } from "react"
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom"
import { useRole } from "../custom_hooks/use_role"
import axios from "axios"
import sealLogo from "../assets/barangay-malagasang-logo.jpg"
import NotificationBell from "../components/notification_bell"
import UserMenu from "../components/user_menu"
import '../styles/layout.css'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function DashboardLayout() {
    const { isAdmin, isTreasurer, isStaff, isSK } = useRole(); 
    const navigate = useNavigate();
    const location = useLocation();

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    
    const navRef = useRef(null);
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

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

    useEffect(() => {
        const updateIndicator = () => {
            if (!navRef.current) return;
            const activeLink = navRef.current.querySelector('.nav-item.active');
            if (activeLink) {
                setIndicatorStyle({
                    left: activeLink.offsetLeft,
                    width: activeLink.offsetWidth
                });
            }
        };

        const timeout = setTimeout(updateIndicator, 50);
        window.addEventListener('resize', updateIndicator);
        
        return () => {
            clearTimeout(timeout);
            window.removeEventListener('resize', updateIndicator);
        };
    }, [location.pathname, isAdmin, isTreasurer, isStaff, isSK]);

    const linkClass = ({ isActive }) => `nav-item ${isActive ? 'active' : ''}`;

    return (
        <div className="topnav-layout">
            
            <header className="topnav-header">
                <div className="topnav-brand">
                    <img src={sealLogo} alt="Malagasang II-A Seal" className="topnav-logo" />
                    <h2>Malagasang II-A</h2>
                </div>

                <div className="topnav-links" ref={navRef}>
                    <NavLink to="/Dashboard" className={linkClass}>
                        Dashboard
                    </NavLink>

                    {(isAdmin || isTreasurer || isSK) && (
                        <>
                            <NavLink to="/Revenue" className={linkClass}>Revenue</NavLink>
                            <NavLink to="/Expenditure" className={linkClass}>Expenditures</NavLink>
                        </>
                    )}
                    
                    {(isStaff || isTreasurer) && (
                        <NavLink to="/Reports" className={linkClass}>Reports</NavLink>
                    )}
                    
                    {isTreasurer && (
                        <NavLink to="/admin/projects" className={linkClass}>Project Requests</NavLink>
                    )}

                    {isAdmin && (
                        <>
                            <NavLink to="/admin/invite-codes" className={linkClass}>Invite Codes</NavLink>
                            <NavLink to="/admin/audit-trail" className={linkClass}>Audit Trail</NavLink>
                        </>
                    )}

                    <span className="nav-indicator" style={indicatorStyle} />
                </div>

                <div className="topnav-actions" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <NotificationBell /> 
                    <UserMenu onLogoutClick={() => setShowLogoutConfirm(true)} />
                </div>
            </header>

            <main className="topnav-content">
                <Outlet />
            </main>

            {showLogoutConfirm && (
                <div className="logout-modal-backdrop" onClick={() => !loggingOut && setShowLogoutConfirm(false)}>
                    <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="logout-modal-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
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