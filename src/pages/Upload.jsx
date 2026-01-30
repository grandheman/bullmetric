import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTrades } from '../context/TradeContext';
import { parseExcelData } from '../utils/excelParser';
import { uploadTrades } from '../services/tradeService';
import { Upload as UploadIcon, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import './Upload.css';

export default function UploadPage() {
    const { currentUser } = useAuth();
    const { refreshTrades } = useTrades();
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: string }

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.csv'))) {
            processFile(droppedFile);
        } else {
            setStatus({ type: 'error', message: 'Please upload a valid .xlsx or .csv file.' });
        }
    }, []);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) processFile(selectedFile);
    };

    const processFile = async (fileObj) => {
        setFile(fileObj);
        setStatus(null);
        try {
            const data = await parseExcelData(fileObj);
            setParsedData(data);
            setStatus({ type: 'success', message: `Parsed ${data.length} trades successfully. Ready to upload.` });
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: 'Failed to parse file. Check format.' });
        }
    };

    const handleUpload = async () => {
        if (!currentUser || parsedData.length === 0) return;

        setUploading(true);
        try {
            await uploadTrades(parsedData, currentUser.uid);
            await refreshTrades(); // Refresh global trade state
            setStatus({ type: 'success', message: 'Trades uploaded successfully to Firestore!' });
            setParsedData([]);
            setFile(null);
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', message: 'Upload failed: ' + err.message });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="upload-page">
            <div className="upload-header">
                <h1>Upload Data</h1>
                <p>Import your weekly trade reports.</p>
            </div>

            <div
                className={`dropzone ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    id="file-upload"
                    className="file-input"
                    onChange={handleFileSelect}
                    accept=".xlsx,.csv"
                />
                <label htmlFor="file-upload" className="dropzone-content">
                    {file ? (
                        <FileSpreadsheet size={48} className="text-primary" />
                    ) : (
                        <UploadIcon size={48} color="var(--text-color)" style={{ opacity: 0.5 }} />
                    )}
                    <h3>{file ? file.name : "Drag & Drop or Click to Upload"}</h3>
                    <p className="hint">Supports .xlsx and .csv</p>
                </label>
            </div>

            {status && (
                <div className={`status-message ${status.type}`}>
                    {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span>{status.message}</span>
                </div>
            )}

            {parsedData.length > 0 && (
                <div className="preview-section">
                    <div className="preview-header">
                        <h3>Preview ({parsedData.length} trades)</h3>
                        <button
                            className="upload-btn"
                            onClick={handleUpload}
                            disabled={uploading}
                        >
                            {uploading ? 'Uploading...' : 'Confirm Upload'}
                        </button>
                    </div>
                    <div className="table-wrapper">
                        <table className="preview-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Platform</th>
                                    <th>Symbol</th>
                                    <th>Type</th>
                                    <th>PnL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parsedData.slice(0, 5).map((row, i) => (
                                    <tr key={i}>
                                        <td>{row.date}</td>
                                        <td>{row.platform}</td>
                                        <td>{row.symbol}</td>
                                        <td>{row.type}</td>
                                        <td style={{ color: row.pnl >= 0 ? 'var(--secondary-color)' : 'var(--danger-color)' }}>
                                            {row.pnl}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {parsedData.length > 5 && <p className="more-text">...and {parsedData.length - 5} more</p>}
                    </div>
                </div>
            )}
        </div>
    );
}
