import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/expenditure.css";
import useVerify from "../custom_hooks/use_verify";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";
const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost/Capstone/Back/";

export default function ReviewRecord ({ expenditure, revenue, onClose, onRefresh }) {
    const record = revenue || expenditure;
    const isRevenue = Boolean(revenue);
    
    const [files, setFiles] = useState([]);
    const [filesLoading, setFilesLoading] = useState(true);
    const [viewingFile, setViewingFile] = useState(null);

    const { updateStatus, loading } = useVerify(() => {
        onRefresh();
        onClose();
    }, isRevenue ? 'revenue' : 'expenditure');

    useEffect(() => {
        if (!record) return;
        
        const url = isRevenue 
            ? `${API_URL}revenue/get_attachments.php?revenue_id=${record.id}`
            : `${API_URL}expenditure/get_attachments.php?expenditure_id=${record.id}`;

        axios.get(url, { withCredentials: true })
            .then(res => {
                if (res.data.status === 'success') {
                    if (isRevenue) {
                        setFiles(res.data.data.map(file => ({
                            ...file,
                            view_url: `${API_URL}revenue/view_file.php?id=${file.id}`
                        })));
                    } else {
                        setFiles(res.data.data.map(file => ({
                            ...file,
                            view_url: file.legacy
                                ? `${BASE_URL}uploads/expenditures/view_attachment.php?id=${record.id}`
                                : `${BASE_URL}uploads/expenditures/view_attachment.php?attachment_id=${file.id}`
                        })));
                    }
                }
            })
            .catch(err => console.error("Failed to load attachments", err))
            .finally(() => setFilesLoading(false));
    }, [record, isRevenue]);

    if (!record) return null;

    return (
        <div className="review-modal-backdrop" onClick={onClose}>
            <div className="review-modal-card" onClick={(e) => e.stopPropagation()}>
                
                <div className="review-modal-header">
                    <div className="review-icon-wrapper">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                    <h2>Review Manual Override</h2>
                </div>

                <div className="review-modal-body">
                    <p className="review-warning-text">
                        This receipt failed OCR validation and requires admin review. Please verify the document and details below before approving.
                    </p>

                    <div className="review-data-box">
                        <div className="review-data-row">
                            <span className="review-data-label">{isRevenue ? 'Source' : 'Description'}</span>
                            <span className="review-data-value">{isRevenue ? record.source : record.description}</span>
                        </div>
                        <div className="review-data-row">
                            <span className="review-data-label">Amount</span>
                            <span className="review-data-value highlight">
                                ₱{Number(record.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="review-data-row">
                            <span className="review-data-label">{isRevenue ? 'Record type' : 'Fund Allocation'}</span>
                            <span className="review-data-value">
                                {isRevenue
                                    ? (record.record_type === 'monthly_receipt' ? 'Monthly receipt' : 'Annual budget')
                                    : (record.subcategory_name || record.category_name || record.fund_allocation || 'N/A')}
                            </span>
                        </div>
                    </div>

                    <div className="review-files-section">
                        <h3>Attached Document(s)</h3>
                        
                        {filesLoading && <p className="muted">Loading document...</p>}
                        
                        {!filesLoading && files.length === 0 && (
                            <p className="muted italic">No documents attached.</p>
                        )}

                        {!filesLoading && files.length > 0 && (
                            <ul className="review-file-list">
                                {files.map(file => (
                                    <li key={file.id} className="review-file-item">
                                        <div className="file-details">
                                            <span className="file-name">{file.file_name}</span>
                                            <span className="file-size">{(file.file_size / 1024).toFixed(1)} KB</span>
                                        </div>
                                        <button
                                            className="btn-view-file"
                                            onClick={() => setViewingFile(file)}
                                        >
                                            View
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="review-modal-actions">
                    <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
                        Cancel
                    </button>
                    <button type="button" className="btn-reject" onClick={() => updateStatus(record.id, 'rejected')} disabled={loading}>
                        {loading ? "Processing..." : "Reject"}
                    </button>
                    <button type="button" className="btn-approve" onClick={() => updateStatus(record.id, 'verified')} disabled={loading}>
                        {loading ? "Processing..." : "Verify & Approve"}
                    </button>
                </div>
            </div>

            {viewingFile && (
                <div className="review-file-preview-backdrop" onClick={(e) => { e.stopPropagation(); setViewingFile(null); }}>
                    <div className="review-file-preview-card" onClick={(e) => e.stopPropagation()}>
                        <div className="preview-header">
                            <h3>{viewingFile.file_name}</h3>
                            <button onClick={() => setViewingFile(null)}>Close</button>
                        </div>
                        <div className="preview-body">
                            {viewingFile.file_name.toLowerCase().endsWith('.pdf') ? (
                                <iframe src={viewingFile.view_url} title="Document PDF" />
                            ) : (
                                <img src={viewingFile.view_url} alt={viewingFile.file_name} />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}