import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export function useNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [feedback, setFeedback] = useState("");

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await axios.get(`${API_URL}notifications.php`, { withCredentials: true });
            if (Array.isArray(res.data)) {
                setNotifications(res.data);
                setUnreadCount(res.data.filter((notification) => !Number(notification.is_read)).length);
            }
        } catch (err) {
            console.error("Failed to load notifications", err);
            setFeedback("Unable to load notifications.");
        }
    }, []);

    useEffect(() => {
        const initialFetch = setTimeout(fetchNotifications, 0);
        const interval = setInterval(fetchNotifications, 30000);
        return () => {
            clearTimeout(initialFetch);
            clearInterval(interval);
        };
    }, [fetchNotifications]);

    const markAllAsRead = async () => {
        if (unreadCount === 0) return;

        try {
            await axios.post(
                `${API_URL}notifications.php`,
                { action: "mark_all_read" },
                { withCredentials: true }
            );
            setNotifications((current) => current.map((notification) => ({ ...notification, is_read: 1 })));
            setUnreadCount(0);
            setFeedback("All notifications marked as read.");
        } catch (err) {
            console.error("Failed to mark notifications as read", err);
            setFeedback("Unable to mark notifications as read.");
        }
    };

    return { notifications, unreadCount, markAllAsRead, feedback, fetchNotifications };
}