import { useEffect, useState } from 'react'
import axios from 'axios'
import '../styles/revenue.css'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function Revenue_Modal({ setIsModalOpen }) {
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [files, setFiles] = useState([])
    const [amount, setAmount] = useState('')
    const [particular, setParticular] = useState('NTA')
    const [customSource, setCustomSource] = useState('')
    const [recordType, setRecordType] = useState('annual_budget')
    const [categories, setCategories] = useState([])
    const [allocations, setAllocations] = useState([])

    const handleFileChange = (e) => {
        setFiles(Array.from(e.target.files))
    }

    const removeFile = (indexToRemove) => {
        setFiles(files.filter((_, index) => index !== indexToRemove))
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

        try {
            const response = await axios.post(`${API_URL}revenue/add_revenue.php`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });

            if (response?.data?.status === 'revenue_recorded') {
                setIsModalOpen(false);
            } else {
                setErrorMessage("Failed to record revenue.");
            }
        } catch (err) {
            setErrorMessage(err.response?.data?.message || "Server error. Please check your backend connection.");
        } finally {
            setLoading(false);
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
                            <input name="receipt_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
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
                                placeholder="e.g., Clearance Fee"
                                required
                            />
                        </label>
                    )}
                    <label>
                        <span>Amount</span>
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
                    </label>

                    <label>
                        <span>{recordType === 'monthly_receipt' ? 'Receipt / Proof of Fund Release (required)' : 'Supporting Documents (Select multiple)'}</span>
                        <input 
                            type="file" 
                            name="attachments[]" 
                            multiple 
                            onChange={handleFileChange}
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            style={{ padding: '8px', background: '#f8fafc', border: '1.5px dashed #cbd5e1', cursor: 'pointer' }}
                        />
                        
                        {files.length > 0 && (
                            <div style={{ marginTop: '8px', background: '#f0fdf4', padding: '8px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                                <small style={{ color: '#15803d', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                                    {files.length} file(s) ready to upload:
                                </small>
                                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                                    {files.map((file, index) => (
                                        <li key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#166534', padding: '2px 0' }}>
                                            <span>{file.name}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => removeFile(index)}
                                                style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: 0 }}
                                            >
                                                Remove
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </label>

                    {recordType === 'monthly_receipt' && (
                        <div className="revenue-allocation-section">
                            <div className="revenue-allocation-header">
                                <span>Distribute received funds to budget items (optional)</span>
                                <button type="button" className="btn-save" onClick={addAllocation}>+ Add budget item</button>
                            </div>
                            {allocations.map((allocation, index) => (
                                <div className="revenue-allocation-row" key={index}>
                                    <select
                                        value={allocation.item_type}
                                        onChange={(event) => updateAllocation(index, 'item_type', event.target.value)}
                                    >
                                        <option value="existing">Existing budget item</option>
                                        <option value="new">Create new budget item</option>
                                    </select>
                                    {allocation.item_type === 'existing' ? (
                                        <select value={allocation.subcategory_id} onChange={(event) => updateAllocation(index, 'subcategory_id', event.target.value)} required>
                                            <option value="">Select budget item</option>
                                            {budgetItems.map((item) => (
                                                <option key={item.id} value={item.id}>{item.category_name} — {item.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <>
                                            <select value={allocation.category_id} onChange={(event) => updateAllocation(index, 'category_id', event.target.value)} required>
                                                <option value="">Select parent category</option>
                                                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                                            </select>
                                            <input type="text" value={allocation.name} onChange={(event) => updateAllocation(index, 'name', event.target.value)} placeholder="New budget item name" required />
                                        </>
                                    )}
                                    <input type="number" min="0.01" step="0.01" value={allocation.amount} onChange={(event) => updateAllocation(index, 'amount', event.target.value)} placeholder="Amount" required />
                                    <button type="button" onClick={() => removeAllocation(index)}>Remove</button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="revenue-modal-actions">
                        <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? "Saving..." : "Save Revenue"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}