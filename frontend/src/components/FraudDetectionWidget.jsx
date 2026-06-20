import React, { useState, useEffect } from 'react';
import { getAnomalies, formatError } from '../utils/api';
import { formatRupiah } from '../utils/format';

function FraudDetectionWidget() {
    const [anomalies, setAnomalies] = useState({ timeAnomalies: [], priceAnomalies: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {
        fetchAnomalies();
    }, []);

    const fetchAnomalies = async () => {
        try {
            setLoading(true);
            const data = await getAnomalies();
            setAnomalies(data);
            setError(null);
        } catch (err) {
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="card shadow-sm mb-4"><div className="card-body">Memuat data deteksi anomali...</div></div>;
    }

    if (error) {
        return <div className="alert alert-danger mb-4">{error}</div>;
    }

    const hasAnomalies = anomalies.timeAnomalies.length > 0 || anomalies.priceAnomalies.length > 0;

    if (!hasAnomalies) {
        return (
            <div className="card shadow-sm border-start border-success border-4 mb-4">
                <div className="card-body">
                    <h5 className="card-title text-success fw-bold mb-0">
                        <i className="fas fa-shield-check me-2"></i>Fraud Detection Aktif
                    </h5>
                    <p className="text-muted small mt-2 mb-0">Sistem memantau 24/7. Tidak ditemukan aktivitas mencurigakan pada transaksi 30 hari terakhir.</p>
                </div>
            </div>
        );
    }

    // Hitung total kerugian dari priceAnomalies
    const totalLoss = anomalies.priceAnomalies.reduce((sum, item) => {
        const loss = item.capital_cost - item.selling_price;
        return sum + (loss > 0 ? loss * (item.quantity || 1) : 0);
    }, 0);

    return (
        <div className="mb-4">
            {/* The Trigger Card */}
            <div 
                className="card border-0 shadow-sm rounded-4 p-3 d-flex flex-row justify-content-between align-items-center card-hover-effect" 
                style={{ cursor: 'pointer' }}
                data-bs-toggle="modal" 
                data-bs-target="#FraudModal"
            >
                <div>
                    <div className="fw-bold text-dark mb-1">Deteksi Anomali / Fraud</div>
                    {totalLoss > 0 ? (
                        <div className="h4 fw-bold text-danger m-0">{formatRupiah(totalLoss)}</div>
                    ) : (
                        <div className="h5 fw-bold text-warning m-0">{anomalies.timeAnomalies.length} Peringatan Waktu</div>
                    )}
                    <div className="text-muted small mt-1">Klik untuk melihat detail anomali</div>
                </div>
                <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex justify-content-center align-items-center" style={{width: '45px', height: '45px'}}>
                    <i className="fas fa-exclamation-triangle fs-5"></i>
                </div>
            </div>

            {/* The Modal */}
            <div className="modal fade" id="FraudModal" tabIndex="-1" aria-labelledby="FraudModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content border-0 shadow">
                        <div className="modal-header bg-primary text-white border-0">
                            <h5 className="modal-title fw-bold" id="FraudModalLabel">
                                <i className="fas fa-siren-on me-2"></i>Rincian Red Flags (30 Hari Terakhir)
                            </h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body p-4">
                            {anomalies.timeAnomalies.length > 0 && (
                                <div className="mb-4">
                                    <h6 className="fw-bold text-dark"><i className="fas fa-clock text-warning me-2"></i>Anomali Waktu (Aktivitas di Luar Jam)</h6>
                                    <div className="table-responsive">
                                        <table className="table table-sm table-hover align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>ID Transaksi</th>
                                                    <th>Waktu</th>
                                                    <th>Kasir</th>
                                                    <th>Keterangan</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {anomalies.timeAnomalies.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td>#{item.transaction_id}</td>
                                                        <td>
                                                            <div className="fw-semibold">{new Date(item.datetime).toLocaleDateString('id-ID')}</div>
                                                            <div className="text-danger small fw-bold">{item.time}</div>
                                                        </td>
                                                        <td>{item.cashier}</td>
                                                        <td className="text-muted small">{item.reason}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {anomalies.priceAnomalies.length > 0 && (
                                <div>
                                    <h6 className="fw-bold text-dark"><i className="fas fa-tags text-danger me-2"></i>Anomali Harga (Jual Rugi / Margin Tipis)</h6>
                                    <div className="table-responsive">
                                        <table className="table table-sm table-hover align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>ID Transaksi / Kasir</th>
                                                    <th>Produk</th>
                                                    <th>Harga Modal</th>
                                                    <th>Harga Jual</th>
                                                    <th>Keterangan</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {anomalies.priceAnomalies.map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td>
                                                            <div className="fw-semibold">#{item.transaction_id}</div>
                                                            <div className="small text-muted">{item.cashier}</div>
                                                        </td>
                                                        <td>{item.product}</td>
                                                        <td>{formatRupiah(item.capital_cost)}</td>
                                                        <td>
                                                            <span className="text-danger fw-bold">{formatRupiah(item.selling_price)}</span>
                                                        </td>
                                                        <td>
                                                            <span className="badge bg-danger">Margin: {item.margin_percentage}%</span>
                                                            <div className="text-muted small mt-1">{item.reason}</div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer border-top bg-light">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FraudDetectionWidget;
