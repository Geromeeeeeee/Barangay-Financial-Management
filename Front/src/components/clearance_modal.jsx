import { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "../context/toast_context"; 
import "../styles/staff_dashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function ClearanceModal({ isOpen, onClose, onSuccess, editData }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    
    const defaultForm = {
        resident_name: "",
        clearance_type: "Barangay Clearance",
        purpose: "",
        status: "Issued",
    };

    const [form, setForm] = useState(defaultForm);

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setForm({
                    resident_name: editData.resident_name,
                    clearance_type: editData.clearance_type,
                    purpose: editData.purpose || "",
                    status: editData.status,
                });
            } else {
                setForm(defaultForm);
            }
        }
    }, [isOpen, editData]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg("");

        try {
            let res;
            if (editData) {
                // Edit mode
                res = await axios.post(`${API_URL}staff/update_clearance.php`, 
                    { id: editData.id, ...form }, 
                    { withCredentials: true }
                );
            } else {
                // New mode
                res = await axios.post(`${API_URL}staff/add_clearance.php`, form, {
                    withCredentials: true,
                });
            }

            if (res.data.status === "success") {
                showToast(editData ? "Clearance updated!" : "Clearance issued successfully!", "success"); 
                onSuccess();
                onClose();
            } else {
                setErrorMsg(res.data.message || "Failed to save.");
                showToast(res.data.message || "Failed to save.", "error");
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || "Server error.");
            showToast(err.response?.data?.message || "Server error.", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="logout-modal-backdrop" onClick={onClose}>
            <div className="logout-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px", padding: "32px" }}>
                <h3 style={{ marginBottom: "20px", fontSize: "1.25rem", fontWeight: 700 }}>
                    {editData ? "Edit Clearance" : "Issue New Clearance"}
                </h3>

                {errorMsg && <div className="alert alert-error" style={{ marginBottom: "16px" }}>{errorMsg}</div>}

                <form onSubmit={handleSubmit} className="revenue-form">
                    <label>
                        <span>Resident Name</span>
                        <input
                            type="text"
                            name="resident_name"
                            value={form.resident_name}
                            onChange={handleChange}
                            required
                            disabled={!!editData} // Prevent editing name on edit mode for integrity
                        />
                    </label>

                    <label>
                        <span>Clearance Type</span>
                        <select name="clearance_type" value={form.clearance_type} onChange={handleChange} required>
                            <option value="Barangay Clearance">Barangay Clearance</option>
                            <option value="Certificate of Indigency">Certificate of Indigency</option>
                            <option value="Business Clearance">Business Clearance</option>
                            <option value="Certificate of Residency">Certificate of Residency</option>
                            <option value="First Time Job Seeker">First Time Job Seeker</option>
                        </select>
                    </label>

                    <label>
                        <span>Purpose</span>
                        <input
                            type="text"
                            name="purpose"
                            value={form.purpose}
                            onChange={handleChange}
                        />
                    </label>

                    <label>
                        <span>Status</span>
                        <select name="status" value={form.status} onChange={handleChange}>
                            <option value="Pending">Pending</option>
                            <option value="Issued">Issued (Ready to Print)</option>
                        </select>
                    </label>

                    <div className="logout-modal-actions" style={{ marginTop: "20px" }}>
                        <button type="button" className="logout-modal-cancel" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button type="submit" className="logout-modal-confirm btn-blue" disabled={loading}>
                            {loading ? "Saving..." : (editData ? "Save Changes" : "Issue Clearance")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}