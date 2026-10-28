import { useState } from 'react'
import axios from 'axios'
import '../styles/revenue.css'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function Revenue_Modal({ setIsModalOpen }) {
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [files, setFiles] = useState([])
    const [nta, setNta] = useState('')
    const [localIncome, setLocalIncome] = useState('')

    const handleFileChange = (e) => {
        setFiles(Array.from(e.target.files))
    }

    const removeFile = (indexToRemove) => {
        setFiles(files.filter((_, index) => index !== indexToRemove))
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setLoading(true)
        setErrorMessage('')

        const formData = new FormData(event.target)

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
                        <span>National Tax Allotment (NTA)</span>
                        <input
                            name="nta"
                            type="number"
                            min="0"
                            step="0.01"
                            value={nta}
                            onChange={(event) => setNta(event.target.value)}
                            placeholder="0.00"
                            required
                        />
                    </label>
                    <label>
                        <span>Local Income</span>
                        <input
                            name="local_income"
                            type="number"
                            min="0"
                            step="0.01"
                            value={localIncome}
                            onChange={(event) => setLocalIncome(event.target.value)}
                            placeholder="0.00"
                            required
                        />
                    </label>
                    <div className="revenue-total">
                        <span>Total Annual Income</span>
                        <strong>
                            ₱{(Number(nta || 0) + Number(localIncome || 0)).toLocaleString('en-PH', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </strong>
                    </div>
                    <label>
                        <span>Source</span>
                        <input name="source" type="text" placeholder="e.g., Clearance Fee" required />
                    </label>

                    <label>
                        <span>Supporting Documents (Select multiple)</span>
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