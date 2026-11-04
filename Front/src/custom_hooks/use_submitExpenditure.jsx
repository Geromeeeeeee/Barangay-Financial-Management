import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function useSubmitExpenditure({setLoading, setErrorMessage, selectedFiles = [], setSuccessMessage}){
    const handleSubmit = async (event) =>{
        event.preventDefault();
        setLoading(true);
        setErrorMessage("");

        const formData = new FormData(event.target);
        try {
            formData.delete("supporting_documents[]");
            selectedFiles.forEach((file) => formData.append("supporting_documents[]", file));
            if (!formData.get("monthly_allocation_id")) {
                throw new Error("Select a monthly allocation before recording the expenditure.");
            }

            const response = await axios.post(
                `${API_URL}expenditure/add_expenditure.php`,
                formData,
                { withCredentials: true }
            );

            if (response?.data?.status === "expenditure_recorded") {
                setSuccessMessage("Expenditure Recorded!")
            } else {
                setErrorMessage("Failed to record expenditure.");
            }
        } catch (requestError) {
            setErrorMessage(requestError.response?.data?.message || "Server error. Please check your backend connection.");
        } finally {
            setLoading(false);
        }
    }

    return {handleSubmit}
}