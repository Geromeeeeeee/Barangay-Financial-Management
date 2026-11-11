import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export function useSKStats() {
    const [stats, setStats] = useState({
        fiscalYear: new Date().getFullYear(),
        annualAllocation: 0,
        totalExpenditures: 0,
        remainingBudget: 0,
        utilizationPercentage: 0,
        monthlyFunding: 0,
        categoryBalances: [],
        recentAllocations: [],
        recentExpenditures: [],
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const refresh = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await axios.get(`${API_URL}sk/dashboard_stats.php`, {
                withCredentials: true,
            });
            if (response?.data?.status !== "success") {
                throw new Error(response?.data?.message || "Failed to load SK dashboard statistics.");
            }
            setStats(response.data);
        } catch (requestError) {
            setError(requestError.response?.data?.message || requestError.message || "Failed to load SK dashboard statistics.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            refresh();
        }, 0);
        const interval = setInterval(refresh, 300000);
        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, []);

    return { stats, loading, error, refresh };
}
