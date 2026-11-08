import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function useSubmitExpenditure({
    setLoading, 
    setErrorMessage, 
    selectedFiles = [], 
    setSuccessMessage,
    // --- ADDED OCR PARAMETERS HERE ---
    ocrStatus = 'idle',
    isOverridden = false
}){
    const handleSubmit = async (event) =>{
        event.preventDefault();
        setLoading(true);
        setErrorMessage("");

        const formData = new FormData(event.target);
        
        try {
            // 🛑 RULE 1: HARD BLOCK - No File Uploaded
            if (!selectedFiles || selectedFiles.length === 0) {
                throw new Error("A receipt attachment is required to log an expenditure.");
            }

            // ⚠️ RULE 2: WARNING GUARD - Mismatch / Unreadable without manual override
            if ((ocrStatus === 'mismatch' || ocrStatus === 'unreadable') && !isOverridden) {
                throw new Error("Please resolve the receipt OCR mismatch warning or check 'Override OCR' to submit.");
            }

            formData.delete("supporting_documents[]");
            selectedFiles.forEach((file) => formData.append("supporting_documents[]", file));
            
            if (!formData.get("monthly_allocation_id")) {
                throw new Error("Select a monthly allocation before recording the expenditure.");
            }

            // Pass override flag to backend for Audit Logging
            formData.append("ocr_overridden", isOverridden ? 1 : 0);

            const response = await axios.post(
                `${API_URL}expenditure/add_expenditure.php`,
                formData,
                { withCredentials: true }
            );

            if (response?.data?.status === "expenditure_recorded") {
                setSuccessMessage("Expenditure Recorded!");
            } else {
                setErrorMessage("Failed to record expenditure.");
            }
        } catch (requestError) {
            // Handles both our custom thrown errors and Axios response errors
            const message = requestError.response?.data?.message || requestError.message || "Server error. Please check your backend connection.";
            setErrorMessage(message);
        } finally {
            setLoading(false);
        }
    }

    return { handleSubmit };
}