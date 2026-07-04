const { randomUUID } = require('crypto');

const requestId = (req, res, next) => {
    // Gunakan header yang sudah ada (dari load balancer/gateway) atau generate baru
    const id = req.headers['x-request-id'] || randomUUID();

    // Simpan ke req agar bisa dipakai controller/logger downstream
    req.requestId = id;

    // Kembalikan ke client agar bisa di-trace dari sisi frontend
    res.setHeader('X-Request-Id', id);

    next();
};

module.exports = requestId;
