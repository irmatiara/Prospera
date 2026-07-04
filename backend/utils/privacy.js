/**
 * @param {string} email - Alamat email asli
 * @returns {string} Email yang sudah di-mask, atau string kosong jika input tidak valid
 */
const maskEmail = (email) => {
    if (!email || typeof email !== 'string') return '';
    const [local, domain] = email.split('@');
    if (!domain) return email; // bukan format email valid, kembalikan apa adanya
    if (local.length <= 2) {
        // Email sangat pendek: tampilkan 1 karakter pertama + mask sisanya
        return `${local[0]}${'*'.repeat(Math.max(local.length - 1, 1))}@${domain}`;
    }
    // Standar: 2 karakter pertama + mask + 1 karakter terakhir
    const visibleStart = local.slice(0, 2);
    const visibleEnd   = local.slice(-1);
    const maskLength   = Math.max(local.length - 3, 2); // minimal 2 bintang
    return `${visibleStart}${'*'.repeat(maskLength)}${visibleEnd}@${domain}`;
};



module.exports = { maskEmail };
