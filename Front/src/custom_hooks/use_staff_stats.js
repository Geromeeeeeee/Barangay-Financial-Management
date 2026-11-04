import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export function useStaffStats() {
    const [stats, setStats] = useState({
        totalClearances: 0,
        pendingClearances: 0,
        thisMonth: 0,
        recentClearances: [],
        chartData: [] 
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchStats = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await axios.get(`${API_URL}staff/get_staff_stats.php`, { withCredentials: true });
            if (res.data.status === 'success') {
                setStats(res.data.data);
            } else {
                setError(res.data.message || "Failed to load staff stats.");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Server error.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    return { stats, loading, error, refresh: fetchStats };
}