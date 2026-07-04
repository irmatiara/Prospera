import { useState } from 'react';
import { apiFetchBlob, formatError } from '../utils/api';
import { useToast } from '../contexts/ToastContext';

function ModalExport() {
    const [exportingType, setExportingType] = useState(null);
    const { showToast } = useToast();

    const handleExport = async (e, format) => {
        if (e && e.preventDefault) e.preventDefault();
        if (exportingType !== null) return;
        
        try {
            setExportingType(format);

            const blob = await apiFetchBlob(`/analytics/summary/export/${format}`);
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            const dateStr = new Date().toISOString().split('T')[0];
            const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
            a.download = `Laporan_Prospera_${dateStr}_${timeStr}.${format === 'excel' ? 'xlsx' : 'csv'}`;
            
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                if (document.body.contains(a)) {
                    document.body.removeChild(a);
                }
                window.URL.revokeObjectURL(url);
            }, 60000);
        } catch (err) {
            console.error("Export Error:", err);
            showToast(formatError(err), 'danger');
        } finally {
            setExportingType(null);
        }
    };

    return (
        <div className="modal fade" id="ModalExport" tabIndex="-1" aria-labelledby="ModalExportLabel" aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold" id="ModalExportLabel">Pilih Format Export</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Tutup" />
                    </div>
                    <div className="modal-body">
                        <div className="d-grid gap-3">
                            <button 
                                type="button" 
                                className="btn btn-outline-success py-3" 
                                onClick={(e) => handleExport(e, 'excel')}
                                disabled={exportingType !== null}
                            >
                                <i className="fas fa-file-excel me-2" />{exportingType === 'excel' ? 'Memproses...' : 'XLSX (Excel)'}
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-outline-primary py-3" 
                                onClick={(e) => handleExport(e, 'csv')}
                                disabled={exportingType !== null}
                            >
                                <i className="fas fa-file-csv me-2" />{exportingType === 'csv' ? 'Memproses...' : 'CSV'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ModalExport;
