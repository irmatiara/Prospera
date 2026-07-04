import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../utils/format';
import { formatDatetime } from '../utils/format';


function PnlContent({ ringkasan }) {
    return (
        <div className="p-4 bg-body" style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, overflowY: "auto" }}>
            <div className="mb-4 p-3 rounded bg-body-secondary border">
                <span className="d-block text-muted mb-1" style={{fontSize: "14px"}}>Total Pendapatan Kotor (Omzet)</span>
                <span className="fw-bold text-body" style={{fontSize: "20px"}}>{formatRupiah(ringkasan.penjualan)}</span>
            </div>
            
            <h6 className="fw-bold text-secondary mb-3"><i className="fas fa-list me-2"></i>Rincian Kalkulasi:</h6>
            <div className="d-flex justify-content-between mb-2">
                <span className="text-muted" style={{fontSize: "16px"}}>Laba Kotor (Untung)</span>
                <span className="fw-bold text-success" style={{fontSize: "16px"}}>+{formatRupiah(ringkasan.labaKotor)}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
                <span className="text-muted" style={{fontSize: "16px"}}>💸 Defisit Markdown <small className="text-muted" style={{fontSize:'11px'}}>(jual di bawah modal)</small></span>
                <span className="fw-bold" style={{fontSize: "16px", color: '#b45309'}}>-{formatRupiah(ringkasan.rugi)}</span>
            </div>
            <div className="d-flex justify-content-between mb-3 pb-3 border-bottom border-2">
                <span className="text-muted" style={{fontSize: "16px"}}>
                    🗑 Kerugian Kedaluwarsa
                    {ringkasan.qtyDestroyed > 0 && (
                        <small className="text-muted ms-2" style={{fontSize: '12px'}}>({ringkasan.qtyDestroyed} unit dimusnahkan)</small>
                    )}
                </span>
                <span className="fw-bold text-warning" style={{fontSize: "16px"}}>-{formatRupiah(ringkasan.spoilage)}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
                <span className="text-muted" style={{fontSize: "14px"}}>Total Kerugian Gabungan</span>
                <span className="fw-bold text-danger" style={{fontSize: "14px"}}>-{formatRupiah(ringkasan.totalLoss)}</span>
            </div>
            <div className="d-flex justify-content-between mt-3">
                <span className="fw-bold text-body" style={{ fontSize: "1.2rem" }}>Total Laba Bersih</span>
                <span className="fw-bold text-primary" style={{ fontSize: "1.2rem" }}>{formatRupiah(ringkasan.labaBersih)}</span>
            </div>
        </div>
    );
}

/**
 * Render tabel berdasarkan tipe modal (loss, profit, transaction)
 */
function TableContent({ type, data, isLoading }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <div className="p-4 bg-body" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                        <div key={`skel-${idx}`} className="mb-3 p-3 rounded bg-body-secondary border placeholder-glow">
                            <div className="d-flex justify-content-between mb-2 border-bottom pb-2">
                                <span className="placeholder col-5 bg-secondary rounded"></span>
                                <span className="placeholder col-3 bg-secondary rounded"></span>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span className="placeholder col-4 bg-secondary rounded"></span>
                                <span className="placeholder col-4 bg-secondary rounded"></span>
                            </div>
                        </div>
                    ))
                ) : type === 'loss' && data.lossProducts.length > 0 ? (
                    data.lossProducts.map((item, idx) => (
                        <div key={idx} className="mb-3 p-3 rounded bg-body-secondary border">
                            <div className="d-flex justify-content-between mb-2 border-bottom pb-2">
                                <span className="fw-bold text-body">{item.product_name}</span>
                                <div>
                                    <small className="text-muted me-1">Total Rugi:</small>
                                    <span className="fw-bold text-danger">-{formatRupiah(item.rugi)}</span>
                                </div>
                            </div>
                            <div className="d-flex justify-content-between text-muted" style={{fontSize: "13px"}}>
                                <span><small>Terjual:</small> <strong className="text-body">{item.sold} unit</strong></span>
                                <span><small>Modal:</small> {formatRupiah(item.modal)} <span className="mx-1">|</span> <small>Jual:</small> {formatRupiah(item.harga_jual)}</span>
                            </div>
                        </div>
                    ))
                ) : type === 'loss' ? (
                    <div className="text-center py-5">
                        <div className="mb-2"><i className="fas fa-check-circle text-success" style={{fontSize: '2rem'}}></i></div>
                        <p className="fw-bold text-success mb-1">Mantap! Tidak ada barang yang dijual rugi.</p>
                    </div>
                ) : type === 'profit' && data.products.length > 0 ? (
                    data.products.map((item, idx) => (
                        <div key={idx} className="mb-3 p-3 rounded bg-body-secondary border">
                            <div className="d-flex justify-content-between mb-2 border-bottom pb-2">
                                <span className="fw-bold text-body">{item.product_name}</span>
                                <div>
                                    <small className="text-muted me-1">Total Laba:</small>
                                    <span className="fw-bold text-success">+{formatRupiah(item.laba)}</span>
                                </div>
                            </div>
                            <div className="d-flex justify-content-between text-muted" style={{fontSize: "13px"}}>
                                <span><small>Terjual:</small> <strong className="text-body">{item.sold} unit</strong></span>
                                <span><small>Omzet:</small> {formatRupiah(item.revenue)} <span className="mx-1">|</span> <small>Margin:</small> <span className="text-primary fw-bold">{item.margin}</span></span>
                            </div>
                        </div>
                    ))
                ) : type === 'profit' ? (
                    <div className="text-center py-5">
                        <p className="text-muted mb-0">Belum ada data penjualan.</p>
                    </div>
                ) : type === 'transaction' ? (
                    <div>
                        <div className="d-flex justify-content-between align-items-center mb-3 p-3 rounded bg-body-secondary border">
                            <span className="fw-bold text-success"><i className="fas fa-check-circle me-2"></i>Berhasil (Success)</span>
                            <div>
                                <small className="text-muted me-2">Total Struk:</small>
                                <span className="fw-bold text-body" style={{fontSize: "16px"}}>{data.status_breakdown?.success || 0}</span>
                            </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-3 p-3 rounded bg-body-secondary border">
                            <span className="fw-bold text-warning"><i className="fas fa-clock me-2"></i>Tertunda (Pending)</span>
                            <div>
                                <small className="text-muted me-2">Total Struk:</small>
                                <span className="fw-bold text-body" style={{fontSize: "16px"}}>{data.status_breakdown?.pending || 0}</span>
                            </div>
                        </div>
                        <div className="d-flex justify-content-between align-items-center p-3 rounded bg-body-secondary border">
                            <span className="fw-bold text-danger"><i className="fas fa-times-circle me-2"></i>Dibatalkan (Cancelled)</span>
                            <div>
                                <small className="text-muted me-2">Total Struk:</small>
                                <span className="fw-bold text-body" style={{fontSize: "16px"}}>{data.status_breakdown?.cancelled || 0}</span>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function exportSpoilageCSV(logs) {
    if (!logs || logs.length === 0) return;
    const header = ['Nama Produk', 'Total Qty Musnahkan', 'Jumlah Kejadian', 'Total Kerugian (Rp)', 'Terakhir Dimusnahkan'];
    const rows = logs.map(log => [
        `"${(log.product_name || '').replace(/"/g, '""')}"`,  // escape double-quotes
        log.total_qty,
        log.event_count,
        log.total_loss,
        log.last_destroyed_at ? new Date(log.last_destroyed_at).toLocaleDateString('id-ID') : '-'
    ]);
    const csvContent = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM untuk Excel
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kerugian-kedaluwarsa-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function SpoilageContent({ data, isLoading }) {
    const logs = data.spoilageLogs || [];
    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            {logs.length > 0 && (
                <div className="d-flex justify-content-between align-items-center px-4 py-3 bg-body border-bottom" style={{ flexShrink: 0 }}>
                    <small className="text-muted">
                        <i className="fas fa-layer-group me-1"></i>
                        Top {logs.length} produk (dikelompokkan berdasarkan total kerugian)
                    </small>
                    <button
                        className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
                        style={{ fontSize: '12px' }}
                        onClick={() => exportSpoilageCSV(logs)}
                        title="Download data sebagai file CSV untuk dibuka di Excel"
                    >
                        <i className="fas fa-download"></i> Download CSV
                    </button>
                </div>
            )}
            
            {/* Scroll Container (Natural Scroll) */}
            <div className="p-4 bg-body" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                        <div key={`skel-spoilage-${idx}`} className="mb-3 p-3 rounded bg-body-secondary border placeholder-glow">
                            <div className="d-flex justify-content-between mb-2 border-bottom pb-2">
                                <span className="placeholder col-5 bg-secondary rounded"></span>
                                <span className="placeholder col-3 bg-secondary rounded"></span>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span className="placeholder col-4 bg-secondary rounded"></span>
                                <span className="placeholder col-4 bg-secondary rounded"></span>
                            </div>
                        </div>
                    ))
                ) : logs.length > 0 ? (
                    logs.map((log, idx) => (
                        <div key={idx} className="mb-3 p-3 rounded bg-body-secondary border">
                            <div className="d-flex justify-content-between mb-2 border-bottom pb-2">
                                <span className="fw-bold text-body">{log.product_name}</span>
                                <div>
                                    <small className="text-muted me-1">Total Kerugian:</small>
                                    <span className="fw-bold text-danger">-{formatRupiah(log.total_loss)}</span>
                                </div>
                            </div>
                            <div className="d-flex justify-content-between text-muted" style={{fontSize: "13px"}}>
                                <span>
                                    <small>Musnah:</small> <strong className="text-secondary">{(log.total_qty || 0).toLocaleString('id-ID')} unit</strong> 
                                    <span className="badge rounded-pill bg-danger bg-opacity-10 text-danger ms-2" style={{fontSize: '10px'}}>{log.event_count}x kejadian</span>
                                </span>
                                <span>
                                    <small>Terakhir:</small> {log.last_destroyed_at ? new Date(log.last_destroyed_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-5">
                        <div className="mb-2"><i className="fas fa-check-circle text-success" style={{fontSize: '2rem'}}></i></div>
                        <p className="fw-bold text-success mb-1">Hebat! Tidak ada stok yang dimusnahkan.</p>
                        <p className="text-muted small mb-0">Manajemen stok berjalan optimal di periode ini. 🎉</p>
                    </div>
                )}
            </div>
        </div>
    );
}

const MODAL_THEMES = {
    loss:        { bg: 'bg-warning',  text: 'text-dark',  icon: 'fa-tag' },
    transaction: { bg: 'bg-primary',  text: 'text-white', icon: 'fa-receipt' },
    pnl:         { bg: 'bg-dark',     text: 'text-white', icon: 'fa-calculator' },
    profit:      { bg: 'bg-success',  text: 'text-white', icon: 'fa-trophy' },
    spoilage:    { bg: 'bg-danger',   text: 'text-white', icon: 'fa-trash-alt' }
};

/**
 * Komponen modal utama
 * @param {{ modalConfig, closeModal, data, ringkasan }} props
 */
export default function BiAnalyticsModal({ modalConfig, closeModal, data, ringkasan }) {
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (modalConfig.isOpen) {
            setIsLoading(true);
            const timer = setTimeout(() => setIsLoading(false), 400); // Skeleton loading effect
            return () => clearTimeout(timer);
        }
    }, [modalConfig.isOpen]);

    if (!modalConfig.isOpen) return null;

    const theme = MODAL_THEMES[modalConfig.type] || MODAL_THEMES.profit;

    return (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg" style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
                    <div className={`modal-header ${theme.bg} ${theme.text}`} style={{ flexShrink: 0 }}>
                        <h5 className={`modal-title fw-bold ${theme.text}`}>
                            <i className={`fas ${theme.icon} me-2`}></i>
                            {modalConfig.title}
                        </h5>
                        <button type="button" className={`btn-close ${theme.text === 'text-white' ? 'btn-close-white' : ''}`} onClick={closeModal}></button>
                    </div>
                    
                    <div className="modal-body p-0" style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
                        {modalConfig.type === 'pnl' ? (
                            <PnlContent ringkasan={ringkasan} />
                        ) : modalConfig.type === 'spoilage' ? (
                            <SpoilageContent data={data} isLoading={isLoading} />
                        ) : (
                            <TableContent type={modalConfig.type} data={data} isLoading={isLoading} />
                        )}
                    </div>
                    <div className="modal-footer bg-body border-0" style={{ flexShrink: 0 }}>
                        <button type="button" className="btn btn-secondary" onClick={closeModal}>Tutup</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
