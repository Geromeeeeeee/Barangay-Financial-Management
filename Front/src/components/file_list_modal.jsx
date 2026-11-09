import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/revenue.css"; 

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";
const BASE_URL = "http://localhost/Capstone/Back/endpoints/";

export default function FileListModal({ revenueId, expenditure, onClose }) {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingFile, setViewingFile] = useState(null);

    useEffect(() => {
        if (expenditure) {
            axios.get(`${API_URL}expenditure/get_attachments.php?expenditure_id=${expenditure.id}`, { withCredentials: true })
                .then(res => {
                    if (res.data.status === 'success') {
                        setFiles(res.data.data.map((file) => ({
                            ...file,
                            view_url: file.legacy
                                ? `${BASE_URL}expenditure/view_attachment.php?id=${expenditure.id}`
                                : `${BASE_URL}expenditure/view_attachment.php?attachment_id=${file.id}`,
                            download_url: file.legacy
                                ? `${BASE_URL}expenditure/download_attachment.php?id=${expenditure.id}`
                                : `${BASE_URL}expenditure/download_attachment.php?attachment_id=${file.id}`,
                        })));
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
            return;
        }

        axios.get(`${API_URL}revenue/get_attachments.php?revenue_id=${revenueId}`, { withCredentials: true })
            .then(res => {
                if (res.data.status === 'success') {
                    setFiles(res.data.data.map((file) => ({
                        ...file,
                        view_url: `${BASE_URL}revenue/view_file.php?id=${file.id}`,
                        download_url: `${BASE_URL}revenue/download_file.php?id=${file.id}`,
                    })));
                }
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [revenueId, expenditure]);

    return (
        <div className="revenue-modal-background" onClick={onClose}>
            <div className="revenue-modal" onClick={(e) => e.stopPropagation()}>
                <h2>Attached Documents</h2>
                
                {loading && <p>Loading files...</p>}
                {!loading && files.length === 0 && <p className="muted">No files attached.</p>}

                {!loading && files.length > 0 && (
                    <ul className="file-list">
                        {files.map((file) => (
                            <li key={file.id} className="file-item">
                                <div className="file-info">
                                    <span className="file-name">{file.file_name}</span>
                                    <span className="file-meta">{(file.file_size / 1024).toFixed(1)} KB</span>
                                </div>
                                <button
                                    className="btn-view"
                                    onClick={() => setViewingFile(file)}
                                    style={{ cursor: 'pointer', border: 'none' }}
                                >
                                    View
                                </button>
                                <a
                                    href={file.download_url}
                                    className="btn-view"
                                    download
                                >
                                    Download
                                </a>
                            </li>
                        ))}
                    </ul>
                )}

                <div className="revenue-modal-actions">
                    <button type="button" className="btn-cancel" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>

            {viewingFile && (
                <div className="logout-modal-backdrop" onClick={(e) => { e.stopPropagation(); setViewingFile(null); }}>
                    <div className="audit-file-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="audit-file-modal-header">
                            <h3>{viewingFile.file_name}</h3>
                            <button className="btn-outline" onClick={() => setViewingFile(null)}>✕ Close</button>
                        </div>
                        <div className="audit-file-modal-body">
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