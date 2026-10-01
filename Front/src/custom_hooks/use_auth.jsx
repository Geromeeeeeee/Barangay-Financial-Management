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
        firstName: '',
        lastName: '',
        userName: '',
        email: '',
        password: '',
        confirmPass: '',
        role: ''
    });

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setAccountDetails((prev) => ({ ...prev, [name]: value }));
        setErr("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr("");

        // ===== Email format =====
        if (!isLogin && !emailRegex.test(accountDetails.email)) {
            setErr("Please enter a valid email address (e.g., user@example.com)");
            return;
        }

        // ===== Username rules =====
        if (!isLogin && !usernameRegex.test(accountDetails.userName)) {
            setErr("Username must be 6-30 characters, using only letters, numbers, and periods.");
            return;
        }

        // ===== Signup password rules =====
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

        // ===== Payload =====
        const payload = {
            ...accountDetails,
            action: isLogin ? 'login' : 'signup',
            inviteCode: isLogin ? undefined : inviteCode.trim()
        };

        try {
            const response = await axios.post(`${API_URL}auth.php`, payload, {
                withCredentials: true
            });

            const status = response?.data?.status;

            // ========== LOGIN ==========
           if (status === 'logged') {
               localStorage.setItem("user", JSON.stringify(response.data.user));
               navigate("/Dashboard");
                return;
}
            if (status === 'pending_approval') {
                setErr("Your account is pending admin approval.");
                return;
            }
            if (status === 'account_rejected') {
                setErr("Your account request was rejected.");
                return;
            }
            if (status === 'account_not_found') {
                setErr("Account not found.");
                return;
            }
            if (status === 'Incorrect_password') {
                setErr("Incorrect password.");
                return;
            }

            // ========== SIGNUP ==========
            if (status === 'account_pending') {
                setIsLogin(true);
                setStat("Request submitted. Please wait for admin approval.");
                return;
            }
            if (status === 'invalid_invite') {
                setErr(response.data.message || "Invalid or expired invite code.");
                return;
            }
            if (status === 'username_taken') {
                setErr("Username is already taken.");
                return;
            }
            if (status === 'invalid_username') {
                setErr(response.data.message || "Invalid username.");
                return;
            }
            if (status === 'weak_password') {
                setErr(response.data.message || "Password is too weak.");
                return;
            }

            setErr("Something went wrong. Please try again.");
        } catch (error) {
            setErr(error.response?.data?.message || "Authentication failed. Please try again.");
        }
    };

    return { handleSubmit, handleFormChange, accountDetails };
}