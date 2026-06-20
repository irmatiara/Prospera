import { useMemo, useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ModalExport from '../components/ModalExport';
import TrendChart from '../components/TrendChart';
import SmartExpiryWidget from '../components/SmartExpiryWidget';
import { apiFetch, formatError } from '../utils/api';
import { formatRupiah } from '../utils/format';

function Index() {
    const [searchParams, setSearchParams] = useSearchParams();
    const view = searchParams.get('view') || 'overview';
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // PERFORMANCE FIX (F-T05): Pisahkan input state (UI) dari applied state (API)
    // Input state: berubah setiap keystroke, TIDAK memicu API call
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    // Applied state: berubah 500ms setelah user berhenti mengetik, MEMICU API call
    const [appliedStartDate, setAppliedStartDate] = useState('');
    const [appliedEndDate, setAppliedEndDate] = useState('');

    const [data, setData] = useState({
        summary: {},
        products: [],
        monthly: [],
    });

    const setView = (newView) => {
        setSearchParams({ view: newView });
    };

    // Debounce: Tunda penerapan filter 500ms setelah user berhenti mengetik
    const debounceRef = useRef(null);
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setAppliedStartDate(startDate);
            setAppliedEndDate(endDate);
        }, 500);
        return () => clearTimeout(debounceRef.current);
    }, [startDate, endDate]);

    // API call hanya terpicu oleh applied state (setelah debounce selesai)
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (appliedStartDate) params.append('startDate', appliedStartDate);
                if (appliedEndDate) params.append('endDate', appliedEndDate);
                
                const query = params.toString() ? `?${params.toString()}` : '';
                const topProductQuery = params.toString() ? `?${params.toString()}&limit=4` : '?limit=4';

                const [summaryRes, topProductsRes, monthlyRes] = await Promise.all([
                    apiFetch(`/analytics/summary${query}`),
                    apiFetch(`/analytics/top-product${topProductQuery}`),
                    apiFetch(`/analytics/monthly${query}`)
                ]);

                setData({
                    summary: summaryRes.summary,
                    products: topProductsRes,
                    monthly: monthlyRes,
                });
            } catch (err) {
                setError(formatError(err));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [appliedStartDate, appliedEndDate]);

    const totalProfit = data.summary.total_profit || 0;
    const totalLoss = data.summary.total_loss || 0;
    const totalSales = data.summary.revenue || 0;
    const totalTrans = data.summary.total_transaction || 0;
    const margin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : 0;
    
    // FIX: Gunakan data REAL dari API, bukan mock
    const sortedProducts = data.products.map(p => ({
        id: p.product_id,
        name: p.product_name,
        volume: p.sold,
        profit: p.laba || 0,          // Data real dari backend
        margin: p.margin || '0%'      // Data real dari backend
    }));

    const projectedSales = (data.monthly.length > 0 ? data.monthly[data.monthly.length - 1].revenue : 0) * 1.15;

    // FIX: Gunakan laba_bersih real dari API, bukan mock 40%
    const chartData = useMemo(() => {
        return {
            labels: data.monthly.map(m => m.month),
            sales: data.monthly.map(m => m.revenue),
            profit: data.monthly.map(m => m.laba_bersih || 0),
        };
    }, [data.monthly]);

    if (loading) return <div className="p-5 text-center"><div className="spinner-border text-primary"></div><p className="mt-2">Memuat data analisis...</p></div>;
    if (error) return <div className="alert alert-danger m-4">Error: {error}. Pastikan Anda sudah login dan server backend berjalan.</div>;

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="fw-bold m-0">Laporan Analisis Bisnis</h3>
                <div className="d-flex gap-2">
                    <input 
                        type="date" 
                        className="form-control form-control-sm" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                    />
                    <span className="mt-1">-</span>
                    <input 
                        type="date" 
                        className="form-control form-control-sm" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)} 
                    />
                </div>
            </div>
            <div className="row g-4">
                <div className="col-lg-4 col-md-5">
                    <div className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="badge bg-secondary rounded-pill px-3 py-2">Sales Summary</span>
                            <button className="btn btn-sm btn-outline-primary px-3 fw-semibold rounded-pill" type="button" data-bs-toggle="modal" data-bs-target="#ModalExport">
                                <i className="fas fa-file-export me-1" />Export
                            </button>
                        </div>
                        
                        <div className="card border-0 shadow-sm rounded-4 p-3 mb-3 d-flex flex-row justify-content-between align-items-center">
                            <div>
                                <div className="text-muted small mb-1">Total Pendapatan</div>
                                <div className="h4 fw-bold m-0 text-dark">{formatRupiah(totalSales)}</div>
                            </div>
                            <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex justify-content-center align-items-center" style={{width: '45px', height: '45px'}}>
                                <i className="fas fa-wallet fs-5"></i>
                            </div>
                        </div>

                        <Link to="/bi-analytics" className="text-decoration-none text-dark">
                            <div className="card border-0 shadow-sm rounded-4 p-3 mb-3 d-flex flex-row justify-content-between align-items-center card-hover-effect">
                                <div>
                                    <div className="text-muted small mb-1">Jumlah Transaksi</div>
                                    <div className="h4 fw-bold m-0 text-dark">{totalTrans.toLocaleString('id-ID')}</div>
                                </div>
                                <i className="fas fa-chevron-right text-muted"></i>
                            </div>
                        </Link>

                        <Link to="/smart-predict" className="text-decoration-none text-dark">
                            <div className="card border-0 shadow-sm rounded-4 p-3 mb-3 d-flex flex-row justify-content-between align-items-center card-hover-effect">
                                <div>
                                    <div className="fw-bold text-dark mb-1">Deteksi Anomali / Fraud</div>
                                    <div className="h4 fw-bold text-danger m-0">{formatRupiah(totalLoss)}</div>
                                    <div className="text-muted small mt-1">Klik untuk melihat detail anomali</div>
                                </div>
                                <div className="bg-danger bg-opacity-10 text-danger rounded-circle d-flex justify-content-center align-items-center" style={{width: '45px', height: '45px'}}>
                                    <i className="fas fa-exclamation-triangle fs-5"></i>
                                </div>
                            </div>
                        </Link>

                        <SmartExpiryWidget isDashboard={true} />
                    </div>

                    <div className="mb-3">
                        <span className="badge bg-primary rounded-pill px-3 py-2 mb-2">Profit & Loss Tracking</span>
                        
                        <Link to="/bi-analytics" className="text-decoration-none text-dark">
                            <div className="card border-0 shadow-sm rounded-4 p-3 mb-3 d-flex flex-row justify-content-between align-items-center card-hover-effect">
                                <div>
                                    <div className="text-muted small mb-1">Laporan Laba</div>
                                    <div className="d-flex align-items-center gap-2">
                                        <div className="h4 fw-bold text-success m-0">{formatRupiah(totalProfit)}</div>
                                        <span className="badge bg-info bg-opacity-10 text-info rounded-pill border border-info border-opacity-25 px-2 py-1">
                                            <i className="fas fa-arrow-trend-up me-1"></i>{margin}% Margin
                                        </span>
                                    </div>
                                    <div className="text-muted small mt-2">Klik untuk melihat rincian kalkulasi P&L</div>
                                </div>
                                <i className="fas fa-chevron-right text-muted"></i>
                            </div>
                        </Link>
                    </div>
                </div>
                <div className="col-lg-8 col-md-7 d-flex flex-column">
                    <ul className="nav nav-pills mb-4 bg-white p-2 rounded shadow-sm">
                        <li className="nav-item">
                            <button className={`nav-link ${view === 'overview' ? 'active' : ''}`} type="button" onClick={() => setView('overview')}>
                                <i className="fas fa-list me-2" />Performa Produk
                            </button>
                        </li>
                        <li className="nav-item">
                            <button className={`nav-link ${view === 'chart' ? 'active' : ''}`} type="button" onClick={() => setView('chart')}>
                                <i className="fas fa-chart-line me-2" />Grafik Analisis
                            </button>
                        </li>
                    </ul>

                    {view === 'overview' ? (
                        <div className="clean-card shadow-sm mb-3">
                            <h6 className="fw-bold mb-4"><span className="badge bg-success me-2">Top</span>Top Performance Produk</h6>
                            <div style={{ maxHeight: "290px", overflowY: "auto", paddingRight: "5px" }}>
                                <div className="table-responsive">
                                    <table className="table table-simple align-middle mb-0">
                                        <thead style={{ position: "sticky", top: 0, backgroundColor: "#fff", zIndex: 1 }}>
                                            <tr>
                                                <th>Produk</th>
                                                <th>Unit</th>
                                                <th>Laba</th>
                                                <th>Margin</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                        {sortedProducts.map((product) => (
                                            <tr key={product.id}>
                                                <td className="fw-bold text-dark">{product.name}</td>
                                                <td>{product.volume.toLocaleString('id-ID')} unit</td>
                                                <td className="text-success fw-bold">{formatRupiah(product.profit)}</td>
                                                <td>
                                                    <span className="text-primary fw-bold">
                                                        {product.margin}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    ) : (
                        <div className="clean-card shadow-sm mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h6 className="fw-bold m-0"><span className="badge bg-info me-2">Tren</span>Tren Bisnis</h6>
                            </div>
                            <div className="chart-area">
                                <TrendChart labels={chartData.labels} sales={chartData.sales} profit={chartData.profit} />
                            </div>
                        </div>
                    )}

                    <div className="clean-card shadow-sm bg-light border-0 mt-auto">
                        <h6 className="fw-bold mb-3"><i className="fas fa-robot text-primary me-2" />AI Insight</h6>
                        <div className="row">
                            <div className="col-md-6 border-end">
                                <small className="text-muted d-block mb-1">Estimasi Bulan Depan</small>
                                <div className="h5 fw-bold text-primary">{formatRupiah(projectedSales)}</div>
                            </div>
                            <div className="col-md-6 ps-md-4">
                                <small className="text-muted d-block mb-2">Saran Stok:</small>
                                <div className="small text-secondary">
                                    {sortedProducts.slice(0, 2).map((product) => (
                                        <div className="mb-1" key={product.id}>- {product.name}: +{Math.round(product.volume * 0.2)} unit</div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ModalExport />
        </>
    );
}

export default Index;
