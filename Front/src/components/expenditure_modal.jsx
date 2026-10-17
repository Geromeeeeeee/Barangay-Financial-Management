import { useState } from "react";
import "../styles/expenditure.css";
import { useRole } from "../custom_hooks/use_role";
import useSubmitExpenditure from "../custom_hooks/use_submitExpenditure";

export default function ExpenditureModal({ setIsModalOpen, categories = [], selectedCategory = null }) {
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const {isStaff, isTreasurer} = useRole();
    const {handleSubmit} = useSubmitExpenditure({setLoading, setErrorMessage, selectedCategory, setIsModalOpen});
    
    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="expenditure-modal-title"
            className="expenditure-modal-background"
            onClick={() => setIsModalOpen(false)}
        >
            <div className="expenditure-modal" onClick={(event) => event.stopPropagation()}>
                <h2 id="expenditure-modal-title">
                    {isStaff ? "Request Expenditure" : "Record Expenditure"}
                </h2>
                {errorMessage && <div className="expenditure-modal-error">{errorMessage}</div>}

                <form onSubmit={handleSubmit} className="expenditure-form">
                    {selectedCategory && (
                        <div className="expenditure-selected-category">
                            Category: <strong>{selectedCategory.name}</strong>
                        </div>
                    )}
                    {selectedCategory && <label>
                        <span>Fund allocation</span>
                        <select name="subcategoryId" defaultValue="">
                            <option value="">Use main category balance</option>
                            {(selectedCategory?.subcategories || categories.find((category) => String(category.id) === String(selectedCategory?.id))?.subcategories || []).map((subcategory) => (
                                <option key={subcategory.id} value={subcategory.id}>{subcategory.name} ({Number(subcategory.balance).toFixed(2)} available)</option>
                            ))}
                        </select>
                    </label>}
                    <label>
                        <span>Amount</span>
                        <input name="amount" type="number" min="0" step="0.01" placeholder="0.00" required />
                    </label>
                    <label>
                        <span>Description</span>
                        <input name="description" type="text" placeholder="e.g., Community supplies" required />
                    </label>
                    {isTreasurer && (
                        <label>
                            <span>Supporting document <small>(optional, PDF/JPG/PNG up to 5 MB)</small></span>
                            <input name="supporting_document" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" />
                        </label>
                    )}
                    <div className="expenditure-modal-actions">
                        <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? "Saving..." : "Confirm"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
