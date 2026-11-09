import { useState, useEffect } from "react";
import axios from "axios";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "../styles/dashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function SKChart() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        axios.get(`${API_URL}analytics/get_sk_chart_data.php?year=${year}`, { withCredentials: true })
            .then(res => {
                if (res.data.success) setData(res.data.data);
            })
            .catch(err => setError("Failed to load SK chart data."))
            .finally(() => setLoading(false));
    }, [year]);

    return (
        <div className="dash-card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
            <div className="dash-card-head">
                <h2>SK Budget Utilization</h2>
                <select 
                    value={year} 
                    onChange={(e) => setYear(Number(e.target.value))}
                    style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontWeight: 600 }}
                >
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                    <option value={2024}>2024</option>
                </select>
            </div>
            
            <div style={{ flex: 1, width: '100%', minHeight: 0 }}>
                {loading ? (
                    <p className="muted" style={{ textAlign: 'center', paddingTop: '100px' }}>Loading chart...</p>
                ) : error ? (
                    <p className="muted" style={{ textAlign: 'center', paddingTop: '100px' }}>{error}</p>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#64748b', fontSize: 12 }} 
                                tickFormatter={(value) => `₱${value / 1000}k`} 
                            />
                            <Tooltip 
                                cursor={{ fill: 'rgba(226, 232, 240, 0.4)' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                formatter={(value) => `₱${Number(value).toLocaleString()}`}
                            />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                            <Bar dataKey="spent" name="Spent" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={25} />
                            <Line type="monotone" dataKey="allocated" name="Monthly Allocation" stroke="#2563eb" strokeWidth={3} dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}