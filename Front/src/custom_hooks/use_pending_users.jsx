import { useState, useEffect } from "react";

const API = "http://localhost/Capstone/Back/endpoints";

export function usePendingUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/admin/pending_users.php?action=list`, {
                credentials: "include",
            });
            const data = await res.json();
            setUsers(data);
        } catch (e) {
            setError("Failed to load pending users");
        } finally {
            setLoading(false);
        }
    };

    const approve = async (id) => {
        setError(""); setSuccess("");
        try {
            await fetch(`${API}/admin/pending_users.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ action: "approve", id }),
            });
            setUsers((prev) => prev.filter((u) => u.id !== id));
            setSuccess("User approved");
        } catch (e) {
            setError("Failed to approve");
        }
    };

    const reject = async (id) => {
        setError(""); setSuccess("");
        try {
            await fetch(`${API}/admin/pending_users.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ action: "reject", id }),
            });
            setUsers((prev) => prev.filter((u) => u.id !== id));
            setSuccess("User rejected");
        } catch (e) {
            setError("Failed to reject");
        }
    };

    useEffect(() => { fetchPending(); }, []);

    return { users, loading, error, success, approve, reject, fetchPending };
}