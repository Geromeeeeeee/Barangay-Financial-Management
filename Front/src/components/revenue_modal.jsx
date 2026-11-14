import { useEffect, useState } from 'react'
import axios from 'axios'
import { UploadCloud, FileText, X, ScanLine } from 'lucide-react'
import { useToast } from '../context/toast_context'
import { useRole } from '../custom_hooks/use_role'
import { scanReceiptImage } from '../custom_hooks/use_Scanner'
import '../styles/revenue.css'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function Revenue_Modal({ setIsModalOpen, unreleasedAnnualBudget = null }) {
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const today = new Date().toISOString().slice(0, 10);
    
    // Receipt File & Supporting Files
    const [receiptFile, setReceiptFile] = useState(null)
    const [supportingFiles, setSupportingFiles] = useState([])
    
    // Form Inputs
    const [amount, setAmount] = useState('')
    const [particular, setParticular] = useState('NTA')
    const [customSource, setCustomSource] = useState('')
    const [recordType, setRecordType] = useState('annual_budget')
    const [categories, setCategories] = useState([])
    const [allocations, setAllocations] = useState([])

    // OCR State
    const [isScanning, setIsScanning] = useState(false)
    const [ocrStatus, setOcrStatus] = useState('idle') 
    const [detectedAmount, setDetectedAmount] = useState(null)
    const [isOverridden, setIsOverridden] = useState(false)

    // Drag-and-Drop States
    const [isDraggingReceipt, setIsDraggingReceipt] = useState(false)
    const [isDraggingDocs, setIsDraggingDocs] = useState(false)

    const { showToast } = useToast()
    const { isSK } = useRole()
    const monthlyReceiptExceedsBudget = recordType === 'monthly_receipt'
        && unreleasedAnnualBudget !== null
        && Number(amount) > Number(unreleasedAnnualBudget) + 0.005

    const handleReceiptChange = async (file) => {
        setReceiptFile(file)
        setOcrStatus('idle')
        setIsOverridden(false)

        if (!file) return
        const enteredAmount = parseFloat(amount)

        if (enteredAmount && file.type.startsWith('image/')) {
            try {
                setIsScanning(true)
                const { extractedNumbers, likelyTotal } = await scanReceiptImage(file)

                if ((!extractedNumbers || extractedNumbers.length === 0) && likelyTotal === null) {
                    setOcrStatus('unreadable')
                    setDetectedAmount(null)
                } else {
                    const matchFound = (likelyTotal === enteredAmount) || extractedNumbers.includes(enteredAmount)

                    if (matchFound) {
                        setOcrStatus('matched')
                        setDetectedAmount(enteredAmount)
                    } else {
                        setOcrStatus('mismatch')
                        const fallbackAmount = likelyTotal !== null 
                            ? likelyTotal 
                            : (extractedNumbers.length > 0 ? Math.max(...extractedNumbers.filter(n => n < 1000000)) : null)
                        setDetectedAmount(fallbackAmount)
                    }
                }
            } catch (error) {
                console.error("OCR Error:", error)
                setOcrStatus('unreadable')
            } finally {
                setIsScanning(false)
            }
        }
    }

    const handleRecordTypeChange = (event) => {
        const nextRecordType = event.target.value
        setRecordType(nextRecordType)
        if (nextRecordType !== 'monthly_receipt') setAllocations([])
    }

    useEffect(() => {
        if (recordType !== 'monthly_receipt') {
            return
        }
        const timer = window.setTimeout(() => {
            axios.get(`${API_URL}budget/categories.php`, { withCredentials: true })
                .then((response) => setCategories(response.data.data || []))
                .catch(() => setErrorMessage('Unable to load budget items for this receipt.'))
        }, 0)
        return () => window.clearTimeout(timer)
    }, [recordType])

    const budgetItems = categories.filter((category) => category.subcategories?.some((subcategory) => subcategory.is_active !== false)).flatMap((category) => (
        (category.subcategories || []).map((subcategory) => ({
            ...subcategory,
            category_name: category.name,
        })).filter((subcategory) => subcategory.is_active !== false)
    ))

    const addAllocation = () => {
        setAllocations([...allocations, { item_type: 'existing', subcategory_id: '', category_id: '', name: '', amount: '' }])
    }

    const updateAllocation = (index, field, value) => {
        setAllocations(allocations.map((allocation, allocationIndex) => (
            allocationIndex === index ? { ...allocation, [field]: value } : allocation
        )))
    }

    const removeAllocation = (index) => {
        setAllocations(allocations.filter((_, allocationIndex) => allocationIndex !== index))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setLoading(true)
        setErrorMessage('')

        const formData = new FormData(event.target)
        formData.set('record_type', recordType)
        if (recordType === 'monthly_receipt') {
            formData.set('allocations', JSON.stringify(allocations))
        }

        // Clean out default attachments[] input and manually append files
        formData.delete('attachments[]')
        if (receiptFile) {
            formData.append('attachments[]', receiptFile)
        }
        supportingFiles.forEach((file) => formData.append('attachments[]', file))

        formData.append('ocr_overridden', isOverridden ? 1 : 0)

        try {
            if (monthlyReceiptExceedsBudget) {
                throw new Error('The monthly receipt exceeds the unreleased annual budget.')
            }
            if ((ocrStatus === 'mismatch' || ocrStatus === 'unreadable') && !isOverridden) {
                throw new Error("Please resolve the receipt OCR mismatch warning or check 'Override OCR' to submit.")
            }

            const response = await axios.post(`${API_URL}revenue/add_revenue.php`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            })

            if (response?.data?.status === 'revenue_recorded') {
                showToast("Revenue recorded successfully!", "success")
                setIsModalOpen(false)
            } else {
                setErrorMessage("Failed to record revenue.")
                showToast("Failed to record revenue.", "error")
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Server error. Please check your backend connection."
            setErrorMessage(msg)
            showToast(msg, "error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            role="dialog"
            aria-modal="true"
            className="revenue-modal-background"
            onClick={() => setIsModalOpen(false)}
        >
            <div className="revenue-modal" onClick={(event) => event.stopPropagation()}>
                <h2>Record Revenue</h2>
                
                {errorMessage && <div className="revenue-modal-error">{errorMessage}</div>}

                <form onSubmit={handleSubmit} className="revenue-form">
                    <label>
                        <span>Record type</span>
                        <select value={recordType} onChange={handleRecordTypeChange}>
                            <option value="monthly_receipt">Monthly fund receipt</option>
                            <option value="annual_budget">Annual approved budget</option>
                        </select>
                    </label>

                    {recordType === 'monthly_receipt' && (
                        <label>
                            <span>Actual receipt date</span>
                            <input 
                            name="receipt_date" 
                            type="date" 
                            defaultValue={today} 
                            max={today} 
                            required 
                        />
                        </label>
                    )}

                    {recordType === 'annual_budget' && (
                        <label>
                            <span>Particular/Source</span>
                            <select
                                name="particular"
                                value={particular}
                                onChange={(event) => setParticular(event.target.value)}
                            >
                                <option value="NTA">NTA</option>
                                <option value="Local Income">Local Income</option>
                                <option value="Others">Others</option>
                            </select>
                        </label>
                    )}

                    {recordType === 'monthly_receipt' ? (
                        <label>
                            <span>Description/source</span>
                            <input name="source" type="text" placeholder="e.g., January fund release" required />
                        </label>
                    ) : particular === 'Others' && (
                        <label>
                            <span>Specific Revenue Particular/Source</span>
                            <input
                                name="source"
                                type="text"
                                value={customSource}
                                onChange={(event) => setCustomSource(event.target.value)}
                                placeholder="e.g., Service Fee"
                                required
                            />
                        </label>
                    )}

                    <label>
                        <span>Amount (₱)</span>
                        <input
                            name="amount"
                            type="number"
                            min="0"
                            step="0.01"
                            value={amount}
                            onChange={(event) => setAmount(event.target.value)}
                            placeholder="0.00"
                            required
                        />
                        {recordType === 'monthly_receipt' && unreleasedAnnualBudget !== null && (
                            <small className={monthlyReceiptExceedsBudget ? 'revenue-modal-error' : 'muted'}>
                                Unreleased annual budget: ₱{Number(unreleasedAnnualBudget).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </small>
                        )}
                        {monthlyReceiptExceedsBudget && (
                            <small className="revenue-modal-error">
                                The receipt amount cannot exceed the unreleased annual budget.
                            </small>
                        )}
                    </label>

                    {/* Official Receipt Dropzone + OCR Scanning */}
                    <div className="form-group">
                        <span>{recordType === 'monthly_receipt' ? 'Receipt / Proof of Fund Release' : 'Primary Receipt / Voucher'} <small>(Required for OCR)</small></span>
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
                                <label htmlFor="revenue-receipt-upload" className="drop-zone-label">
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
                                accept=".jpg,.jpeg,.png,.pdf"
                                onChange={(e) => handleReceiptChange(e.target.files[0] || null)}
                                className="file-input-hidden"
                                id="revenue-receipt-upload"
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

                    {/* Optional Supporting Documents Upload */}
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
                            <label htmlFor="revenue-docs-upload" className="drop-zone-label">
                                <div className="drop-prompt">
                                    <UploadCloud className="drop-icon" size={24} />
                                    <p>Drag & drop additional documents here or <strong>browse</strong></p>
                                </div>
                            </label>

                            <input 
                                type="file" 
                                multiple
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={(e) => setSupportingFiles(Array.from(e.target.files))}
                                className="file-input-hidden"
                                id="revenue-docs-upload"
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

                    {/* Budget Item Allocation Section for Monthly Receipts */}
                    {recordType === 'monthly_receipt' && (
                        <div className="revenue-allocation-section">
                            <div className="revenue-allocation-header">
                                <h4>Distribute received funds to budget items (optional)</h4>
                                <button type="button" className="btn-add-allocation" onClick={addAllocation}>
                                    + Add budget item
                                </button>
                            </div>
                            
                            {allocations.map((allocation, index) => (
                                <div className="allocation-item" key={index}>
                                    <label>
                                        <span>Item type</span>
                                        <select
                                            value={allocation.item_type}
                                            onChange={(event) => updateAllocation(index, 'item_type', event.target.value)}
                                        >
                                            <option value="existing">Existing budget item</option>
                                            <option value="new">Create new budget item</option>
                                        </select>
                                    </label>
                                    
                                    {allocation.item_type === 'existing' ? (
                                        <label>
                                            <span>Select budget item</span>
                                            <select value={allocation.subcategory_id} onChange={(event) => updateAllocation(index, 'subcategory_id', event.target.value)} required>
                                                <option value="">Select budget item</option>
                                                {budgetItems
                                                    .filter(item => !isSK || item.category_name === "SK")
                                                    .map((item) => (
                                                    <option key={item.id} value={item.id}>{item.category_name} — {item.name}</option>
                                                ))}
                                            </select>
                                        </label>
                                    ) : (
                                        <>
                                            {!isSK && (
                                                <label>
                                                    <span>Parent category</span>
                                                    <select value={allocation.category_id} onChange={(event) => updateAllocation(index, 'category_id', event.target.value)} required>
                                                        <option value="">Select parent category</option>
                                                        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                                                    </select>
                                                </label>
                                            )}
                                            {isSK && (
                                                <input 
                                                    type="hidden" 
                                                    value={categories.find(c => c.name === "SK")?.id || ""} 
                                                    onChange={() => {}} 
                                                />
                                            )}
                                            <label>
                                                <span>New item name</span>
                                                <input type="text" value={allocation.name} onChange={(event) => updateAllocation(index, 'name', event.target.value)} placeholder="New budget item name" required />
                                            </label>
                                        </>
                                    )}
                                    
                                    <label>
                                        <span>Amount</span>
                                        <input type="number" min="0.01" step="0.01" value={allocation.amount} onChange={(event) => updateAllocation(index, 'amount', event.target.value)} placeholder="Amount" required />
                                    </label>
                                    
                                    <button type="button" className="btn-remove-allocation" onClick={() => removeAllocation(index)}>
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="revenue-modal-actions">
                        <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="btn-save" 
                            disabled={
                                loading || 
                                isScanning || 
                                monthlyReceiptExceedsBudget ||
                                (ocrStatus === 'mismatch' && !isOverridden) || 
                                (ocrStatus === 'unreadable' && !isOverridden)
                            }
                        >
                            {loading ? "Saving..." : "Save Revenue"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}