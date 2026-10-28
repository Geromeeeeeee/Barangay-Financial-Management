import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export function useProjects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            // 👇 Changed to projects.php
            const res = await axios.get(`${API_URL}projects/projects.php`, { withCredentials: true });
            setProjects(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const submitProject = async (projectData) => {
        await axios.post(`${API_URL}projects/add_project.php`, projectData, { withCredentials: true });
        fetchProjects();
    };

    const updateStatus = async (id, status) => {
        // 👇 Changed to projects.php
        await axios.post(`${API_URL}projects/projects.php`, { action: 'update_status', id, status }, { withCredentials: true });
        fetchProjects();
    };

    useEffect(() => { fetchProjects(); }, []);

    return { projects, loading, submitProject, updateStatus, fetchProjects };
}