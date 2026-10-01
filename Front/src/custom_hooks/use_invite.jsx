import { useState, useEffect } from "react";

const API = "http://localhost/Capstone/Back/endpoints";

export function useInvite() {
    const [codes, setCodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchCodes = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/admin/invite_codes.php?action=list`, {
                credentials: "include",
            });
            const data = await res.json();
            setCodes(data);
        } catch (e) {
            setError("Failed to load codes");
        } finally {
            setLoading(false);
        }
    };

    const generateCode = async (role, expiresInHours = 24) => {
        setError(""); setSuccess("");
        try {
            const res = await fetch(`${API}/admin/invite_codes.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ action: "create", role, expiresInHours }),
            });
            const data = await res.json();
            setCodes((prev) => [data, ...prev]);
            setSuccess(`Code created: ${data.code}`);
            return data;
        } catch (e) {
            setError("Failed to generate code");
        }
    };

    const revokeCode = async (id) => {
        setError(""); setSuccess("");
        try {
            await fetch(`${API}/admin/invite_codes.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ action: "revoke", id }),
            });
            setCodes((prev) => prev.filter((c) => c.id !== id));
            setSuccess("Code revoked");
        } catch (e) {
            setError("Failed to revoke code");
        }
    };

    useEffect(() => { fetchCodes(); }, []);

    return { codes, loading, error, success, generateCode, revokeCode, fetchCodes };
}

export async function validateInviteCode(code) {
    try {
        const res = await fetch(`${API}/auth.php`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ action: "validateInvite", inviteCode: code }),
        });
        return await res.json();
    } catch {
        return { valid: false, message: "Could not reach server" };
    }
}