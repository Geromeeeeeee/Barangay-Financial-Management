import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function useSubmitExpenditure({setLoading, setErrorMessage, selectedCategory, setSuccessMessage}){
    const handleSubmit = async (event) =>{
        event.preventDefault();
        setLoading(true);
        setErrorMessage("");

        const formData = new FormData(event.target);
        try {
            formData.set("category_id", selectedCategory?.id || formData.get("categoryId") || "");
            formData.set("subcategory_id", formData.get("subcategoryId") || "");

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