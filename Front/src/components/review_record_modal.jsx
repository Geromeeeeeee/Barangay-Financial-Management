import "../styles/expenditure.css";
import useVerify from "../custom_hooks/use_verify";

export default function ReviewRecord ({ expenditure, revenue, onClose, onRefresh }) {
    const record = revenue || expenditure;
    const isRevenue = Boolean(revenue);
    const { updateStatus, loading } = useVerify(() => {
        onRefresh();
        onClose();
    }, isRevenue ? 'revenue' : 'expenditure');

    if (!record) return null;

    return (
        <div className="expenditure-modal-background" onClick={onClose}>
            <div className="expenditure-modal expenditure-form" onClick={(e) => e.stopPropagation()}>
                <h2>Review Manual Override</h2>
                <p style={{ color: '#d97706', fontSize: '0.9rem', marginBottom: '16px', fontWeight: '500' }}>
                    ⚠️ This receipt failed OCR validation and requires admin review.
                </p>

                <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '12px', borderRadius: '6px' }}>
                    <p style={{ marginBottom: '8px' }}><strong>{isRevenue ? 'Source' : 'Description'}:</strong> {isRevenue ? record.source : record.description}</p>
                    <p style={{ marginBottom: '8px' }}>
                        <strong>Amount:</strong> ₱{Number(record.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                    <p style={{ marginBottom: '0' }}>
                        <strong>{isRevenue ? 'Record type' : 'Fund Allocation'}:</strong> {isRevenue
                            ? (record.record_type === 'monthly_receipt' ? 'Monthly receipt' : 'Annual budget')
                            : (record.subcategory_name || record.category_name || record.fund_allocation || 'N/A')}
                    </p>
                </div>

                <div className="expenditure-modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button 
                        type="button" 
                        className="btn-cancel" 
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button 
                        type="button" 
                        style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                        onClick={() => updateStatus(record.id, 'rejected')}
                        disabled={loading}
                    >
                        {loading ? "Processing..." : "Reject"}
                    </button>
                    <button 
                        type="button" 
                        style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}
                        onClick={() => updateStatus(record.id, 'verified')}
                        disabled={loading}
                    >
                        {loading ? "Processing..." : "Verify & Approve"}
                    </button>
                </div>
            </div>
        </div>
    );
}