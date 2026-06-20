import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getExpiringProducts, applyMarkdown, formatError } from '../utils/api';
import { formatRupiah } from '../utils/format';

function SmartExpiryWidget({ isDashboard = false }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State untuk Modal Markdown
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [newPrice, setNewPrice] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchExpiringProducts();
    }, []);

    const fetchExpiringProducts = async () => {
        try {
            setLoading(true);
            const data = await getExpiringProducts();
            setProducts(data);
            setError(null);
        } catch (err) {
            setError(formatError(err));
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (product) => {
        setSelectedProduct(product);
        // Default: harga modal
        setNewPrice(product.product_cost.toString());
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedProduct(null);
        setNewPrice('');
    };

    const handleApplyMarkdown = async () => {
        if (!selectedProduct || !newPrice) return;
        
        const numNewPrice = parseInt(newPrice);
        if (numNewPrice < 0) {
            alert("Harga tidak boleh negatif!");
            return;
        }

        const isConfirmed = window.confirm(`Harga jual saat ini ${formatRupiah(selectedProduct.product_price)} akan diubah menjadi ${formatRupiah(numNewPrice)}. Lanjutkan?`);
        
        if (!isConfirmed) return;

        try {
            setIsSubmitting(true);
            await applyMarkdown(selectedProduct.product_id, numNewPrice);
            alert("Berhasil mengaplikasikan diskon markdown!");
            handleCloseModal();
            fetchExpiringProducts(); // Refresh list
        } catch (err) {
            alert(formatError(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="card shadow-sm mb-4"><div className="card-body">Memuat peringatan kedaluwarsa...</div></div>;
    }

    if (error) {
        return <div className="alert alert-danger mb-4">{error}</div>;
    }

    if (products.length === 0) {
        return null;
    }

    const cardContent = (
        <div 
            className="card border-0 shadow-sm rounded-4 p-3 mb-3 d-flex flex-row justify-content-between align-items-center card-hover-effect" 
            style={{ cursor: 'pointer' }}
            {...(!isDashboard ? { 'data-bs-toggle': 'modal', 'data-bs-target': '#ExpiryModal' } : {})}
        >
            <div>
                <div className="fw-bold text-dark mb-1">Peringatan Kedaluwarsa</div>
                <div className="h5 fw-bold text-warning m-0">{products.length} Produk Mendekati Expired</div>
                <div className="text-muted small mt-1">Klik untuk melihat detail produk</div>
            </div>
            <div className="bg-warning bg-opacity-10 text-warning rounded-circle d-flex justify-content-center align-items-center" style={{width: '45px', height: '45px'}}>
                <i className="fas fa-calendar-times fs-5"></i>
            </div>
        </div>
    );

    if (isDashboard) {
        return (
            <Link to="/smart-predict" className="text-decoration-none text-dark">
                {cardContent}
            </Link>
        );
    }

    return (
        <div className="mb-4">
            {cardContent}

            {/* The Modal */}
            <div className="modal fade" id="ExpiryModal" tabIndex="-1" aria-labelledby="ExpiryModalLabel" aria-hidden="true">
                <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content border-0 shadow">
                        <div className="modal-header bg-warning text-dark border-0">
                            <h5 className="modal-title fw-bold" id="ExpiryModalLabel">
                                <i className="fas fa-exclamation-triangle me-2"></i>Peringatan Kedaluwarsa (Smart Expiry)
                            </h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body p-4">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Produk</th>
                                            <th>Kedaluwarsa</th>
                                            <th>Stok</th>
                                            <th>Harga Saat Ini</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map(p => (
                                            <tr key={p.product_id}>
                                                <td>
                                                    <div className="fw-semibold">{p.product_name}</div>
                                                    <div className="text-muted small">{p.Category?.category_name || '-'}</div>
                                                </td>
                                                <td>
                                                    <div className={`fw-bold ${p.days_left <= 14 ? 'text-danger' : 'text-warning'}`}>
                                                        {p.expired_date} ({p.days_left} hari lagi)
                                                    </div>
                                                </td>
                                                <td>{p.product_stock}</td>
                                                <td>{formatRupiah(p.product_price)}</td>
                                                <td>
                                                    <button 
                                                        onClick={() => handleOpenModal(p)}
                                                        className="btn btn-sm btn-outline-warning fw-semibold"
                                                    >
                                                        <i className="fas fa-tags me-1"></i>Terapkan Diskon
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="modal-footer border-top bg-light">
                            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Diskon */}
            {showModal && selectedProduct && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">Set Diskon Markdown</h5>
                                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                            </div>
                            <div className="modal-body">
                                <p className="mb-3 text-muted small">
                                    Produk <strong>{selectedProduct.product_name}</strong> mendekati tanggal kedaluwarsa. Turunkan harga untuk mempercepat penjualan.
                                </p>
                                
                                <div className="bg-light p-3 rounded mb-3">
                                    <div className="d-flex justify-content-between mb-1">
                                        <span className="text-muted small">Harga Modal:</span>
                                        <span className="fw-semibold">{formatRupiah(selectedProduct.product_cost)}</span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span className="text-muted small">Harga Jual Saat Ini:</span>
                                        <span className="fw-semibold">{formatRupiah(selectedProduct.product_price)}</span>
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-semibold small">Harga Jual Baru (Rp)</label>
                                    <input 
                                        type="number" 
                                        value={newPrice}
                                        onChange={(e) => setNewPrice(e.target.value)}
                                        className="form-control"
                                        placeholder="Masukkan nominal harga diskon"
                                    />
                                    {newPrice && parseInt(newPrice) < selectedProduct.product_cost && (
                                        <div className="form-text text-danger mt-1">
                                            <i className="fas fa-exclamation-circle me-1"></i> Peringatan: Anda mengatur harga di bawah modal (Jual Rugi).
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Batal</button>
                                <button 
                                    type="button" 
                                    className="btn btn-primary fw-semibold" 
                                    onClick={handleApplyMarkdown}
                                    disabled={isSubmitting || !newPrice}
                                >
                                    {isSubmitting ? 'Memproses...' : 'Terapkan Harga Baru'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SmartExpiryWidget;
