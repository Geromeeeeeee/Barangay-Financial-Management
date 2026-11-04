    import { useState, useEffect } from "react";
    import axios from "axios";

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

    export function useDashboardStats() {
        const [isVisible, setIsVisible] = useState(true)
        const [stats, setStats] = useState({
            totalUsers: 0,
            pendingApprovals: 0,
            activeCodes: 0,
            recordsThisMonth: 0,
            totalRevenue: 0,
            nta: 0,
            localIncome: 0,
            totalAnnualIncome: 0,
            totalAllocated: 0,
            totalExpenditures: 0,
            totalRemaining: 0,
            categoryBalances: [],
            recentActivity: [],
            recentExpenditures: [],
            recentRequests: [],
            fiscalYear: new Date().getFullYear(),
            annualApprovedBudget: 0,
            totalMonthlyReceipts: 0,
            unreleasedAnnualBudget: 0,
            releasePercentage: 0,
            totalAnnualExpenditures: 0,
            annualUtilizationPercentage: 0,
            receivedButUnspent: 0,
            unallocatedReceiptBalance: 0,
            allocatedButUnspentBalance: 0,
            monthlyLinkedExpenditures: 0,
            legacyExpenditures: 0,
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
            const interval = setInterval(refresh, 300000);
            return () => clearInterval(interval);
        }, []);

        return { stats, loading, error, refresh, isVisible, setIsVisible};
    }