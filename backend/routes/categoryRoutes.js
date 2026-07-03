const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const verifyToken = require('../middleware/authMiddleware');
// FIX (BUG-B01): Import authorizeRole untuk menutup celah privilege escalation.
// Sebelumnya: router.use(verifyToken) saja — karyawan bisa POST/PUT/DELETE kategori bebas.
const authorizeRole = require('../middleware/authorizeRole');

// Semua route wajib terautentikasi
router.use(verifyToken);

// GET — Semua role diizinkan (karyawan butuh kategori untuk input produk)
router.get('/', categoryController.getCategories);

// POST / PUT / DELETE — Owner Only (mutasi data berdampak ke validasi seluruh produk toko)
// FIX (BUG-B01): Tambahkan authorizeRole('owner') pada semua operasi write.
router.post('/', authorizeRole('owner'), categoryController.createCategory);
router.put('/:id', authorizeRole('owner'), categoryController.updateCategory);
router.delete('/:id', authorizeRole('owner'), categoryController.deleteCategory);

module.exports = router;
