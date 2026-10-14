import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function useSubmitExpenditure({setLoading, setErrorMessage, setIsModalOpen, selectedCategory}){
    const handleSubmit = async (event) =>{
        event.preventDefault();
        setLoading(true);
        setErrorMessage("");

        const formData = new FormData(event.target);
        try {
            const response = await axios.post(`${API_URL}expenditure/add_expenditure.php`, {
                amount: parseFloat(formData.get("amount")),
                description: formData.get("description"),
                category_id: selectedCategory?.id || formData.get("categoryId") || null,
                subcategory_id: formData.get("subcategoryId") || null
            }, { withCredentials: true });

            if (response?.data?.status === "expenditure_recorded") {
                setIsModalOpen(false);
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