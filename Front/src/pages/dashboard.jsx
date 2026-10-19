import { useRole } from "../custom_hooks/use_role";
import "../styles/dashboard.css";
import AdminDashboard from "./dashboards/admin_dashboard";
import TreasurerDashboard from "./dashboards/treasurer_dashboard";
import StaffDashboard from "./dashboards/staff_dashboard";
import SKDashboard from "./dashboards/sk_dashboard";

export default function Dashboard() {
    const { user, isAdmin, isTreasurer, isStaff, isSK } = useRole();

    if (!user) return null;

    if (isAdmin)     return <AdminDashboard user={user} />;
    if (isTreasurer) return <TreasurerDashboard user={user} />;
    if (isSK)        return <SKDashboard user={user} />;
    if (isStaff)     return <StaffDashboard user={user} />;

    // Moved inline styles to a class name
    return <div className="unknown-role-msg">Unknown role</div>;
}