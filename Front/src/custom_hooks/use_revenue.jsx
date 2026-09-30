import { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function useRevenue () {
    const [revenues, setRevenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchRevenue = useCallback((signal) => (
        axios.get(`${API_URL}revenue/get_revenue.php`, {
            signal,
            withCredentials: true
        })
    ), []);

    useEffect(() => {
        const controller = new AbortController();

        fetchRevenue(controller.signal)
            .then((response) => {
                if (response?.data?.status === 'success') {
                    setRevenues(response.data.data || []);
                } else {
                    setError('Failed to load revenues.');
                }
            })
            .catch((requestError) => {
                if (requestError.name !== 'CanceledError') {
                    setError(requestError.response?.data?.message || 'Failed to load revenues.');
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            });

        return () => controller.abort();
    }, [fetchRevenue]);

    const refetch = useCallback(() => {
        setLoading(true);
        setError('');

        return fetchRevenue()
            .then((response) => {
                if (response?.data?.status === 'success') {
                    setRevenues(response.data.data || []);
                } else {
                    setError('Failed to load revenues.');
                }
            })
            .catch((requestError) => {
                setError(requestError.response?.data?.message || 'Failed to load revenues.');
            })
            .finally(() => setLoading(false));
    }, [fetchRevenue]);

    return { revenues, loading, error, refetch };
}