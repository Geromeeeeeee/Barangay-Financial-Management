import { useState } from 'react'
import axios from 'axios'
import '../styles/revenue.css'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function Revenue_Modal({ setIsModalOpen }) {
    const [fundAllocation, setFundAllocation] = useState('General')
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const handleSubmit = async (event) => {
        event.preventDefault()
        setLoading(true)
        setErrorMessage('')

        const formData = new FormData(event.target);
        const amount = formData.get('amount');
        const source = formData.get('description');

        let finalFundAllocation = formData.get('fundAllocation');
        if (finalFundAllocation === 'new') {
            finalFundAllocation = formData.get('newFundAllocation');
        } else if (finalFundAllocation === 'General') {
            finalFundAllocation = '';
        }

        try {
            const response = await axios.post(`${API_URL}/revenue/add_revenue.php`, {
                amount: parseFloat(amount),
                source: source,
                fund_allocation: finalFundAllocation
            }, {
                withCredentials: true
            });

            if (response?.data?.status === 'revenue_recorded') {
                setIsModalOpen(false);
            } else {
                setErrorMessage("Failed to record revenue.");
            }
        } catch {
            setErrorMessage("Server error. Please check your backend connection.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="revenue-modal-title"
            className="revenue-modal-background"
            onClick={() => setIsModalOpen(false)}
        >
            <div className="revenue-modal" onClick={(event) => event.stopPropagation()}>
                <h2 id="revenue-modal-title">Record Revenue</h2>

                {errorMessage && (
                    <div className="revenue-modal-error">{errorMessage}</div>
                )}

                <form onSubmit={handleSubmit} className="revenue-form">
                    <label>
                        <span>Amount</span>
                        <input
                            name="amount"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            required
                        />
                    </label>

                    <label>
                        <span>Source</span>
                        <input
                            name="description"
                            type="text"
                            placeholder="e.g., Clearance Fee"
                            required
                        />
                    </label>

                    <label>
                        <span>Fund allocation</span>
                        <select
                            name="fundAllocation"
                            value={fundAllocation}
                            onChange={(event) => setFundAllocation(event.target.value)}
                        >
                            <option value="General">General</option>
                            <option value="new">Create new fund allocation</option>
                        </select>
                    </label>

                    {fundAllocation === 'new' && (
                        <label>
                            <span>New fund allocation</span>
                            <input
                                name="newFundAllocation"
                                type="text"
                                placeholder="Enter allocation name"
                                autoFocus
                                required
                            />
                        </label>
                    )}

                    <div className="revenue-modal-actions">
                        <button
                            type="button"
                            className="btn-cancel"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-save"
                            disabled={loading}
                        >
                            {loading ? "Saving..." : "Save Revenue"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}