import { useState, useEffect } from "react";
import axios from "axios";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import "../styles/analytics.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function Analytics() {
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
        <div className="analytics-page">
            <header className="analytics-header">
                <div>
                    <h1>Financial Analytics</h1>
                    <p>Monthly comparison of revenue and expenditures</p>
                </div>
                <div className="analytics-filters">
                    <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                        {[2024, 2025, 2026, 2027].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </header>

            {loading && <p>Loading chart data...</p>}

            {!loading && (
                <div className="chart-card">
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart
                                data={data}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis 
                                    tickFormatter={formatPeso} 
                                    tick={{ fill: '#64748b' }} 
                                    axisLine={false} 
                                    tickLine={false}
                                    width={90}
                                />
                                <Tooltip 
                                    formatter={(value) => formatPeso(value)}
                                    contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="revenue" name="Revenue" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                <Bar dataKey="expenditure" name="Expenditures" fill="#dc2626" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
}