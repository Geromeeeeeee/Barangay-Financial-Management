import { Outlet, Link } from "react-router-dom"
import '../styles/layout.css'

export default function DashboardLayout() {
    return (
        <div className="dashboard-container">
            <aside className="sidebar">
                <h2>Barangay Finance</h2>
                <nav>
                    <Link to="/Dashboard">Dashboard</Link>
                    <Link to="/Revenue">Revenue</Link>
                </nav>
                <p>Logout</p>
            </aside>

            {/* Main Content Area (Changes based on route) */}
            <main className="main-content" style={{ flex: 1, padding: '30px', overflowY: 'auto', background: '#f8fafc' }}>
                <Outlet />
            </main>
        </div>
    );
}