import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import axios from "axios";
import "../styles/dashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function ClearanceChart() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChartData = async () => {
            try {
                const res = await axios.get(`${API_URL}staff/get_staff_stats.php`, { withCredentials: true });
                if (res.data.status === 'success' && res.data.data.chartData) {
                    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    const formatted = res.data.data.chartData.map((count, index) => ({
                        name: months[index],
                        clearances: count
                    }));
                    setData(formatted);
                }
            } catch (error) {
                console.error("Failed to load chart data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchChartData();
    }, []);

    return (
        <div className="dash-card" style={{ marginBottom: '24px' }}>
            <div className="dash-card-head">
                <h2>Clearances This Year</h2>
            </div>
            <div style={{ width: '100%', height: 300 }}>
                {loading ? (
                    <p className="muted" style={{ textAlign: 'center', paddingTop: '100px' }}>Loading chart...</p>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                            <Tooltip 
                                cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="clearances" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}