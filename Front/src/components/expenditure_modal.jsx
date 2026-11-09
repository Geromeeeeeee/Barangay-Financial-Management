import { useState, useEffect } from "react";
import { UploadCloud, FileText, X, ScanLine } from "lucide-react";
import "../styles/expenditure.css";
import { useRole } from "../custom_hooks/use_role";
import useSubmitExpenditure from "../custom_hooks/use_submitExpenditure";
import { scanReceiptImage } from '../custom_hooks/use_Scanner';
import { useToast } from "../context/toast_context";

export default function ExpenditureModal({ setIsModalOpen, monthlyAllocations = [] }) {
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [receiptFile, setReceiptFile] = useState(null);
    const [supportingFiles, setSupportingFiles] = useState([]);
    const [amount, setAmount] = useState(""); 
    const [isScanning, setIsScanning] = useState(false);
    const [ocrStatus, setOcrStatus] = useState('idle'); 
    const [detectedAmount, setDetectedAmount] = useState(null);
    const [isOverridden, setIsOverridden] = useState(false);

    const [isDraggingReceipt, setIsDraggingReceipt] = useState(false);
    const [isDraggingDocs, setIsDraggingDocs] = useState(false);

    const { isTreasurer } = useRole();
    const { showToast } = useToast();

    const { handleSubmit } = useSubmitExpenditure({
        setLoading,
        setErrorMessage,
        receiptFile,
        supportingFiles,
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

    const handleReceiptChange = async (file) => {
        setReceiptFile(file);
        setOcrStatus('idle');
        setIsOverridden(false);

        if (!file) return;
        const enteredAmount = parseFloat(amount);

        if (enteredAmount && file.type.startsWith('image/')) {
            try {
                setIsScanning(true);
                const { extractedNumbers } = await scanReceiptImage(file);

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
                        const reasonableNumbers = extractedNumbers.filter(n => n < 1000000);
                        const closestNumber = reasonableNumbers.length > 0 
                            ? reasonableNumbers.reduce((prev, curr) => 
                                Math.abs(curr - enteredAmount) < Math.abs(prev - enteredAmount) ? curr : prev
                              )
                            : Math.max(...extractedNumbers);
                        setDetectedAmount(closestNumber);
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

    return (
        <div
            role="dialog"
            aria-modal="true"
            className="expenditure-modal-background"
            onClick={() => setIsModalOpen(false)}
        >
            <div className="expenditure-modal" onClick={(event) => event.stopPropagation()}>
                <h2>Record Expenditure</h2>
                
                {monthlyAllocations.length === 0 && (
                    <div className="expenditure-modal-error">No available monthly allocations exist for this budget item.</div>
                )}
                {errorMessage && <div className="expenditure-modal-error">{errorMessage}</div>}

                <form onSubmit={handleSubmit} className="expenditure-form">
                    <label>
                        <span>Monthly allocation</span>
                        <select name="monthly_allocation_id" defaultValue="" required>
                            <option value="">Select a monthly allocation</option>
                            {availableAllocations.map((allocation) => (
                                <option key={allocation.id} value={allocation.id}>
                                    {allocation.category_name} / {allocation.subcategory_name} — {allocation.allocation_date}
                                </option>
                            ))}
                        </select>
                    </label>
                    
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

                    <div className="form-group">
                        <span>Official Receipt <small>(Required for OCR)</small></span>
                        <div 
                            className={`drop-zone ${isDraggingReceipt ? 'dragging' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); setIsDraggingReceipt(true); }}
                            onDragLeave={() => setIsDraggingReceipt(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setIsDraggingReceipt(false);
                                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                    handleReceiptChange(e.dataTransfer.files[0]);
                                }
                            }}
                        >
                            {!receiptFile && (
                                <label htmlFor="receipt-upload" className="drop-zone-label">
                                    <div className="drop-prompt">
                                        <UploadCloud className="drop-icon" size={24} />
                                        <p>Drag & drop receipt here or <strong>browse</strong></p>
                                    </div>
                                </label>
                            )}
                            
                            {receiptFile && (
                                <div className="file-preview">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FileText size={16} color="#64748b" />
                                        <span>{receiptFile.name}</span>
                                    </div>
                                    <button type="button" onClick={(e) => { e.preventDefault(); setReceiptFile(null); }}>
                                        <X size={14} />
                                    </button>
                                </div>
                            )}

                            <input 
                                type="file" 
                                accept=".jpg,.jpeg,.png,application/pdf"
                                onChange={(e) => handleReceiptChange(e.target.files[0] || null)}
                                className="file-input-hidden"
                                id="receipt-upload"
                            />
                        </div>

                        {isScanning && (
                            <div className="ocr-scanning-text">
                                <ScanLine size={16} /> Scanning receipt using Tesseract OCR...
                            </div>
                        )}

                        {!isScanning && ocrStatus === 'matched' && (
                            <div className="ocr-warning-box matched">Amount Verified</div>
                        )}

                        {!isScanning && ocrStatus === 'mismatch' && (
                            <div className="ocr-warning-box mismatch">
                                <strong>Warning: Receipt shows ₱{detectedAmount?.toLocaleString()}, but input is ₱{Number(amount).toLocaleString()}.</strong>
                                <label className="ocr-override-label">
                                    <input type="checkbox" checked={isOverridden} onChange={(e) => setIsOverridden(e.target.checked)} />
                                    Proceed with manual override
                                </label>
                            </div>
                        )}

                        {!isScanning && ocrStatus === 'unreadable' && (
                            <div className="ocr-warning-box unreadable">
                                <strong>Could not automatically read print on document.</strong>
                                <label className="ocr-override-label">
                                    <input type="checkbox" checked={isOverridden} onChange={(e) => setIsOverridden(e.target.checked)} />
                                    Proceed with manual verification
                                </label>
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <span>Supporting Documents <small>(Optional)</small></span>
                        <div 
                            className={`drop-zone ${isDraggingDocs ? 'dragging' : ''}`}
                            onDragOver={(e) => { e.preventDefault(); setIsDraggingDocs(true); }}
                            onDragLeave={() => setIsDraggingDocs(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setIsDraggingDocs(false);
                                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                    setSupportingFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
                                }
                            }}
                        >
                            <label htmlFor="docs-upload" className="drop-zone-label">
                                <div className="drop-prompt">
                                    <UploadCloud className="drop-icon" size={24} />
                                    <p>Drag & drop documents here or <strong>browse</strong></p>
                                </div>
                            </label>

                            <input 
                                type="file" 
                                multiple
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={(e) => setSupportingFiles(Array.from(e.target.files))}
                                className="file-input-hidden"
                                id="docs-upload"
                            />

                            {supportingFiles.length > 0 && (
                                <ul className="selected-files-list">
                                    {supportingFiles.map((file, index) => (
                                        <li key={`${file.name}-${index}`}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <FileText size={14} color="#64748b" />
                                                <span>{file.name}</span>
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={(e) => { 
                                                    e.preventDefault(); 
                                                    setSupportingFiles((prev) => prev.filter((_, i) => i !== index)); 
                                                }}
                                            >
                                                <X size={12} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="expenditure-modal-actions">
                        <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        <button 
                            type="submit" 
                            className="btn-save" 
                            disabled={
                                loading || 
                                availableAllocations.length === 0 || 
                                isScanning || 
                                !receiptFile ||
                                (ocrStatus === 'mismatch' && !isOverridden) || 
                                (ocrStatus === 'unreadable' && !isOverridden)
                            }
                        >
                            {loading ? "Saving..." : "Confirm"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}