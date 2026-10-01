import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export function useStaffStats() {
    const [stats, setStats] = useState({
        totalEntries: 0,
        entriesThisMonth: 0,
        totalAmount: 0,
        recentActivity: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const refresh = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await axios.get(`${API_URL}staff/dashboard_stats.php`, {
                withCredentials: true,
            });
            setStats(res.data);
        } catch (e) {
            setError("Failed to load staff stats");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 30000);
        return () => clearInterval(interval);
    }, []);

    return { stats, loading, error, refresh };
}