import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/revenue.css"; 

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function FileListModal({ revenueId, expenditure, onClose }) {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (expenditure) {
            setFiles([{
                id: expenditure.id,
                file_name: expenditure.attachment_name,
                file_size: expenditure.attachment_size,
                view_url: `${API_URL}expenditure/view_attachment.php?id=${expenditure.id}`,
                download_url: `${API_URL}expenditure/download_attachment.php?id=${expenditure.id}`,
            }]);
            setLoading(false);
            return;
        }

        axios.get(`${API_URL}revenue/get_attachments.php?revenue_id=${revenueId}`, { withCredentials: true })
            .then(res => {
                if (res.data.status === 'success') {
                    setFiles(res.data.data.map((file) => ({
                        ...file,
                        view_url: `${API_URL}revenue/view_file.php?id=${file.id}`,
                        download_url: `${API_URL}revenue/download_file.php?id=${file.id}`,
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
                                <a
                                    href={file.view_url}
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="btn-view"
                                >
                                    View
                                </a>
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
        </div>
    );
}