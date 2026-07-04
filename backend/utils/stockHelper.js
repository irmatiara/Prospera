const { CRITICAL_THRESHOLD } = require('../config/appConfig');

/**
 * Fungsi untuk menentukan status stok berdasarkan jumlahnya
 * @param {number} stock 
 * @param {number} minDisplayQty
 * @param {number} calculatedReorderPoint
 * @returns {string} 'Low Stock' | 'Safe'
 */
const getStockStatus = (stock, minDisplayQty, calculatedReorderPoint) => {
    let threshold = CRITICAL_THRESHOLD;
    
    // Single Source of Truth: Logika diselaraskan dengan Smart Feature (inventoryController.js)
    if (minDisplayQty !== undefined || calculatedReorderPoint !== undefined) {
        threshold = Math.max(Number(minDisplayQty || 0), Number(calculatedReorderPoint || 0));
    }

    return Number(stock) <= threshold ? "Low Stock" : "Safe";
};

module.exports = {
    CRITICAL_THRESHOLD,
    getStockStatus
};