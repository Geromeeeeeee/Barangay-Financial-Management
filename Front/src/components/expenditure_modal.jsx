import { useState } from "react";
import axios from "axios";
import "../styles/expenditure.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function ExpenditureModal({ setIsModalOpen }) {
    const [fundAllocation, setFundAllocation] = useState("General");
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setErrorMessage("");

        const formData = new FormData(event.target);
        const selectedFundAllocation = formData.get("fundAllocation");
        const finalFundAllocation = selectedFundAllocation === "General"
            ? ""
            : selectedFundAllocation === "new"
                ? formData.get("newFundAllocation")
                : selectedFundAllocation;

        try {
            const response = await axios.post(`${API_URL}expenditure/add_expenditure.php`, {
                amount: parseFloat(formData.get("amount")),
                description: formData.get("description"),
                fund_allocation: finalFundAllocation
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
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="expenditure-modal-title"
            className="expenditure-modal-background"
            onClick={() => setIsModalOpen(false)}
        >
            <div className="expenditure-modal" onClick={(event) => event.stopPropagation()}>
                <h2 id="expenditure-modal-title">Record Expenditure</h2>
                {errorMessage && <div className="expenditure-modal-error">{errorMessage}</div>}

                <form onSubmit={handleSubmit} className="expenditure-form">
                    <label>
                        <span>Amount</span>
                        <input name="amount" type="number" min="0" step="0.01" placeholder="0.00" required />
                    </label>
                    <label>
                        <span>Description</span>
                        <input name="description" type="text" placeholder="e.g., Community supplies" required />
                    </label>
                    <label>
                        <span>Fund allocation</span>
                        <select
                            name="fundAllocation"
                            value={fundAllocation}
                            onChange={(event) => setFundAllocation(event.target.value)}
                        >
                            <option value="General">General</option>
                            <option value="new">Enter fund allocation</option>
                        </select>
                    </label>
                    {fundAllocation === "new" && (
                        <label>
                            <span>Fund allocation</span>
                            <input name="newFundAllocation" type="text" placeholder="Enter allocation name" autoFocus required />
                        </label>
                    )}
                    <div className="expenditure-modal-actions">
                        <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? "Saving..." : "Save Expenditure"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
