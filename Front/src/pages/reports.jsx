import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import BackButton from "../components/back_button";
import sealLogo from "../assets/barangay-malagasang-logo.jpg";
import "../styles/reports.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost/Capstone/Back/endpoints/";
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function Reports() {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [downloadFeedback, setDownloadFeedback] = useState("");
    const reportRef = useRef(null);
    const formatPeso = (value) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
    const years = Array.from({ length: 6 }, (_, index) => new Date().getFullYear() - index);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const response = await axios.get(`${API_URL}reports/financial_report.php?month=${month}&year=${year}`, { withCredentials: true });
            if (!response.data.success) throw new Error(response.data.message || "Unable to load report.");
            setData(response.data);
        } catch (requestError) {
            setError(requestError.response?.data?.message || requestError.message || "Unable to load report.");
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        const timer = setTimeout(fetchReport, 0);
        return () => clearTimeout(timer);
    }, [fetchReport]);

    const downloadReport = async () => {
        setDownloadFeedback("");
        try {
            if (!reportRef.current) throw new Error("Report is not available for download.");
            const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
            const margin = 36;
            const width = pdf.internal.pageSize.getWidth() - margin * 2;
            await pdf.html(reportRef.current, {
                margin: [margin, margin, margin, margin],
                autoPaging: "text",
                width,
                windowWidth: 800,
                html2canvas: { scale: width / 800, useCORS: true, letterRendering: true, scrollY: 0, scrollX: 0 }
            });
            pdf.save(`financial-report-${months[month - 1].toLowerCase()}-${year}.pdf`);
            setDownloadFeedback("Report downloaded.");
        } catch {
            setDownloadFeedback("Unable to download report. Please try again.");
        }
    };

    const rows = (items, empty, render) => items.length ? items.map(render) : <tr><td colSpan="5" className="center empty-row">{empty}</td></tr>;

    return (
        <div className="reports-page">
            <BackButton />
            <header className="reports-header">
                <div><h1>Financial Reports</h1><p>Monthly cash activity and annual budget reference</p></div>
                <div className="report-actions">
                    <select value={month} onChange={(event) => setMonth(Number(event.target.value))}>{months.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select>
                    <select value={year} onChange={(event) => setYear(Number(event.target.value))}>{years.map((value) => <option key={value} value={value}>{value}</option>)}</select>
                    <button className="btn-print" onClick={() => window.print()}>Print Report</button>
                    <button className="btn-download" onClick={downloadReport} disabled={!data}>Download Report</button>
                </div>
            </header>
            {loading && <p>Loading report...</p>}
            {error && <p className="report-error">{error}</p>}
            {downloadFeedback && <p className="report-feedback">{downloadFeedback}</p>}
            {!loading && data && <div className="report-document" ref={reportRef}>
                <div className="print-header">
                    <div className="print-header-left"><p>Republic of the Philippines</p><p>Province of Cavite</p><p>City of Imus</p><h2>BARANGAY MALAGASANG II-A</h2><p>Office of the Barangay Treasurer</p></div>
                    <img src={sealLogo} alt="Barangay Seal" className="print-logo" />
                    <div className="print-header-right"><p>Monthly Financial Report</p><p>For {months[month - 1]} {year}</p></div>
                </div>
                <div className="print-divider" />

                <h4>PART I: ANNUAL BUDGET REFERENCE</h4>
                <table className="report-table"><thead><tr><th>Source</th><th className="center">Entries</th><th className="right">Amount</th></tr></thead><tbody>
                    {rows(data.annualRevenues, "No annual budget records.", (row) => <tr key={row.source}><td>{row.source}</td><td className="center">{row.entry_count}</td><td className="right">{formatPeso(row.total_amount)}</td></tr>)}
                    <tr className="total-row"><td colSpan="2">TOTAL ANNUAL APPROVED BUDGET</td><td className="right">{formatPeso(data.annualIncome.total_annual_income)}</td></tr>
                </tbody></table>

                <h4>PART II: MONTHLY FUND RECEIPTS</h4>
                <table className="report-table"><thead><tr><th>Receipt Date</th><th>Source</th><th className="right">Amount</th></tr></thead><tbody>
                    {rows(data.monthlyReceipts, "No monthly receipts recorded.", (row) => <tr key={row.id}><td>{row.receipt_date}</td><td>{row.source}</td><td className="right">{formatPeso(row.amount)}</td></tr>)}
                    <tr className="total-row"><td colSpan="2">TOTAL RECEIPTS ({data.monthlyReceipts.length})</td><td className="right">{formatPeso(data.totalMonthlyReceipts)}</td></tr>
                </tbody></table>

                <h4>PART III: MONTHLY ALLOCATION ACTIVITY</h4>
                <table className="report-table"><thead><tr><th>Receipt / Dates</th><th>Category / Budget Item</th><th className="right">Allocated</th></tr></thead><tbody>
                    {rows(data.monthlyAllocations, "No allocations recorded.", (row) => <tr key={row.id}><td>{row.receipt_source} ({row.receipt_date})<br />Allocated: {row.allocation_date}</td><td>{row.category_name} / {row.subcategory_name}</td><td className="right">{formatPeso(row.amount)}</td></tr>)}
                    <tr className="total-row"><td colSpan="2">TOTAL ALLOCATED THIS MONTH</td><td className="right">{formatPeso(data.totalMonthlyAllocated)}</td></tr>
                </tbody></table>
                <div className="report-summary-box"><div className="summary-line"><span>UNALLOCATED RECEIPTS:</span><strong>{formatPeso(data.outstandingUnallocated)}</strong></div><div className="summary-line"><span>REMAINING ALLOCATIONS:</span><strong>{formatPeso(data.remainingAllocated)}</strong></div></div>

                <h4>PART IV: MONTHLY EXPENDITURES</h4>
                <table className="report-table"><thead><tr><th>Category / Budget Item</th><th className="center">Entries</th><th className="right">Amount</th></tr></thead><tbody>
                    {rows(data.expenditureBreakdown, "No expenditures recorded.", (row, index) => <tr key={`${row.category_name}-${row.subcategory_name}-${index}`}><td>{row.category_name} / {row.subcategory_name}</td><td className="center">{row.entry_count}</td><td className="right">{formatPeso(row.total_amount)}</td></tr>)}
                    <tr className="total-row"><td colSpan="2">TOTAL EXPENDITURES</td><td className="right">{formatPeso(data.totalExpenditure)}</td></tr>
                </tbody></table>
                <p>Monthly-linked: {formatPeso(data.monthlyLinkedExpenditure)} · Legacy/non-monthly-linked: {formatPeso(data.legacyExpenditure)}</p>

                <h4>PART V: ALLOCATION UTILIZATION</h4>
                <table className="report-table"><thead><tr><th>Receipt / Allocation Date</th><th>Category / Budget Item</th><th className="right">Allocated</th><th className="right">Spent</th><th className="right">Remaining</th></tr></thead><tbody>
                    {rows(data.allocationUtilization, "No allocation history for this year.", (row) => <tr key={row.id}><td>{row.receipt_source} ({row.receipt_date})<br />{row.allocation_date}</td><td>{row.category_name} / {row.subcategory_name}</td><td className="right">{formatPeso(row.amount)}</td><td className="right">{formatPeso(row.expenditure_amount)}</td><td className="right">{formatPeso(row.remaining_amount)}</td></tr>)}
                </tbody></table>

                <div className="report-summary-box"><div className="summary-line"><span>RECEIPTS LESS EXPENDITURES:</span><strong>{formatPeso(data.netIncome)}</strong></div></div>
                <div className="print-footer"><div className="signature-block"><p>Prepared by:</p><div className="signature-line" /><p className="signature-name">Barangay Treasurer</p></div><div className="signature-block"><p>Approved by:</p><div className="signature-line" /><p className="signature-name">Barangay Captain</p></div></div>
                <div className="print-timestamp">Generated on: {new Date().toLocaleString()}</div>
            </div>}
        </div>
    );
}
