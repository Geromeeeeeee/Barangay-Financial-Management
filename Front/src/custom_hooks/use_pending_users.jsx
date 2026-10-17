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
            if (!res.ok || !Array.isArray(data)) {
                throw new Error(data.message || "Failed to load pending users");
            }
            setUsers(data);
        } catch (e) {
            setError(e.message || "Failed to load pending users");
        } finally {
            setLoading(false);
        }
    };

    const approve = async (id) => {
        setError(""); setSuccess("");
        try {
            const res = await fetch(`${API}/admin/pending_users.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ action: "approve", id }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || "Failed to approve");
            }
            setUsers((prev) => prev.filter((u) => u.id !== id));
            setSuccess("User approved");
        } catch (e) {
            setError(e.message || "Failed to approve");
        }
    };

    const reject = async (id) => {
        setError(""); setSuccess("");
        try {
            const res = await fetch(`${API}/admin/pending_users.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ action: "reject", id }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || "Failed to reject");
            }
            setUsers((prev) => prev.filter((u) => u.id !== id));
            setSuccess("User rejected");
        } catch (e) {
            setError(e.message || "Failed to reject");
        }
    };

    useEffect(() => { fetchPending(); }, []);

    return { users, loading, error, success, approve, reject, fetchPending };
}