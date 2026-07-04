import { useState, useEffect } from 'react';
import { apiFetch, formatError } from '../../utils/api';
import { formatRupiah } from '../../utils/format';

export default function ReportModal({ isOpen, onClose, onExport, onExportCsv }) {
    const [period, setPeriod] = useState('TODAY');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [exportingType, setExportingType] = useState(null);
    const [error, setError] = useState('');

    // FIX (BUG-06): Ekstrak kalkulasi tanggal dari 3 fungsi duplikat menjadi 1 fungsi terpusat.
    // SEBELUMNYA: logika TODAY/MONTH/CUSTOM ditulis IDENTIK di fetchSummary, handleExportClick,
    //             dan handleExportCsvClick — jika ada bug diperbaiki di satu tempat, 2 lainnya
    //             tertinggal (maintainability debt).
    // SESUDAH   : resolveReportDates() adalah single source of truth untuk seluruh komponen ini.
    const resolveReportDates = () => {
        const today = new Date();
        if (period === 'TODAY') {
            // Kompensasi offset timezone browser agar tanggal lokal tidak bergeser ke UTC
            const offset = today.getTimezoneOffset() * 60000;
            const localDate = (new Date(today - offset)).toISOString().split('T')[0];
            return { start: localDate, end: localDate };
        }
        if (period === 'MONTH') {
            const year  = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const lastDay = new Date(year, today.getMonth() + 1, 0).getDate();
            return { start: `${year}-${month}-01`, end: `${year}-${month}-${lastDay}` };
        }
        if (period === 'CUSTOM' && startDate && endDate) {
            return { start: startDate, end: endDate };
        }
        // ALL atau CUSTOM dengan tanggal belum lengkap → kembalikan kosong
        return { start: '', end: '' };
    };

    useEffect(() => {
        if (isOpen) {
            fetchSummary();
        }
    }, [isOpen, period, startDate, endDate]);

    const fetchSummary = async () => {
        setLoading(true);
        setError('');
        try {
            // Tunggu kedua tanggal custom sebelum fetch
            if (period === 'CUSTOM' && (!startDate || !endDate)) {
                setLoading(false);
                return;
            }

            const { start, end } = resolveReportDates();

            let url = '/transactions/summary';
            const queryParams = [];
            if (start && end) {
                queryParams.push(`start=${start}`);
                queryParams.push(`end=${end}`);
            }
            if (queryParams.length > 0) url += `?${queryParams.join('&')}`;

            const data = await apiFetch(url);
            setSummary(data);
        } catch (err) {
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleExportClick = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (exportingType !== null) return;
        setExportingType('excel');
        try {
            const { start, end } = resolveReportDates();
            await onExport(start, end);
        } finally {
            setExportingType(null);
        }
    };

    const handleExportCsvClick = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (exportingType !== null) return;
        setExportingType('csv');
        try {
            const { start, end } = resolveReportDates();
            await onExportCsv(start, end);
        } finally {
            setExportingType(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h3 className="modal-title">
                        <i className="fas fa-chart-line" style={{ color: '#4F46E5' }}></i> Rekap Laporan Transaksi
                    </h3>
                    <button className="modal-close" onClick={onClose} title="Tutup">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Filter Section */}
                    <div>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px' }}>Periode Laporan</label>
                        <select 
                            className="input" 
                            style={{ width: '100%', marginBottom: period === 'CUSTOM' ? '12px' : '0' }}
                            value={period} 
                            onChange={(e) => setPeriod(e.target.value)}
                        >
                            <option value="TODAY">Hari Ini</option>
                            <option value="MONTH">Bulan Ini</option>
                            <option value="ALL">Semua Waktu</option>
                            <option value="CUSTOM">Pilih Tanggal Manual...</option>
                        </select>

                        {period === "CUSTOM" && (
                            <div style={{ display: "flex", gap: "12px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: "12px", color: "#6B7280", display: "block", marginBottom: "4px" }}>Dari:</label>
                                    <input type="date" className="input" style={{ width: "100%" }} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: "12px", color: "#6B7280", display: "block", marginBottom: "4px" }}>Sampai:</label>
                                    <input type="date" className="input" style={{ width: "100%" }} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Summary Cards */}
                    <div className="bg-body-secondary border rounded-3 p-3">
                        <h4 className="text-body fw-bold text-center mb-3" style={{ fontSize: '14px' }}>Ringkasan Data</h4>
                        
                        {loading ? (
                            <div className="text-muted text-center p-3">Memuat data...</div>
                        ) : error ? (
                            <div className="text-danger text-center" style={{ fontSize: '14px' }}>{error}</div>
                        ) : summary ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div className="d-flex justify-content-between border-bottom pb-2">
                                    <span className="text-muted">Total Transaksi</span>
                                    <span className="text-body fw-bold">{summary.totalTransactions} TRX</span>
                                </div>
                                <div className="d-flex justify-content-between border-bottom pb-2">
                                    <span className="text-muted">Omzet Penjualan</span>
                                    <span className="fw-bold text-success">{formatRupiah(summary.totalIncome)}</span>
                                </div>
                                <div className="d-flex justify-content-between border-bottom pb-2">
                                    <span className="text-muted">Pengeluaran Restock</span>
                                    <span className="fw-bold text-danger">{formatRupiah(summary.totalRestock)}</span>
                                </div>
                                <div className="d-flex justify-content-between pt-1">
                                    <span className="text-body fw-bold">Estimasi Laba Kotor</span>
                                    <span className="fw-bold" style={{ fontSize: '18px', color: summary.totalProfit >= 0 ? 'var(--bs-success)' : 'var(--bs-danger)' }}>
                                        {formatRupiah(summary.totalProfit)}
                                    </span>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <button 
                            type="button"
                            onClick={handleExportClick}
                            className="button"
                            disabled={exportingType !== null}
                            style={{ 
                                background: "rgba(16, 185, 129, 0.1)", color: "#10B981", border: "1px solid rgba(16, 185, 129, 0.2)", 
                                display: "flex", alignItems: "center", justifyContent: "center", 
                                gap: "8px", padding: "12px", borderRadius: "8px", 
                                fontWeight: "bold", cursor: "pointer", transition: "all 0.2s",
                                width: "100%", fontSize: "16px"
                            }}
                        >
                            <i className="fas fa-file-excel"></i> {exportingType === 'excel' ? 'Memproses...' : 'Export Laporan ke Excel'}
                        </button>
                        
                        <button 
                            type="button"
                            onClick={handleExportCsvClick}
                            className="button"
                            disabled={exportingType !== null}
                            style={{ 
                                background: "rgba(59, 130, 246, 0.1)", color: "#3B82F6", border: "1px solid rgba(59, 130, 246, 0.2)", 
                                display: "flex", alignItems: "center", justifyContent: "center", 
                                gap: "8px", padding: "12px", borderRadius: "8px", 
                                fontWeight: "bold", cursor: "pointer", transition: "all 0.2s",
                                width: "100%", fontSize: "16px"
                            }}
                        >
                            <i className="fas fa-file-csv"></i> {exportingType === 'csv' ? 'Memproses...' : 'Export Laporan ke CSV'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
