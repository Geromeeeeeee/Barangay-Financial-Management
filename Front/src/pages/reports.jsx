import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import BackButton from "../components/back_button";
import sealLogo from "../assets/barangay-malagasang-logo.jpg";
import "../styles/reports.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function Reports() {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [downloadFeedback, setDownloadFeedback] = useState("");
    const reportRef = useRef(null);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await axios.get(`${API_URL}reports/financial_report.php?month=${month}&year=${year}`, {
                withCredentials: true
            });
            if (res.data.success) {
                setData(res.data);
            } else {
                setError(res.data.message || "Unable to load report.");
            }
        } catch (error) {
            console.error("Failed to load report", error);
            setError(error.response?.data?.message || "Unable to load report.");
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        const reportFetch = setTimeout(fetchReport, 0);
        return () => clearTimeout(reportFetch);
    }, [fetchReport]);

    const formatPeso = (n) => "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 });

    const downloadReport = () => {
        setDownloadFeedback("");
        try {
            if (!reportRef.current) {
                throw new Error("Report is not available for download.");
            }

            const report = reportRef.current.cloneNode(true);
            report.querySelectorAll("img").forEach((image) => {
                image.src = new URL(image.getAttribute("src"), window.location.href).href;
            });

            const css = Array.from(document.styleSheets).flatMap((sheet) => {
                try {
                    return Array.from(sheet.cssRules).map((rule) => rule.cssText);
                } catch (error) {
                    console.error("Unable to read report styles", error);
                    return [];
                }
            }).join("\n");

            if (!css) {
                throw new Error("Report styles are unavailable.");
            }

            const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Financial Report - ${months[month - 1]} ${year}</title>
<style>${css}</style>
</head>
<body>${report.outerHTML}</body>
</html>`;
            const blob = new Blob([html], { type: "text/html;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `financial-report-${months[month - 1].toLowerCase()}-${year}.html`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(url), 0);
            setDownloadFeedback("Report downloaded.");
        } catch (downloadError) {
            console.error("Failed to download report", downloadError);
            setDownloadFeedback("Unable to download report. Please try again.");
        }
    };

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const years = Array.from({ length: 6 }, (_, index) => new Date().getFullYear() - index);

    return (
        <div className="reports-page">
            <BackButton />
            
            <header className="reports-header">
                <div>
                    <h1>Financial Reports</h1>
                    <p>Generate official monthly statements</p>
                </div>
                <div className="report-actions">
                    <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                        {months.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                    </select>
                    <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                        {years.map((reportYear) => <option key={reportYear} value={reportYear}>{reportYear}</option>)}
                    </select>
                    <button className="btn-print" onClick={() => window.print()}>Print Report</button>
                    <button className="btn-download" onClick={downloadReport} disabled={!data}>Download Report</button>
                </div>
            </header>

            {loading && <p>Loading report...</p>}
            {error && <p className="report-error">{error}</p>}
            {downloadFeedback && <p className="report-feedback">{downloadFeedback}</p>}

            {!loading && data && (
                <div className="report-document" ref={reportRef}>
                    <div className="print-header">
                        <div className="print-header-left">
                            <p>Republic of the Philippines</p>
                            <p>Province of Cavite</p>
                            <p>City of Imus</p>
                            <h2>BARANGAY MALAGASANG II-A</h2>
                            <p>Office of the Barangay Treasurer</p>
                        </div>
                        <img src={sealLogo} alt="Barangay Seal" className="print-logo" />
                        <div className="print-header-right">
                            <p>Statement of Income and Expenses</p>
                            <p>For the Month of {months[month - 1]} {year}</p>
                        </div>
                    </div>

                    <div className="print-divider"></div>

                    <h4>PART I: REVENUE SOURCES</h4>
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>Source of Revenue</th>
                                <th className="center">No. of Entries</th>
                                <th className="right">Total Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.revenues.length === 0 ? (
                                <tr><td colSpan="3" className="center empty-row">No revenues recorded for this period.</td></tr>
                            ) : (
                                data.revenues.map((r, index) => (
                                    <tr key={index}>
                                        <td>{r.source}</td>
                                        <td className="center">{r.entry_count}</td>
                                        <td className="right">{formatPeso(r.total_amount)}</td>
                                    </tr>
                                ))
                            )}
                            <tr className="total-row">
                                <td colSpan="2">TOTAL REVENUE</td>
                                <td className="right">{formatPeso(data.totalRevenue)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <h4>PART II: EXPENDITURES</h4>
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th className="center">No. of Entries</th>
                                <th className="right">Total Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.expenditures.length === 0 ? (
                                <tr><td colSpan="3" className="center empty-row">No expenditures recorded for this period.</td></tr>
                            ) : (
                                data.expenditures.map((e, index) => (
                                    <tr key={index}>
                                        <td>{e.source}</td>
                                        <td className="center">{e.entry_count}</td>
                                        <td className="right">{formatPeso(e.total_amount)}</td>
                                    </tr>
                                ))
                            )}
                            <tr className="total-row">
                                <td colSpan="2">TOTAL EXPENDITURES</td>
                                <td className="right">{formatPeso(data.totalExpenditure)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="report-summary-box">
                        <div className="summary-line">
                            <span>NET INCOME (Revenue - Expenditures):</span>
                            <strong>{formatPeso(data.netIncome)}</strong>
                        </div>
                    </div>
                    
                    <div className="print-footer">
                        <div className="signature-block">
                            <p>Prepared by:</p>
                            <div className="signature-line"></div>
                            <p className="signature-name">Barangay Treasurer</p>
                        </div>
                        <div className="signature-block">
                            <p>Approved by:</p>
                            <div className="signature-line"></div>
                            <p className="signature-name">Barangay Captain</p>
                        </div>
                    </div>

                    <div className="print-timestamp">
                        Generated on: {new Date().toLocaleString()}
                    </div>
                </div>
            )}
        </div>
    );
}