import { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function useExpenditure() {
    const [expenditures, setExpenditures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchExpenditures = useCallback((signal) => (
        axios.get(`${API_URL}expenditure/get_expenditures.php`, {
            signal,
            withCredentials: true
        })
    ), []);

    useEffect(() => {
        const controller = new AbortController();

        fetchExpenditures(controller.signal)
            .then((response) => {
                if (response?.data?.status === "success") {
                    setExpenditures(response.data.data || []);
                } else {
                    setError("Failed to load expenditures.");
                }
            })
            .catch((requestError) => {
                if (requestError.name !== "CanceledError") {
                    setError(requestError.response?.data?.message || "Failed to load expenditures.");
                }
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [fetchExpenditures]);

    const refetch = useCallback(() => {
        setLoading(true);
        setError("");

        return fetchExpenditures()
            .then((response) => {
                if (response?.data?.status === "success") {
                    setExpenditures(response.data.data || []);
                } else {
                    setError("Failed to load expenditures.");
                }
            })
            .catch((requestError) => {
                setError(requestError.response?.data?.message || "Failed to load expenditures.");
            })
            .finally(() => setLoading(false));
    }, [fetchExpenditures]);

    return { expenditures, loading, error, refetch };
}
