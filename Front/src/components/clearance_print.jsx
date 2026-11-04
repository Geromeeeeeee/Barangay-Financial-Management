import sealLogo from "../assets/barangay-malagasang-logo.jpg";
import "../styles/clearance_print.css";

export default function ClearancePrint({ data, onClose }) {
    if (!data) return null;

    const today = new Date().toLocaleDateString('en-PH', { 
        year: 'numeric', month: 'long', day: 'numeric' 
    });

    return (
        <div className="print-modal-overlay">
            <div className="print-actions">
                <button className="btn-print" onClick={() => window.print()}>🖨️ Print / Save as PDF</button>
                <button className="btn-close" onClick={onClose}>✕ Close</button>
            </div>

            <div className="clearance-paper">
                <div className="clearance-header">
                    <img src={sealLogo} alt="Barangay Seal" className="seal" />
                    <div className="header-text">
                        <p>Republic of the Philippines</p>
                        <p>Province of Cavite</p>
                        <p>City of Imus</p>
                        <h2>BARANGAY MALAGASANG II-A</h2>
                        <p>Office of the Punong Barangay</p>
                    </div>
                    <div className="seal-spacer"></div>
                </div>

                <div className="clearance-title">
                    <h1>BARANGAY CLEARANCE</h1>
                </div>

                <div className="clearance-body">
                    <p><strong>TO WHOM IT MAY CONCERN:</strong></p>
                    
                    <p className="indent">
                        This is to certify that <strong><u>{data.resident_name}</u></strong>, 
                        a bona fide resident of Barangay Malagasang II-A, City of Imus, Cavite, 
                        is known to be of good moral character and a law-abiding citizen.
                    </p>

                    <p className="indent">
                        This clearance is issued upon the request of the above-named person 
                        for the purpose of <strong><u>{data.purpose || data.clearance_type}</u></strong>.
                    </p>

                    <p className="indent">
                        Issued this <strong>{today}</strong> at Barangay Malagasang II-A, 
                        City of Imus, Cavite.
                    </p>
                </div>

                <div className="clearance-footer">
                    <div className="signature-block">
                        <p className="signature-name">HON. BARANGAY CAPTAIN</p>
                        <p className="signature-title">Punong Barangay</p>
                    </div>
                    <div className="signature-block">
                        <p className="signature-name">BARANGAY STAFF</p>
                        <p className="signature-title">Prepared by</p>
                    </div>
                </div>

                <div className="clearance-note">
                    <p>Not valid without official seal.</p>
                    <p>Fee Paid: ₱ {data.fee || "50.00"}</p>
                    <p>O.R. No: {data.or_number || "____________"}</p>
                </div>
            </div>
        </div>
    );
}
