import { useState } from "react";
import axios from "axios";
import { useRole } from "../custom_hooks/use_role";
import BackButton from "../components/back_button";
import "../styles/dashboard.css"; // Reusing dashboard card styles

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function Settings() {
    const { user } = useRole();
    const [activeTab, setActiveTab] = useState("profile");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    // Profile State
    const [profile, setProfile] = useState({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        email: user?.email || "",
    });

    // Password State
    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const handleProfileChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });
    const handlePasswordChange = (e) => setPasswords({ ...passwords, [e.target.name]: e.target.value });

    const updateProfile = async (e) => {
        e.preventDefault();
        setLoading(true); setMessage({ type: "", text: "" });
        try {
            const res = await axios.post(`${API_URL}user/update_profile.php`, 
                { action: 'update_info', ...profile }, 
                { withCredentials: true }
            );
            if (res.data.status === 'success') {
                setMessage({ type: "success", text: res.data.message });
                // Update localStorage so the Navbar reflects the new name immediately
                const updatedUser = { ...user, ...profile };
                localStorage.setItem("user", JSON.stringify(updatedUser));
            } else {
                setMessage({ type: "error", text: res.data.message });
            }
        } catch (err) {
            setMessage({ type: "error", text: "Failed to update profile." });
        } finally {
            setLoading(false);
        }
    };

    const changePassword = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            return setMessage({ type: "error", text: "New passwords do not match." });
        }
        setLoading(true); setMessage({ type: "", text: "" });
        try {
            const res = await axios.post(`${API_URL}user/update_profile.php`, 
                { action: 'change_password', ...passwords }, 
                { withCredentials: true }
            );
            if (res.data.status === 'success') {
                setMessage({ type: "success", text: res.data.message });
                setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                setMessage({ type: "error", text: res.data.message });
            }
        } catch (err) {
            setMessage({ type: "error", text: "Failed to change password." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-page" style={{ maxWidth: '800px' }}>
            <BackButton />
            
            <header className="dash-hero" style={{ marginBottom: '24px' }}>
                <div>
                    <h1>Account Settings</h1>
                    <p className="dash-sub">Manage your personal information and security.</p>
                </div>
            </header>

            {message.text && (
                <div className={`alert alert-${message.type === 'success' ? 'success' : 'error'}`} style={{ marginBottom: '20px' }}>
                    {message.text}
                </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button 
                    className={`btn-${activeTab === 'profile' ? 'primary' : 'cancel'}`} 
                    onClick={() => { setActiveTab('profile'); setMessage({type:"", text:""}); }}
                >
                    Profile Information
                </button>
                <button 
                    className={`btn-${activeTab === 'security' ? 'primary' : 'cancel'}`} 
                    onClick={() => { setActiveTab('security'); setMessage({type:"", text:""}); }}
                >
                    Security & Password
                </button>
            </div>

            <section className="dash-card">
                {activeTab === 'profile' && (
                    <form onSubmit={updateProfile} className="auth-form" style={{ maxWidth: '400px' }}>
                        <h2>Update Profile</h2>
                        <label className="field">
                            <span>First Name</span>
                            <input name="firstName" value={profile.firstName} onChange={handleProfileChange} required />
                        </label>
                        <label className="field">
                            <span>Last Name</span>
                            <input name="lastName" value={profile.lastName} onChange={handleProfileChange} required />
                        </label>
                        <label className="field">
                            <span>Email Address</span>
                            <input type="email" name="email" value={profile.email} onChange={handleProfileChange} required />
                        </label>
                        <button type="submit" className="submit-button" disabled={loading}>
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </form>
                )}

                {activeTab === 'security' && (
                    <form onSubmit={changePassword} className="auth-form" style={{ maxWidth: '400px' }}>
                        <h2>Change Password</h2>
                        <label className="field">
                            <span>Current Password</span>
                            <input type="password" name="currentPassword" value={passwords.currentPassword} onChange={handlePasswordChange} required />
                        </label>
                        <label className="field">
                            <span>New Password</span>
                            <input type="password" name="newPassword" value={passwords.newPassword} onChange={handlePasswordChange} required />
                        </label>
                        <label className="field">
                            <span>Confirm New Password</span>
                            <input type="password" name="confirmPassword" value={passwords.confirmPassword} onChange={handlePasswordChange} required />
                        </label>
                        <button type="submit" className="submit-button" disabled={loading}>
                            {loading ? "Updating..." : "Update Password"}
                        </button>
                    </form>
                )}
            </section>
        </div>
    );
}