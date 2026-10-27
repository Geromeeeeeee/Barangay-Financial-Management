import { useState, useEffect } from "react";
import axios from "axios";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function DashboardChart() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        axios.get(`${API_URL}analytics/get_chart_data.php?year=${year}`, { withCredentials: true })
            .then(res => {
                if (res.data.success) {
                    setData(res.data.data);
                }
            })
            .catch(err => console.error("Failed to load analytics", err))
            .finally(() => setLoading(false));
    }, [year]);

    const formatPeso = (value) => "₱" + Number(value).toLocaleString();

    return (
        <div className="dash-card" style={{ marginBottom: '20px' }}>
            <div className="dash-card-head">
                <h2>Financial Analytics</h2>
                <select 
                    value={year} 
                    onChange={(e) => setYear(Number(e.target.value))}
                    style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', cursor: 'pointer' }}
                >
                    {[2024, 2025, 2026, 2027].map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>

            {loading && <p className="muted" style={{ padding: '20px 0' }}>Loading chart data...</p>}

            {!loading && (
                <div style={{ width: '100%', height: 320, marginTop: '10px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis 
                                tickFormatter={formatPeso} 
                                tick={{ fill: '#64748b', fontSize: 12 }} 
                                axisLine={false} 
                                tickLine={false}
                                width={85}
                            />
                            <Tooltip 
                                formatter={(value) => formatPeso(value)}
                                contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }} />
                            <Bar dataKey="revenue" name="Revenue" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={45} />
                            <Bar dataKey="expenditure" name="Expenditures" fill="#dc2626" radius={[4, 4, 0, 0]} maxBarSize={45} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}