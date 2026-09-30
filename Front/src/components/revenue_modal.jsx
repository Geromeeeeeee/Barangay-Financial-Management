import { useState } from 'react'
import axios from 'axios'
import '../styles/revenue.css'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function Revenue_Modal ({setIsModalOpen}) {
    const [fundAllocation, setFundAllocation] = useState('General')
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const handleSubmit = async (event) => {
        event.preventDefault()
        setLoading(true)
        setErrorMessage('')

        // Gather form data natively using FormData
        const formData = new FormData(event.target);
        const amount = formData.get('amount');
        const source = formData.get('description'); // Maps to your database source column
        
        // Handle dropdown vs newly typed fund allocation logic
        let finalFundAllocation = formData.get('fundAllocation');
        if (finalFundAllocation === 'new') {
            finalFundAllocation = formData.get('newFundAllocation');
        } else if (finalFundAllocation === 'General') {
            finalFundAllocation = ''; // Or keep as 'General' depending on your preference
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
                setIsModalOpen(false); // Close modal on success
            } else {
                setErrorMessage("Failed to record revenue.");
            }
        } catch  {
            setErrorMessage("Server error. Please check your backend connection.");
        } finally {
            setLoading(false);
        }
    }

    return(
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="revenue-modal-title"
            className='revenue-modal-background'
            onClick={() => setIsModalOpen(false)}
        >
            <div className='revenue-modal' onClick={(event) => event.stopPropagation()}>
                <h2 id="revenue-modal-title">Record Revenue</h2>
                
                {errorMessage && <p style={{ color: 'red', fontSize: '0.9rem' }}>{errorMessage}</p>}

                <form onSubmit={handleSubmit}>
                    <label>
                        Amount
                        <input name="amount" type="number" min="0" step="0.01" required />
                    </label>
                    <label>
                        Source
                        <input name="description" type="text" required placeholder="e.g., Clearance Fee" />
                    </label>

                    <label>
                        Fund allocation
                        <select
                            name="fundAllocation"
                            value={fundAllocation}
                            onChange={(event) => setFundAllocation(event.target.value)}
                            className='drop-down'
                        >
                            <option value="General">General</option>
                            <option value="new">Create new fund allocation</option>
                        </select>
                    </label>

                    {fundAllocation === 'new' && (
                        <label>
                            New fund allocation
                            <input
                                name="newFundAllocation"
                                type="text"
                                placeholder="Enter allocation name"
                                autoFocus
                                required
                            />
                        </label>
                    )}
                    
                    <button type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save Revenue"}
                    </button>
                    <button type="button" onClick={() => setIsModalOpen(false)}>
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    )
}