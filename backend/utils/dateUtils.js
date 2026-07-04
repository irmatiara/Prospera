const { Op } = require("sequelize");
const moment = require("moment-timezone"); // FIX (BUG-07): Dibutuhkan oleh getDateFilter untuk WIB-aware date range

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const isValidDate = (dateStr) => {
    if (!dateStr || !DATE_REGEX.test(dateStr)) return false;
    const d = new Date(dateStr);
    return !isNaN(d.getTime());
};

const getDateFilter = (startDate, endDate) => {
    if (startDate && endDate) {
        // Validasi format sebelum diproses
        if (!isValidDate(startDate) || !isValidDate(endDate)) {
            return {}; // Abaikan filter jika format invalid
        }

        const start = moment.tz(startDate + ' 00:00:00', 'YYYY-MM-DD HH:mm:ss', 'Asia/Jakarta').toDate();
        const end   = moment.tz(endDate   + ' 23:59:59', 'YYYY-MM-DD HH:mm:ss', 'Asia/Jakarta').toDate();

        return {
            transaction_datetime: {
                [Op.between]: [start, end]
            }
        };
    }
    return {};
};

/**
 * @param {string|undefined} startDate - Format YYYY-MM-DD
 * @param {string|undefined} endDate   - Format YYYY-MM-DD
 * @returns {{ [Op.gte]: Date, [Op.lte]: Date }|undefined}
 */
const buildWIBDateRange = (startDate, endDate) => {
    if (!startDate && !endDate) return undefined;

    const range = {};
    if (startDate && isValidDate(startDate)) {
        // 00:00:00.000 WIB pada hari startDate
        range[Op.gte] = moment.tz(startDate + ' 00:00:00', 'YYYY-MM-DD HH:mm:ss', 'Asia/Jakarta').toDate();
    }
    if (endDate && isValidDate(endDate)) {
        // 23:59:59.999 WIB pada hari endDate
        range[Op.lte] = moment.tz(endDate + ' 23:59:59', 'YYYY-MM-DD HH:mm:ss', 'Asia/Jakarta').toDate();
    }
    return range;
};

module.exports = { getDateFilter, buildWIBDateRange };