import { useState } from "react";
import axios from "axios";
import { useToast } from "../context/toast_context";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function useVerify(onSuccess, resource = 'expenditure') {
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

    const updateStatus = async (id, status) => {
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}${resource}/verify_${resource}.php`, { id, status }, {
                withCredentials: true
            });
            showToast(response.data.message || `Record ${status} successfully.`, "success");
            if (onSuccess) onSuccess();
        } catch (error) {
            showToast(error.response?.data?.message || `Failed to ${status} record.`, "error");
        } finally {
            setLoading(false);
        }
    };

    return { updateStatus, loading };
}