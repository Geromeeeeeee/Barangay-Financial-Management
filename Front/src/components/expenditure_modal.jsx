import { useState, useEffect } from "react";
import "../styles/expenditure.css";
import { useRole } from "../custom_hooks/use_role";
import useSubmitExpenditure from "../custom_hooks/use_submitExpenditure";
import { scanReceiptImage } from '../custom_hooks/use_Scanner';
import { useToast } from "../context/toast_context";

export default function ExpenditureModal({ setIsModalOpen, monthlyAllocations = [] }) {
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [files, setFiles] = useState([]);
    const [amount, setAmount] = useState(""); /

    const [isScanning, setIsScanning] = useState(false);
    const [ocrStatus, setOcrStatus] = useState('idle'); 

    const [detectedAmount, setDetectedAmount] = useState(null);
    const [isOverridden, setIsOverridden] = useState(false);

    const { isTreasurer } = useRole();
    const { showToast } = useToast();

    const { handleSubmit } = useSubmitExpenditure({
        setLoading,
        setErrorMessage,
        selectedFiles: files,
        setSuccessMessage,
        ocrStatus,
        isOverridden,
    });

    const availableAllocations = monthlyAllocations.filter((allocation) => (
        allocation.is_active !== false && Number(allocation.remaining_amount) > 0
    ));

    useEffect(() => {
        if (successMessage) {
            showToast(successMessage, "success");
            setIsModalOpen(false);
        }
    }, [successMessage, setIsModalOpen, showToast]);

    const handleFileChange = async (event) => {
        const selectedList = Array.from(event.target.files || []);
        setFiles(selectedList);
        setOcrStatus('idle');
        setIsOverridden(false);

        if (selectedList.length === 0) return;

        const enteredAmount = parseFloat(amount);
        const firstFile = selectedList[0];

        if (enteredAmount && firstFile && firstFile.type.startsWith('image/')) {
            try {
                setIsScanning(true);
                const { extractedNumbers } = await scanReceiptImage(firstFile);

                if (extractedNumbers.length === 0) {
                    setOcrStatus('unreadable');
                    setDetectedAmount(null);
                } else {
                    const matchFound = extractedNumbers.includes(enteredAmount);
                    if (matchFound) {
                        setOcrStatus('matched');
                        setDetectedAmount(enteredAmount);
                    } else {
                        setOcrStatus('mismatch');
                        const maxDetected = Math.max(...extractedNumbers);
                        setDetectedAmount(maxDetected);
                    }
                }
            } catch (error) {
                console.error("OCR Error:", error);
                setOcrStatus('unreadable');
            } finally {
                setIsScanning(false);
            }
        }
    };

    const removeFile = (indexToRemove) => {
        setFiles((currentFiles) => {
            const updated = currentFiles.filter((_, index) => index !== indexToRemove);
            if (updated.length === 0) setOcrStatus('idle');
            return updated;
        });
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
                <h2 id="expenditure-modal-title">
                    Record Expenditure
                </h2>
                {monthlyAllocations.length === 0 && (
                    <div className="expenditure-modal-error">No available monthly allocations exist for this budget item.</div>
                )}
                {errorMessage && <div className="expenditure-modal-error">{errorMessage}</div>}

                <form onSubmit={handleSubmit} className="expenditure-form">
                    {isTreasurer && (
                        <label>
                            <span>Monthly allocation</span>
                            <select name="monthly_allocation_id" defaultValue="" required>
                                <option value="">Select a monthly allocation</option>
                                {availableAllocations.map((allocation) => (
                                    <option key={allocation.id} value={allocation.id}>
                                        {allocation.category_name} / {allocation.subcategory_name} — {allocation.allocation_date} — ₱{Number(allocation.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })} allocated, ₱{Number(allocation.expenditure_amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })} spent, ₱{Number(allocation.remaining_amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })} remaining
                                    </option>
                                ))}
                            </select>
                            <small>Select the monthly allocation that funds this expenditure. Its category and budget item are applied automatically.</small>
                        </label>
                    )}
                    <label>
                        <span>Amount</span>
                        <input 
                            name="amount" 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            placeholder="0.00" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required 
                        />
                    </label>
                    <label>
                        <span>Description</span>
                        <input name="description" type="text" placeholder="e.g., Community supplies" required />
                    </label>
                    {isTreasurer && (
                        <label>
                            <span>Supporting documents <small>(PDF/JPG/PNG up to 5 MB each)</small></span>
                            <input
                                name="supporting_documents[]"
                                type="file"
                                multiple
                                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                                onChange={handleFileChange}
                            />
                            
                            {isScanning && (
                                <div style={{ color: '#2563eb', fontSize: '0.85rem', marginTop: '6px' }}>
                                    🌀 Scanning receipt using Tesseract OCR...
                                </div>
                            )}

                            {!isScanning && ocrStatus === 'matched' && (
                                <div style={{ color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px', borderRadius: '4px', fontSize: '0.85rem', marginTop: '6px' }}>
                                    ✓ Amount Verified
                                </div>
                            )}

                            {!isScanning && ocrStatus === 'mismatch' && (
                                <div style={{ color: '#854d0e', background: '#fefce8', border: '1px solid #fef08a', padding: '10px', borderRadius: '4px', fontSize: '0.85rem', marginTop: '6px' }}>
                                    <strong>⚠️ Warning: Receipt doesn't match the input number.</strong>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', cursor: 'pointer', fontWeight: '600' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={isOverridden}
                                            onChange={(e) => setIsOverridden(e.target.checked)}
                                        />
                                        Proceed with manual override
                                    </label>
                                </div>
                            )}

                            {!isScanning && ocrStatus === 'unreadable' && (
                                <div style={{ color: '#374151', background: '#f9fafb', border: '1px solid #e5e7eb', padding: '8px', borderRadius: '4px', fontSize: '0.85rem', marginTop: '6px' }}>
                                    ℹ️ <strong>Could not automatically read print on document.</strong>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', cursor: 'pointer', fontWeight: '600' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={isOverridden}
                                            onChange={(e) => setIsOverridden(e.target.checked)}
                                        />
                                        Proceed with manual verification
                                    </label>
                                </div>
                            )}

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
                        <button type="submit" className="btn-save" disabled={loading || availableAllocations.length === 0 || isScanning}>
                            {loading ? "Saving..." : "Confirm"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}