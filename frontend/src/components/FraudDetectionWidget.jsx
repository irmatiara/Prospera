import React, { useState, useEffect, useRef } from 'react';
import { getAnomalies, resolveAnomaly, formatError } from '../utils/api';
import { formatRupiah } from '../utils/format';

function FraudDetectionWidget() {
    const [anomalies, setAnomalies] = useState({ timeAnomalies: [], priceAnomalies: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('open'); // 'open' or 'history'
    const [actionLoading, setActionLoading] = useState(false);

    const [activeResolution, setActiveResolution] = useState({
        ticket_id: null,
        status: null,
        note: '',
        error: null
    });


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

    const openResolveDialog = (ticket_id, status) => {
        setActiveResolution({
            ticket_id,
            status,
            note: '', 
            error: null
        });
    };

    const submitResolve = async () => {
        if (activeResolution.note.trim() === '') {
            setActiveResolution(prev => ({ ...prev, error: "Catatan tidak boleh kosong atau hanya spasi!" }));
            return;
        }

        try {
            setActionLoading(true);
            setActiveResolution(prev => ({ ...prev, error: null }));
            await resolveAnomaly({ 
                ticket_id: activeResolution.ticket_id, 
                status: activeResolution.status, 
                resolution_note: activeResolution.note.trim() 
            });
            await fetchAnomalies();
            window.dispatchEvent(new Event('fraudDataUpdated'));
            setActiveResolution({ ticket_id: null, status: null, note: '', error: null }); 
        } catch (err) {
            setActiveResolution(prev => ({ ...prev, error: formatError(err) })); 
        } finally {
            setActionLoading(false);
        }
    };

    if (loading && !actionLoading) {
        return <div className="card shadow-sm mb-4"><div className="card-body">Memuat data deteksi anomali...</div></div>;
    }

    if (error) {
        return <div className="alert alert-danger mb-4">{error}</div>;
    }

    const filterByStatus = (arr, isOpen) => {
        return arr.filter(item => isOpen ? item.status === 'OPEN' : item.status !== 'OPEN');
    };

    const openTimeAnomalies = filterByStatus(anomalies.timeAnomalies, true);
    const openPriceAnomalies = filterByStatus(anomalies.priceAnomalies, true);
    const historyTimeAnomalies = filterByStatus(anomalies.timeAnomalies, false).slice(0, 15);
    const historyPriceAnomalies = filterByStatus(anomalies.priceAnomalies, false).slice(0, 15);

    const hasOpenAnomalies = openTimeAnomalies.length > 0 || openPriceAnomalies.length > 0;
    const hasHistoryAnomalies = historyTimeAnomalies.length > 0 || historyPriceAnomalies.length > 0;

    const totalOpenLoss = openPriceAnomalies.reduce((sum, item) => {
        const loss = item.capital_cost - item.selling_price;
        return sum + (loss > 0 ? loss * (item.quantity || 1) : 0);
    }, 0);

    const renderEmptyState = (isOpen) => (
        <div className="text-center py-5">
            <div className="mb-3">
                <i className={`fas ${isOpen ? 'fa-shield-check text-success' : 'fa-folder-open text-muted'} fa-3x`}></i>
            </div>
            <h6 className="fw-bold">{isOpen ? 'Semua Aman!' : 'Belum Ada Riwayat'}</h6>
            <p className="text-muted small">
                {isOpen 
                    ? 'Sistem memantau 24/7. Tidak ditemukan bendera merah yang belum diselesaikan.' 
                    : 'Belum ada tiket anomali yang diselesaikan atau diabaikan.'}
            </p>
        </div>
    );

    const renderTimeTable = (data, isOpen) => (
        <div className="mb-4">
            <h6 className="fw-bold text-body mb-3"><i className="fas fa-clock text-warning me-2"></i>Anomali Waktu (Aktivitas di Luar Jam)</h6>
            <div style={{ maxHeight: "350px", overflowY: "auto", paddingRight: "5px", display: "flex", flexDirection: "column" }}>
                {data.map((item, idx) => (
                    <React.Fragment key={item.ticket_id}>
                        <div className="mb-3 p-3 rounded bg-body shadow-sm border border-warning border-opacity-50">
                            <div className="d-flex justify-content-between mb-2 pb-2 border-bottom">
                                <div>
                                    <div className="fw-semibold text-body mb-1">#{item.transaction_id}</div>
                                    <div className="small text-muted">{new Date(item.datetime).toLocaleDateString('id-ID')}</div>
                                </div>
                                <div className="text-end">
                                    <div className="text-danger small fw-bold">
                                        {new Intl.DateTimeFormat('id-ID', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                            timeZoneName: 'short'
                                        }).format(new Date(item.datetime))}
                                    </div>
                                    <div className="small text-muted mt-1">Kasir: {item.cashier}</div>
                                </div>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mt-2">
                                <div>
                                    <small className="text-muted d-block" style={{fontSize: "11px"}}>Keterangan</small>
                                    <span className="text-muted small">{item.reason}</span>
                                </div>
                                <div>
                                    {isOpen ? (
                                        <div className="d-flex gap-2">
                                            <button onClick={() => openResolveDialog(item.ticket_id, 'DISMISSED')} className="btn btn-sm btn-outline-secondary fw-semibold" disabled={actionLoading}>
                                                <i className="fas fa-eye-slash me-1"></i> Wajar
                                            </button>
                                            <button onClick={() => openResolveDialog(item.ticket_id, 'RESOLVED')} className="btn btn-sm btn-outline-primary fw-semibold" disabled={actionLoading}>
                                                <i className="fas fa-check me-1"></i> Selesai
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-end">
                                            <span className={`badge ${item.status === 'RESOLVED' ? 'bg-success' : 'bg-secondary'} mb-1 d-inline-block`}>
                                                {item.status}
                                            </span>
                                            <div className="small text-muted">Oleh: {item.resolved_by || 'Sistem'}</div>
                                            <div className="small text-muted fst-italic">"{item.resolution_note}"</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        {activeResolution.ticket_id === item.ticket_id && (
                            <div className="mb-3 p-3 bg-secondary bg-opacity-10 rounded border-start border-primary border-4 shadow-sm ms-3">
                                <div className="d-flex flex-column gap-2">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <label className="form-label text-primary small fw-bold mb-0">
                                            <i className="fas fa-edit me-1"></i>Catatan Resolusi ({activeResolution.status})
                                        </label>
                                        <button type="button" className="btn-close btn-sm" onClick={() => setActiveResolution({ ticket_id: null })} disabled={actionLoading}></button>
                                    </div>
                                    {activeResolution.error && (
                                        <div className="alert alert-danger small py-1 mb-0"><i className="fas fa-exclamation-circle me-1"></i>{activeResolution.error}</div>
                                    )}
                                    <textarea 
                                        className="form-control form-control-sm" 
                                        rows="2" 
                                        autoFocus
                                        placeholder="Ketik penjelasan di sini..."
                                        value={activeResolution.note}
                                        onChange={(e) => setActiveResolution(prev => ({ ...prev, note: e.target.value }))}
                                        disabled={actionLoading}
                                    ></textarea>
                                    <div className="d-flex justify-content-end gap-2 mt-1">
                                        <button type="button" className="btn btn-sm btn-light border fw-semibold" onClick={() => setActiveResolution({ ticket_id: null })} disabled={actionLoading}>Batal</button>
                                        <button type="button" className="btn btn-sm btn-primary fw-semibold" onClick={submitResolve} disabled={actionLoading}>
                                            {actionLoading ? <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>Simpan...</> : 'Simpan Catatan'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );

    const renderPriceTable = (data, isOpen) => (
        <div className="mb-4">
            <h6 className="fw-bold text-body mb-3"><i className="fas fa-tags text-danger me-2"></i>Anomali Harga (Jual Rugi / Margin Tipis)</h6>
            <div style={{ maxHeight: "350px", overflowY: "auto", paddingRight: "5px", display: "flex", flexDirection: "column" }}>
                {data.map((item, idx) => (
                    <React.Fragment key={item.ticket_id}>
                        <div className="mb-3 p-3 rounded bg-body shadow-sm border border-danger border-opacity-50">
                            <div className="d-flex justify-content-between mb-2 pb-2 border-bottom">
                                <div>
                                    <div className="fw-semibold text-body mb-1">#{item.transaction_id} - {item.product}</div>
                                    <div className="small text-muted">Kasir: {item.cashier}</div>
                                </div>
                                <div className="text-end">
                                    <span className="badge bg-danger mb-1">Margin: {item.margin_percentage}%</span>
                                </div>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mt-2">
                                <div className="d-flex gap-4">
                                    <div>
                                        <small className="text-muted d-block" style={{fontSize: "11px"}}>Harga Jual</small>
                                        <span className="fw-bold text-danger">{formatRupiah(item.selling_price)}</span>
                                    </div>
                                    <div>
                                        <small className="text-muted d-block" style={{fontSize: "11px"}}>Modal</small>
                                        <span className="text-muted small">{formatRupiah(item.capital_cost)}</span>
                                    </div>
                                </div>
                                <div>
                                    {isOpen ? (
                                        <div className="d-flex gap-2">
                                            <button onClick={() => openResolveDialog(item.ticket_id, 'DISMISSED')} className="btn btn-sm btn-outline-secondary fw-semibold" disabled={actionLoading}>
                                                <i className="fas fa-eye-slash me-1"></i> Wajar
                                            </button>
                                            <button onClick={() => openResolveDialog(item.ticket_id, 'RESOLVED')} className="btn btn-sm btn-outline-primary fw-semibold" disabled={actionLoading}>
                                                <i className="fas fa-check me-1"></i> Selesai
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-end">
                                            <span className={`badge ${item.status === 'RESOLVED' ? 'bg-success' : 'bg-secondary'} mb-1 d-inline-block`}>
                                                {item.status}
                                            </span>
                                            <div className="small text-muted">Oleh: {item.resolved_by || 'Sistem'}</div>
                                            <div className="small text-muted fst-italic">"{item.resolution_note}"</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-2 text-muted small border-top pt-2 mt-2">
                                <i className="fas fa-info-circle me-1"></i>{item.reason}
                            </div>
                        </div>
                        {activeResolution.ticket_id === item.ticket_id && (
                            <div className="mb-3 p-3 bg-secondary bg-opacity-10 rounded border-start border-primary border-4 shadow-sm ms-3">
                                <div className="d-flex flex-column gap-2">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <label className="form-label text-primary small fw-bold mb-0">
                                            <i className="fas fa-edit me-1"></i>Catatan Resolusi ({activeResolution.status})
                                        </label>
                                        <button type="button" className="btn-close btn-sm" onClick={() => setActiveResolution({ ticket_id: null })} disabled={actionLoading}></button>
                                    </div>
                                    {activeResolution.error && (
                                        <div className="alert alert-danger small py-1 mb-0"><i className="fas fa-exclamation-circle me-1"></i>{activeResolution.error}</div>
                                    )}
                                    <textarea 
                                        className="form-control form-control-sm" 
                                        rows="2" 
                                        autoFocus
                                        placeholder="Ketik penjelasan di sini..."
                                        value={activeResolution.note}
                                        onChange={(e) => setActiveResolution(prev => ({ ...prev, note: e.target.value }))}
                                        disabled={actionLoading}
                                    ></textarea>
                                    <div className="d-flex justify-content-end gap-2 mt-1">
                                        <button type="button" className="btn btn-sm btn-light border fw-semibold" onClick={() => setActiveResolution({ ticket_id: null })} disabled={actionLoading}>Batal</button>
                                        <button type="button" className="btn btn-sm btn-primary fw-semibold" onClick={submitResolve} disabled={actionLoading}>
                                            {actionLoading ? <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>Simpan...</> : 'Simpan Catatan'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );

    return (
        <div className="mb-4">
            {/* The Trigger Card */}
            {hasOpenAnomalies ? (
                <div 
                    className="card border-0 shadow-sm rounded-4 p-3 d-flex flex-row justify-content-between align-items-center card-hover-effect" 
                    style={{ cursor: 'pointer' }}
                    data-bs-toggle="modal" 
                    data-bs-target="#FraudModal"
                >
                    <div>
                        <div className="fw-bold text-body mb-1">To-Do: Resolusi Anomali</div>
                        {totalOpenLoss > 0 ? (
                            <div className="h4 fw-bold text-danger m-0">{formatRupiah(totalOpenLoss)}</div>
                        ) : (
                            <div className="h5 fw-bold text-warning m-0">{openTimeAnomalies.length} Kasus Waktu</div>
                        )}
                        <div className="text-muted small mt-1">Klik untuk menindaklanjuti</div>
                    </div>
                    <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex justify-content-center align-items-center" style={{width: '45px', height: '45px'}}>
                        <i className="fas fa-exclamation-triangle fs-5"></i>
                    </div>
                </div>
            ) : (
                <div 
                    className="card border-0 shadow-sm rounded-4 p-3 d-flex flex-row justify-content-between align-items-center card-hover-effect" 
                    style={{ cursor: 'pointer' }}
                    data-bs-toggle="modal" 
                    data-bs-target="#FraudModal"
                >
                    <div>
                        <div className="fw-bold text-body mb-1">Deteksi Anomali / Fraud</div>
                        <div className="h5 fw-bold text-success m-0">Aman & Terkendali</div>
                        <div className="text-muted small mt-1">Klik untuk melihat riwayat audit</div>
                    </div>
                    <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex justify-content-center align-items-center" style={{width: '45px', height: '45px'}}>
                        <i className="fas fa-shield-alt fs-5"></i>
                    </div>
                </div>
            )}

            {/* The Modal */}
            <div className="modal fade" id="FraudModal" aria-labelledby="FraudModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content border-0 shadow">
                        <div className="modal-header bg-primary text-white border-0">
                            <h5 className="modal-title fw-bold" id="FraudModalLabel">
                                <i className="fas fa-siren-on me-2"></i>Audit Trail & Resolusi Red Flags
                            </h5>
                            <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        
                        {/* Tabs Navigation */}
                        <div className="bg-body-secondary border-bottom px-4 pt-3">
                            <ul className="nav nav-tabs border-0" role="tablist">
                                <li className="nav-item" role="presentation">
                                    <button 
                                        className={`nav-link fw-bold border-0 ${activeTab === 'open' ? 'active text-primary bg-body border-top border-start border-end rounded-top' : 'text-muted'}`}
                                        onClick={() => setActiveTab('open')}
                                    >
                                        <i className="fas fa-exclamation-circle me-2"></i>
                                        Butuh Perhatian 
                                        {hasOpenAnomalies && <span className="badge bg-danger ms-2">{openTimeAnomalies.length + openPriceAnomalies.length}</span>}
                                    </button>
                                </li>
                                <li className="nav-item" role="presentation">
                                    <button 
                                        className={`nav-link fw-bold border-0 ${activeTab === 'history' ? 'active text-primary bg-body border-top border-start border-end rounded-top' : 'text-muted'}`}
                                        onClick={() => setActiveTab('history')}
                                    >
                                        <i className="fas fa-history me-2"></i>
                                        Riwayat Audit
                                    </button>
                                </li>
                            </ul>
                        </div>

                        <div className="modal-body p-4 bg-body-tertiary">
                            {activeTab === 'open' ? (
                                <>
                                    {!hasOpenAnomalies && renderEmptyState(true)}
                                    {openTimeAnomalies.length > 0 && renderTimeTable(openTimeAnomalies, true)}
                                    {openPriceAnomalies.length > 0 && renderPriceTable(openPriceAnomalies, true)}
                                </>
                            ) : (
                                <>
                                    {!hasHistoryAnomalies && renderEmptyState(false)}
                                    {historyTimeAnomalies.length > 0 && renderTimeTable(historyTimeAnomalies, false)}
                                    {historyPriceAnomalies.length > 0 && renderPriceTable(historyPriceAnomalies, false)}
                                </>
                            )}
                        </div>
                        
                        <div className="modal-footer border-top bg-body">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}

export default FraudDetectionWidget;
