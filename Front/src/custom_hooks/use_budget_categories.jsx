import { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function useBudgetCategories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchCategories = useCallback(() => axios.get(`${API_URL}budget/categories.php`, {
        withCredentials: true
    }), []);

    const refetch = useCallback(() => {
        setLoading(true);
        return fetchCategories()
            .then((response) => {
                if (response?.data?.status !== "success") throw new Error(response?.data?.message || "Failed to load categories.");
                setCategories(response.data.data || []);
                setError("");
            })
            .catch((requestError) => setError(requestError.response?.data?.message || requestError.message))
            .finally(() => setLoading(false));
    }, [fetchCategories]);

    useEffect(() => {
        const timer = setTimeout(() => { refetch(); }, 0);
        return () => clearTimeout(timer);
    }, [refetch]);

    const saveSubcategory = useCallback((payload) => axios({
        method: payload.id ? "put" : "post",
        url: `${API_URL}budget/categories.php`,
        data: payload,
        withCredentials: true
    }).then((response) => {
        if (response?.data?.status !== "success") throw new Error(response?.data?.message || "Failed to save subcategory.");
        setCategories(response.data.data || []);
    }), []);

    const deleteSubcategory = useCallback((id) => axios.delete(`${API_URL}budget/categories.php?id=${id}`, {
        withCredentials: true
    }).then((response) => {
        if (response?.data?.status !== "success") throw new Error(response?.data?.message || "Failed to delete subcategory.");
        setCategories(response.data.data || []);
    }), []);

    return { categories, loading, error, refetch, saveSubcategory, deleteSubcategory };
}
