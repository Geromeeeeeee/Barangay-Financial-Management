import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function useAuth({ isLogin, setErr, setStat, setIsLogin, inviteCode }) {
    const navigate = useNavigate();

    const emailRegex    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernameRegex = /^(?![.])(?!.*[.]{2})(?![.])[a-z0-9.]{6,30}$/i;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*]{6,12}$/;

    const [accountDetails, setAccountDetails] = useState({
        firstName: '', lastName: '', userName: '', email: '', password: '', confirmPass: '', role: ''
    });

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setAccountDetails((prev) => ({ ...prev, [name]: value }));
        setErr("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr("");

        // ===== Validation =====
        if (!isLogin && !emailRegex.test(accountDetails.email)) {
            setErr("Please enter a valid email address.");
            return;
        }
        if (!isLogin && !usernameRegex.test(accountDetails.userName)) {
            setErr("Username must be 6-30 characters, using only letters, numbers, and periods.");
            return;
        }
        if (!isLogin) {
            if (!inviteCode || !inviteCode.trim()) {
                setErr("Please enter your invite code");
                return;
            }
            if (accountDetails.password !== accountDetails.confirmPass) {
                setErr("Passwords do not match");
                return;
            }
            if (!passwordRegex.test(accountDetails.password)) {
                setErr("Password must be 6-12 characters with uppercase, lowercase, and a number.");
                return;
            }
        }

        const payload = {
            ...accountDetails,
            action: isLogin ? 'login' : 'signup',
            inviteCode: isLogin ? undefined : inviteCode.trim()
        };

        try {
            const response = await axios.post(`${API_URL}auth.php`, payload, { withCredentials: true });
            const status = response?.data?.status;

            // ========== LOGIN ==========
            if (status === 'logged') {
                localStorage.setItem("user", JSON.stringify(response.data.user));
                navigate("/Dashboard");
                return;
            }
            if (status === 'pending_approval') return setErr("Your account is pending admin approval.");
            if (status === 'account_rejected') return setErr("Your account request was rejected.");
            if (status === 'account_not_found') return setErr("Account not found.");
            if (status === 'Incorrect_password') return setErr("Incorrect password.");

            // ========== SIGNUP ==========
            if (status === 'account_created') {
                setIsLogin(true);
                setStat("Account created successfully! You can now sign in.");
                return;
            }
            
            // Show the specific error message (e.g., wrong email, username taken)
            if (response.data.message) {
                return setErr(response.data.message);
            }

            setErr("Something went wrong. Please try again.");
        } catch (error) {
            setErr(error.response?.data?.message || "Authentication failed. Please try again.");
        }
    };

    return { handleSubmit, handleFormChange, accountDetails };
}