import '../styles/revenue.css'
import '../styles/typography.css'
import '../styles/status.css'

export default function BalanceModal({ onClose, category, formatPeso }) {
    if (!category) return null;

    const allocated = Number(category.allocated_amount || 0);
    const spent = Number(category.spent_amount || 0);
    const deficit = Number(category.balance || 0);

    return(
        <div onClick={onClose} className="revenue-modal-background">
            {/* Added () to event.stopPropagation() */}
            <div className="revenue-modal" onClick={(event) => event.stopPropagation()}>
                <p className='semi-bold error'> ! Budget Deficit Notice: {category.name}</p>
                <p className='normal'>
                    Negative balances happen when an allocated fund doesn't cover project expenses due to unexpected changes in cost or emergency disbursements.
                </p>
                
                <div style={{ margin: '12px 0' }}>
                    <p className='semi-bold'>Allocated Fund: {formatPeso ? formatPeso(allocated) : `₱${allocated.toLocaleString()}`}</p>
                    <p className='semi-bold'>Total Spent: {formatPeso ? formatPeso(spent) : `₱${spent.toLocaleString()}`}</p>
                    <p className='semi-bold error'>Deficit: {formatPeso ? formatPeso(deficit) : `₱${deficit.toLocaleString()}`}</p>
                </div>

                <p className='normal'>
                    In such situations, money from previous monthly receipts can be utilized to cover the deficit.
                </p>

                <div className="revenue-modal-actions" style={{ marginTop: '20px' }}>
                    <button type="button" className="btn-cancel" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}