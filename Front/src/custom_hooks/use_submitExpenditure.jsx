import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function useSubmitExpenditure({
    setLoading, 
    setErrorMessage, 
    receiptFile = null,
    supportingFiles = [], 
    setSuccessMessage,
    ocrStatus = 'idle'
}){
    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setErrorMessage("");

        const formData = new FormData(event.target);
        formData.delete("supporting_documents[]");

        try {
            if (!receiptFile) {
                throw new Error("A receipt attachment is required to log an expenditure.");
            }

            // Automatically override if OCR status is mismatch or unreadable
            const shouldOverride = ocrStatus === 'mismatch' || ocrStatus === 'unreadable';

            const allFiles = [receiptFile, ...supportingFiles];
            allFiles.forEach((file) => formData.append("supporting_documents[]", file));
            
            if (!formData.get("monthly_allocation_id")) {
                throw new Error("Select a monthly allocation before recording the expenditure.");
            }

            formData.append("ocr_overridden", shouldOverride ? 1 : 0);

            const response = await axios.post(
                `${API_URL}expenditure/add_expenditure.php`,
                formData,
                { withCredentials: true }
            );

            if (response?.data?.status === "expenditure_recorded") {
                setSuccessMessage("Expenditure Recorded!");
            } else {
                setErrorMessage(response?.data?.message || "Failed to record expenditure.");
            }
        } catch (requestError) {
            const message = requestError.response?.data?.message || requestError.message || "Server error. Please check your backend connection.";
            setErrorMessage(message);
        } finally {
            setLoading(false);
        }
    }

    return { handleSubmit };
}