import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export function useDashboardStats() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingApprovals: 0,
        activeCodes: 0,
        recordsThisMonth: 0,
        totalRevenue: 0,
        fundBalances: [],
        recentActivity: [],
        recentRequests: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const refresh = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await axios.get(`${API_URL}admin/dashboard_stats.php`, {
                withCredentials: true,
            });
            setStats(res.data);
        } catch (e) {
            setError("Failed to load stats");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
        // Auto-refresh every 30 seconds
        const interval = setInterval(refresh, 30000);
        return () => clearInterval(interval);
    }, []);

    return { stats, loading, error, refresh };
}