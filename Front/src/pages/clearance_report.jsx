import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import BackButton from "../components/back_button";
import sealLogo from "../assets/barangay-malagasang-logo.jpg"; 
import "../styles/reports.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";

export default function ClearanceReport() {
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
            const res = await axios.get(`${API_URL}reports/clearance_report.php?month=${month}&year=${year}`, {
                withCredentials: true
            });
            if (res.data.success) {
                setData(res.data);
            } else {
                setError(res.data.message || "Unable to load report.");
            }
        } catch (error) {
            setError(error.response?.data?.message || "Unable to load report.");
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        const reportFetch = setTimeout(fetchReport, 0);
        return () => clearTimeout(reportFetch);
    }, [fetchReport]);

    const downloadReport = async () => {
        setDownloadFeedback("");
        try {
            if (!reportRef.current) throw new Error("Report is not available.");
            const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            
            await pdf.html(reportRef.current, {
                x: 0, y: 0, width: pdfWidth, windowWidth: 1024, autoPaging: "text",
                html2canvas: { scale: 0.25, useCORS: true, logging: false, scrollY: 0 },
                margin: [10, 10, 10, 10],
                callback: function (doc) {
                    doc.save(`clearance-report-${months[month - 1].toLowerCase()}-${year}.pdf`);
                }
            });
            setDownloadFeedback("Report downloaded.");
        } catch (downloadError) {
            setDownloadFeedback("Unable to download report. Please try again.");
        }
    };

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const years = Array.from({ length: 6 }, (_, index) => new Date().getFullYear() - index);

    return (
        <div className="reports-page">
            <BackButton />
            
            <header className="reports-header">
                <div>
                    <h1>Clearance Reports</h1>
                    <p>Generate monthly clearance tally</p>
                </div>
                <div className="report-actions">
                    <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                        {months.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                    </select>
                    <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                        {years.map((reportYear) => <option key={reportYear} value={reportYear}>{reportYear}</option>)}
                    </select>
                    <button className="btn-print" onClick={() => window.print()}>Print Report</button>
                    <button className="btn-download" onClick={downloadReport} disabled={!data}>Download PDF</button>
                </div>
            </header>

            {loading && <p>Loading report...</p>}
            {error && <p className="report-error">{error}</p>}
            {downloadFeedback && <p className="report-feedback">{downloadFeedback}</p>}

            {!loading && data && (
                <div className="report-document" ref={reportRef} style={{ width: '100%', maxWidth: '800px', margin: '0 auto' }}>
                    <div className="print-header">
                        <div className="print-header-left">
                            <p>Republic of the Philippines</p>
                            <p>Province of Cavite</p>
                            <p>City of Imus</p>
                            <h2>BARANGAY MALAGASANG II-A</h2>
                            <p>Office of the Punong Barangay</p>
                        </div>
                        <img src={sealLogo} alt="Barangay Seal" className="print-logo" />
                        <div className="print-header-right">
                            <p>Monthly Clearance Summary</p>
                            <p>For the Month of {months[month - 1]} {year}</p>
                        </div>
                    </div>

                    <div className="print-divider"></div>

                    <h4>CLEARANCES ISSUED</h4>
                    <table className="report-table">
                        <thead>
                            <tr>
                                <th>Clearance Type</th>
                                <th className="center">No. of Issued</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(!data.clearances || data.clearances.length === 0) ? (
                                <tr><td colSpan="2" className="center empty-row">No clearances issued for this period.</td></tr>
                            ) : (
                                data.clearances.map((c, index) => (
                                    <tr key={index}>
                                        <td>{c.clearance_type}</td>
                                        <td className="center">{c.count}</td>
                                    </tr>
                                ))
                            )}
                            <tr className="total-row">
                                <td>TOTAL CLEARANCES</td>
                                <td className="center">{data.totalClearances}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <div className="print-footer">
                        <div className="signature-block">
                            <p>Prepared by:</p>
                            <div className="signature-line"></div>
                            <p className="signature-name">Barangay Staff</p>
                        </div>
                        <div className="signature-block">
                            <p>Approved by:</p>
                            <div className="signature-line"></div>
                            <p className="signature-name">Punong Barangay</p>
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