import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function useAuth({ isLogin, setErr, setStat, setIsLogin }) {
    const navigate = useNavigate();
    const regex = /^(?=.*[a-z])(?=.*\d)[a-zA-Z0-9]{10,30}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const [accountDetails, setAccountDetails] = useState({
        firstName: '',
        lastName: '',
        userName:'',
        email: '',
        password: '',
        confirmPass: '',
        role: ''
    });

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setAccountDetails((prev) => ({
            ...prev,
            [name]: value
        }));
        setErr("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErr("");
        if (!isLogin && !emailRegex.test(accountDetails.email)) {
            setErr("Please enter a valid email address (e.g., user@example.com)");
            return;
        }
        if (!isLogin) {
            if (accountDetails.password !== accountDetails.confirmPass) {
                setErr('Passwords do not match');
                return;
            }
            if (!regex.test(accountDetails.password)) {
                setErr('Password must contain letters and numbers, and be 10-30 characters');
                return;
            }
        }

        const payload = {
            ...accountDetails,
            action: isLogin ? 'login' : 'signup'
        };

        try {
            const response = await axios.post(`${API_URL}auth.php`, payload,{
                withCredentials: true
            });
            if (response?.data?.status === 'logged') {
                navigate("/Dashboard");
            }
            if (response.data.status === 'account_created'){
                setIsLogin(true)
                setStat('Account Created')
            }
        } catch (error) {
            setErr(error.response?.data?.message || "Authentication failed. Please try again.");
        }
    };

    return { handleSubmit, handleFormChange, accountDetails };
}