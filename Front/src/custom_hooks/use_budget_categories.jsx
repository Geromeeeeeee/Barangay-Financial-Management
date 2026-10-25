import { useCallback, useEffect, useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function useBudgetCategories() {
    const [categories, setCategories] = useState([]);
    const [income, setIncome] = useState({ nta: 0, local_income: 0, total_annual_income: 0 });
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
                setIncome(response.data.income || { nta: 0, local_income: 0, total_annual_income: 0 });
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
        setIncome(response.data.income || { nta: 0, local_income: 0, total_annual_income: 0 });
    }), []);

    const deleteSubcategory = useCallback((id) => axios.delete(`${API_URL}budget/categories.php?id=${id}`, {
        withCredentials: true
    }).then((response) => {
        if (response?.data?.status !== "success") throw new Error(response?.data?.message || "Failed to delete subcategory.");
        setCategories(response.data.data || []);
        setIncome(response.data.income || { nta: 0, local_income: 0, total_annual_income: 0 });
    }), []);

    const saveMajorCategory = useCallback((payload) => axios.post(`${API_URL}budget/categories.php`, {
        ...payload,
        action: "add_major_category",
    }, {
        withCredentials: true
    }).then((response) => {
        if (response?.data?.status !== "success") throw new Error(response?.data?.message || "Failed to save major category.");
        setCategories(response.data.data || []);
        setIncome(response.data.income || { nta: 0, local_income: 0, total_annual_income: 0 });
    }), []);

    return { categories, income, loading, error, refetch, saveSubcategory, deleteSubcategory, saveMajorCategory };
}
