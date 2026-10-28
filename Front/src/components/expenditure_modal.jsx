import { useState } from "react";
import "../styles/expenditure.css";
import { useRole } from "../custom_hooks/use_role";
import useSubmitExpenditure from "../custom_hooks/use_submitExpenditure";

export default function ExpenditureModal({ setIsModalOpen, categories = [], selectedCategory = null }) {
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("")
    const [files, setFiles] = useState([])
    const {isTreasurer} = useRole();
    const {handleSubmit} = useSubmitExpenditure({setLoading, setErrorMessage, selectedCategory, selectedFiles: files, setSuccessMessage});

    const handleFileChange = (event) => {
        setFiles(Array.from(event.target.files || []))
    }

    const removeFile = (indexToRemove) => {
        setFiles((currentFiles) => currentFiles.filter((_, index) => index !== indexToRemove))
    }

    if(successMessage){
        return(
            <div className="expenditure-modal-background" onClick={()=> setIsModalOpen(false)}>
                <div className="expenditure-modal" onClick={(event) => event.stopPropagation()}>
                    {successMessage && (<div className="expenditure-modal-success">{successMessage}</div>)}
                </div>
            </div>
        )
    }
    
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
                    Record Expenditure
                </h2>
                {errorMessage && <div className="expenditure-modal-error">{errorMessage}</div>}
                {successMessage && <div className="expenditure-modal-error">{successMessage}</div>}

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
                            <span>Supporting documents <small>(optional, up to 5 files, PDF/JPG/PNG up to 5 MB each)</small></span>
                            <input
                                name="supporting_documents[]"
                                type="file"
                                multiple
                                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                onChange={handleFileChange}
                            />
                            {files.length > 0 && (
                                <ul className="expenditure-selected-files">
                                    {files.map((file, index) => (
                                        <li key={`${file.name}-${index}`}>
                                            <span>{file.name}</span>
                                            <button type="button" onClick={() => removeFile(index)}>Remove</button>
                                        </li>
                                    ))}
                                </ul>
                            )}
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
