const authorizeRole = (...allowedRoles) => {
    return (req, res, next) => {
        // req.user sudah diisi oleh verifyToken (dari JWT payload)
        if (!req.user || !req.user.role) {
            return res.status(403).json({
                message: "Akses ditolak. Data otorisasi tidak ditemukan."
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Akses ditolak. Anda tidak memiliki hak akses untuk fitur ini."
            });
        }

        next();
    };
};

module.exports = authorizeRole;
