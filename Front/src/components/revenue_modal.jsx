import { useState } from 'react'
import axios from 'axios'
import { useRole } from '../custom_hooks/use_role'
import '../styles/revenue.css'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function Revenue_Modal({ setIsModalOpen }) {
    const [requestKey] = useState(() => crypto.randomUUID());
    const [fundAllocation, setFundAllocation] = useState('General')
    const [nta, setNta] = useState('')
    const [localIncome, setLocalIncome] = useState('')
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const { isTreasurer } = useRole()
    const totalAnnualIncome = (Number(nta) || 0) + (Number(localIncome) || 0)

    const handleSubmit = async (event) => {
        event.preventDefault()
        setLoading(true)
        setErrorMessage('')

        const formData = new FormData(event.target);
        const source = formData.get('description');

        let finalFundAllocation = formData.get('fundAllocation');
        if (finalFundAllocation === 'new') {
            finalFundAllocation = formData.get('newFundAllocation');
        } else if (finalFundAllocation === 'General') {
            finalFundAllocation = '';
        }
        formData.set('amount', totalAnnualIncome.toFixed(2));
        formData.set('source', source);
        formData.set('fund_allocation', finalFundAllocation || '');
        formData.set('request_key', requestKey);

        try {
            const response = await axios.post(`${API_URL}revenue/add_revenue.php`, formData, {
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
                        <span>NTA (National Tax Allotment)</span>
                        <input
                            name="nta"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            required
                            value={nta}
                            onChange={(event) => setNta(event.target.value)}
                        />
                    </label>

                    <label>
                        <span>Local Income</span>
                        <input
                            name="local_income"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            required
                            value={localIncome}
                            onChange={(event) => setLocalIncome(event.target.value)}
                        />
                    </label>

                    <label>
                        <span>Total Annual Income</span>
                        <input
                            type="number"
                            value={totalAnnualIncome.toFixed(2)}
                            readOnly
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

                    {isTreasurer && (
                        <label>
                            <span>Supporting document <small>(required, PDF/JPG/PNG up to 5 MB)</small></span>
                            <input name="supporting_document" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" required />
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