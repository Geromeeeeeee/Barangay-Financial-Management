import { useState, useEffect } from "react";
import axios from "axios";
import "../styles/reports.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function Reports() {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}reports/financial_report.php?month=${month}&year=${year}`, {
                withCredentials: true
            });
            if (res.data.success) {
                setData(res.data);
            }
        } catch (error) {
            console.error("Failed to load report", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [month, year]);

    const formatPeso = (n) => "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="reports-page">
            {/* Header */}
            <header className="reports-header">
                <div>
                    <h1>Financial Reports</h1>
                    <p>Monthly revenue and expenditure summary</p>
                </div>
                <div className="report-actions">
                    <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                        {months.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                    </select>
                    <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />
                    <button className="btn-print" onClick={() => window.print()}>Print Report</button>
                </div>
            </header>

            {loading && <p>Loading report...</p>}

            {!loading && data && (
                <div className="report-document">
                    {/* Print Header */}
                    <div className="print-header">
                        <h2>Barangay Malagasang II-A</h2>
                        <h3>Financial Statement - {months[month - 1]} {year}</h3>
                    </div>

                    {/* Summary Cards */}
                    <div className="report-summary">
                        <div className="summary-card green">
                            <span>Total Revenue</span>
                            <strong>{formatPeso(data.totalRevenue)}</strong>
                        </div>
                        <div className="summary-card red">
                            <span>Total Expenditures</span>
                            <strong>{formatPeso(data.totalExpenditure)}</strong>
                        </div>
                        <div className="summary-card blue">
                            <span>Net Income</span>
                            <strong>{formatPeso(data.netIncome)}</strong>
                        </div>
                    </div>

                    {/* Revenues Table */}
                    <h4>Revenue Breakdown</h4>
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Source</th>
                                <th>Fund Allocation</th>
                                <th className="right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.revenues.length === 0 ? (
                                <tr><td colSpan="4" className="center">No revenues recorded this month.</td></tr>
                            ) : (
                                data.revenues.map(r => (
                                    <tr key={r.id}>
                                        <td>{new Date(r.created_at).toLocaleDateString()}</td>
                                        <td>{r.source}</td>
                                        <td>{r.fund_allocation || "General"}</td>
                                        <td className="right">{formatPeso(r.amount)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Expenditures Table */}
                    <h4>Expenditure Breakdown</h4>
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th className="right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.expenditures.length === 0 ? (
                                <tr><td colSpan="3" className="center">No expenditures recorded this month.</td></tr>
                            ) : (
                                data.expenditures.map(e => (
                                    <tr key={e.id}>
                                        <td>{new Date(e.created_at).toLocaleDateString()}</td>
                                        <td>{e.source}</td>
                                        <td className="right">{formatPeso(e.amount)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    
                    <div className="print-footer">
                        <p>Generated on {new Date().toLocaleString()}</p>
                        <div className="signature-line">Prepared by: ____________________</div>
                    </div>
                </div>
            )}
        </div>
    );
}