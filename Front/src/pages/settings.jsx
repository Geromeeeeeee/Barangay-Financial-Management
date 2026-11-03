import { useState, useRef } from "react";
import axios from "axios";
import { useRole } from "../custom_hooks/use_role";
import BackButton from "../components/back_button";
import "../styles/dashboard.css";

const API_URL = "http://localhost/Capstone/Back/endpoints/";
const BASE_URL = "http://localhost/Capstone/Back/";

const IconUser = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const IconLock = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const IconCamera = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px' }}>
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
    </svg>
);

const EyeIcon = ({ open }) => {
    return open ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px' }}>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
};

export default function Settings() {
    const { user } = useRole();
    const [activeTab, setActiveTab] = useState("profile");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const fileInputRef = useRef(null);

    const [profile, setProfile] = useState({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
        phone: user?.phone || "",
    });
    
    const [avatarFile, setAvatarFile] = useState(null);
    const [preview, setPreview] = useState(user?.profile_picture ? `${BASE_URL}${user.profile_picture}` : null);

    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const handleProfileChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });
    const handlePasswordChange = (e) => setPasswords({ ...passwords, [e.target.name]: e.target.value });

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleCancelProfile = () => {
        setProfile({
            firstName: user?.firstName || "",
            lastName: user?.lastName || "",
            email: user?.email || "",
            phone: user?.phone || "",
        });
        setAvatarFile(null);
        setPreview(user?.profile_picture ? `${BASE_URL}${user.profile_picture}` : null);
        setMessage({ type: "", text: "" });
    };

    const updateProfile = async () => {
        setShowSaveModal(false);
        setLoading(true); setMessage({ type: "", text: "" });
        
        const formData = new FormData();
        formData.append("action", "update_info");
        formData.append("firstName", profile.firstName);
        formData.append("lastName", profile.lastName);
        formData.append("email", profile.email);
        formData.append("phone", profile.phone);
        if (avatarFile) formData.append("avatar", avatarFile);

        try {
            const res = await axios.post(`${API_URL}user/update_profile.php`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true
            });
            
            if (res.data.status === 'success') {
                setMessage({ type: "success", text: res.data.message });
                const newPicPath = res.data.profile_picture;
                setPreview(`${BASE_URL}${newPicPath}`); 

                const currentUser = JSON.parse(localStorage.getItem("user")) || user;
                const updatedUser = { ...currentUser, ...profile, profile_picture: newPicPath };
                
                localStorage.setItem("user", JSON.stringify(updatedUser));
                setTimeout(() => window.location.reload(), 1000);
            } else {
                setMessage({ type: "error", text: res.data.message });
            }
        } catch (err) {
            setMessage({ type: "error", text: err.response?.data?.message || "Failed to update profile." });
        } finally {
            setLoading(false);
        }
    };

    const executeChangePassword = async () => {
        setLoading(true); setMessage({ type: "", text: "" });
        try {
            const res = await axios.post(`${API_URL}user/update_profile.php`, 
                { action: 'change_password', ...passwords }, 
                { withCredentials: true }
            );
            if (res.data.status === 'success') {
                setMessage({ type: "success", text: res.data.message });
                setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
                setShowPasswordModal(false);
            } else {
                setMessage({ type: "error", text: res.data.message });
                setShowPasswordModal(false);
            }
        } catch (err) {
            setMessage({ type: "error", text: err.response?.data?.message || "Failed to change password." });
            setShowPasswordModal(false);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            return setMessage({ type: "error", text: "New passwords do not match." });
        }
        if (passwords.newPassword.length < 6) {
            return setMessage({ type: "error", text: "Password must be at least 6 characters." });
        }
        setShowPasswordModal(true);
    };

    const formatRole = (role) => {
        const map = { admin: "Administrator", treasurer: "Treasurer", staff: "Staff", sk_chairman: "SK Chairman", sk_member: "SK Member" };
        return map[role] || role;
    };

    return (
        <div className="settings-page">
            <BackButton />
            
            <header className="settings-header">
                <h1>Account Settings</h1>
                <p>Manage your personal information and security preferences.</p>
            </header>
            
            <div className="settings-layout">
                <aside className="settings-sidebar">
                    <div className="settings-sidebar-title">Account</div>
                    <button 
                        className={`settings-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('profile'); setMessage({type:"", text:""}); }}
                    >
                        <IconUser /> Profile Information
                    </button>
                    <button 
                        className={`settings-nav-btn ${activeTab === 'security' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('security'); setMessage({type:"", text:""}); }}
                    >
                        <IconLock /> Security & Password
                    </button>
                </aside>

                <main className="settings-content">
                    {message.text && (
                        <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: '20px' }}>
                            {message.text}
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="settings-panel">
                            <div className="settings-panel-header">
                                <div className="avatar-wrapper">
                                    <div className="avatar-preview">
                                        {preview ? (
                                            <img src={preview} alt="Avatar" />
                                        ) : (
                                            <span className="avatar-initials">
                                                {profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                    <button type="button" className="avatar-edit-btn" onClick={() => fileInputRef.current.click()}>
                                        <IconCamera />
                                    </button>
                                    <input type="file" ref={fileInputRef} accept="image/jpeg, image/png" onChange={handleAvatarChange} style={{ display: "none" }} />
                                </div>
                                <div className="settings-panel-title">
                                    <h2>{profile.firstName} {profile.lastName}</h2>
                                    <p>Manage your personal details below.</p>
                                </div>
                            </div>

                            <form onSubmit={(e) => { e.preventDefault(); setShowSaveModal(true); }} className="settings-form-grid">
                                <div className="form-group full-width">
                                    <label style={{ color: '#94a3b8', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>System Information</label>
                                    <div style={{ display: 'flex', gap: '20px', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                        <div style={{ flex: 1 }}>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Username</span>
                                            <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>@{user?.username}</strong>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Role / Designation</span>
                                            <strong style={{ fontSize: '0.9rem', color: '#166534' }}>{formatRole(user?.role)}</strong>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>First Name</label>
                                    <input name="firstName" value={profile.firstName} onChange={handleProfileChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Last Name</label>
                                    <input name="lastName" value={profile.lastName} onChange={handleProfileChange} required />
                                </div>
                                <div className="form-group full-width">
                                    <label>Email Address</label>
                                    <input type="email" name="email" value={profile.email} onChange={handleProfileChange} required />
                                </div>
                                <div className="form-group full-width">
                                    <label>Phone Number</label>
                                    <input type="tel" name="phone" placeholder="09XX XXX XXXX" value={profile.phone} onChange={handleProfileChange} />
                                </div>
                                
                                <div className="form-footer full-width" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                    <button type="button" className="btn-outline" onClick={handleCancelProfile} disabled={loading}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary" disabled={loading}>
                                        {loading ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="settings-panel">
                            <div className="settings-panel-header">
                                <div className="settings-panel-title">
                                    <h2>Security & Password</h2>
                                    <p>Update your password to keep your account secure.</p>
                                </div>
                            </div>

                            <form onSubmit={handlePasswordSubmit} className="settings-form-grid">
                                <div className="form-group full-width">
                                    <label>Current Password</label>
                                    <div className="password-input-wrap">
                                        <input 
                                            type={showCurrent ? "text" : "password"} 
                                            name="currentPassword" 
                                            value={passwords.currentPassword} 
                                            onChange={handlePasswordChange} 
                                            required 
                                        />
                                        <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="eye-btn">
                                            <EyeIcon open={showCurrent} />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label>New Password</label>
                                    <div className="password-input-wrap">
                                        <input 
                                            type={showNew ? "text" : "password"} 
                                            name="newPassword" 
                                            value={passwords.newPassword} 
                                            onChange={handlePasswordChange} 
                                            required 
                                        />
                                        <button type="button" onClick={() => setShowNew(!showNew)} className="eye-btn">
                                            <EyeIcon open={showNew} />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="form-group">
                                    <label>Confirm New Password</label>
                                    <div className="password-input-wrap">
                                        <input 
                                            type={showConfirm ? "text" : "password"} 
                                            name="confirmPassword" 
                                            value={passwords.confirmPassword} 
                                            onChange={handlePasswordChange} 
                                            required 
                                        />
                                        <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="eye-btn">
                                            <EyeIcon open={showConfirm} />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="form-footer full-width" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                    <button 
                                        type="button" 
                                        className="btn-outline" 
                                        onClick={() => {
                                            setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
                                            setMessage({ type: "", text: "" });
                                        }}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary" disabled={loading}>
                                        {loading ? "Updating..." : "Update Password"}
                                    </button>
                                </div>
                            </form>
                            
                            <div style={{ padding: '0 32px 32px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem' }}>
                                Need to deactivate your account? Please contact the Barangay Administrator.
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {showSaveModal && (
                <div className="logout-modal-backdrop" onClick={() => setShowSaveModal(false)}>
                    <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="logout-modal-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}>
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                        </div>
                        <h3>Save Changes?</h3>
                        <p>Are you sure you want to update your profile information?</p>
                        <div className="logout-modal-actions">
                            <button type="button" className="logout-modal-cancel" onClick={() => setShowSaveModal(false)}>Cancel</button>
                            <button type="button" className="logout-modal-confirm btn-blue" onClick={updateProfile}>
                                Yes, Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPasswordModal && (
                <div className="logout-modal-backdrop" onClick={() => !loading && setShowPasswordModal(false)}>
                    <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="logout-modal-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px' }}>
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>
                        <h3>Update Password?</h3>
                        <p>Are you sure you want to change your password? You will need to use the new password on your next login.</p>
                        <div className="logout-modal-actions">
                            <button 
                                type="button" 
                                className="logout-modal-cancel" 
                                onClick={() => setShowPasswordModal(false)} 
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button" 
                                className="logout-modal-confirm btn-blue" 
                                onClick={executeChangePassword}
                                disabled={loading}
                            >
                                {loading ? "Updating..." : "Yes, Update"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}