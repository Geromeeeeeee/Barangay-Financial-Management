import { useRole } from "../custom_hooks/use_role";
import "../styles/dashboard.css";
import AdminDashboard from "./dashboards/admin_dashboard";
import TreasurerDashboard from "./dashboards/treasurer_dashboard";
import StaffDashboard from "./dashboards/staff_dashboard";

export default function Dashboard() {
    const { user, isAdmin, isTreasurer, isStaff } = useRole();

    if (!user) return null;

    if (isAdmin)     return <AdminDashboard user={user} />;
    if (isTreasurer) return <TreasurerDashboard user={user} />;
    if (isStaff)     return <StaffDashboard user={user} />;

    return <div style={{ padding: 30 }}>Unknown role</div>;
}