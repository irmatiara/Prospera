import { useState, useMemo } from "react";
import { apiFetch, formatError } from "../utils/api";
import { formatDatetime } from "../utils/format";
import { useToast } from "../contexts/ToastContext";
import useDebounce from "./useDebounce";

export function useCart(products, fetchProducts, fetchHistory) {
    const [cartItems, setCartItems] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState("");
    const [transactionType, setTransactionType] = useState("sell");
    const [quantity, setQuantity] = useState("");
    const [modal, setModal] = useState("");
    const [hargaJual, setHargaJual] = useState("");
    const [datetime, setDatetime] = useState("");

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("warning");

    const [lastTransaction, setLastTransaction] = useState(null);
    const [saving, setSaving] = useState(false);
    const [overtimeModal, setOvertimeModal] = useState({ isOpen: false, errorMsg: '' });
    const { showToast } = useToast();

    // Pencarian produk
    const [searchTerm, setSearchTerm] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const selectedProduct = useMemo(() => 
        products.find((p) => String(p.product_id) === String(selectedProductId)),
        [products, selectedProductId]
    );

    const filteredProducts = useMemo(() => 
        products.filter((p) => p.product_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())),
        [products, debouncedSearchTerm]
    );

    const totalAmount = useMemo(() => {
        return cartItems.reduce((sum, item) => {
            const itemTotal = item.transactionType === 'buy'
                ? item.modal * item.quantity      // Pembelian: pakai harga modal
                : item.hargaJual * item.quantity;  // Penjualan: pakai harga jual
            return sum + itemTotal;
        }, 0);
    }, [cartItems]);

    const addItem = () => {
        if (!selectedProductId) {
            setMessage("Silakan pilih produk dari daftar terlebih dahulu sebelum menambah item.");
            setMessageType("warning");
            return;
        }
        const qty = Number(quantity);
        if (!qty || qty <= 0 || !Number.isInteger(qty)) {
            setMessage("Masukkan jumlah barang (Quantity) minimal 1 unit (bilangan bulat).");
            setMessageType("warning");
            return;
        }
        if (qty > 1000) {
            setMessage("Kuantitas transaksi tidak wajar (melebihi 1000 unit). Silakan pisahkan transaksi atau hubungi manajer.");
            setMessageType("danger");
            return;
        }
        const mod = Number(modal);
        if (isNaN(mod) || mod < 0) {
            setMessage("Pastikan nominal modal terisi dengan benar (angka non-negatif).");
            setMessageType("warning");
            return;
        }
        const isSell = transactionType === "sell";
        const harga = Number(hargaJual || mod);
        if (isSell && (isNaN(harga) || harga < 0)) {
            setMessage("Pastikan nominal harga jual terisi dengan benar (angka non-negatif).");
            setMessageType("warning");
            return;
        }
        if (isSell && selectedProduct.product_stock < qty) {
            setMessage(`Sisa stok ${selectedProduct.product_name} hanya ${selectedProduct.product_stock} unit. Silakan kurangi quantity atau lakukan restock.`);
            setMessageType("warning");
            return;
        }

        setCartItems((current) => {
            const existingIndex = current.findIndex(
                (item) => item.product_id === selectedProduct.product_id && item.transactionType === transactionType
            );

            const validDatetime = datetime 
                ? new Date(datetime + '+07:00').toISOString()
                : new Date().toISOString();

            if (existingIndex >= 0) {
                    return current.map((item, idx) =>
                        idx === existingIndex
                            ? { ...item, quantity: Number(item.quantity) + Number(qty), ...(datetime ? { datetime: validDatetime } : {}) }
                            : item
                    );
            }

            return [
                ...current,
                {
                    product_id: selectedProduct.product_id,
                    product_name: selectedProduct.product_name,
                    quantity: Number(qty),
                    modal: Number(mod),
                    hargaJual: Number(harga),
                    transactionType: transactionType,
                    datetime: validDatetime
                }
            ];
        });

        setSelectedProductId("");
        setSearchTerm("");
        setQuantity("");
        setModal("");
        setHargaJual("");
        setDatetime("");
        setMessage("");
    };

    const removeItem = (index) => {
        setCartItems((current) => current.filter((_, idx) => idx !== index));
    };

    const saveTransaction = async () => {
        if (saving) return;

        if (cartItems.length === 0) {
            setMessage("Keranjang masih kosong. Yuk, tambahkan produk dulu sebelum menyimpan transaksi!");
            setMessageType("warning");
            showToast("Keranjang masih kosong!", "warning");
            return;
        }
        setSaving(true);
        setMessage("");

        try {
            const payload = {
                transaction_type: transactionType,
                items: cartItems.map((item) => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    capital_cost: item.modal,
                    selling_price: item.hargaJual,
                    transaction_type: item.transactionType
                }))
            };

            const idempotencyKey = crypto.randomUUID();

            const response = await apiFetch("/transactions/checkout", {
                method: "POST",
                headers: { 'X-Idempotency-Key': idempotencyKey },
                body: JSON.stringify(payload)
            });

            // Simpan data struk sebelum keranjang dikosongkan
            setLastTransaction({
                items: [...cartItems],
                total: totalAmount,
                date: formatDatetime(new Date()),
                type: transactionType
            });

            setMessage(`Transaksi berhasil disimpan! Total belanja: Rp${response.total_belanja}`);
            setMessageType("success");
            showToast(`Transaksi berhasil disimpan! (Rp${response.total_belanja})`, "success");
            setCartItems([]);
            fetchProducts();
            fetchHistory();
        } catch (error) {
            if (error.data && error.data.require_pin) {
                setOvertimeModal({ isOpen: true, errorMsg: error.message });
                return;
            }
            setMessageType("danger");
            setMessage(formatError(error));
            showToast(formatError(error), "danger");
        } finally {
            setSaving(false);
        }
    };

    const submitOvertimeAuth = async (pin) => {
        setSaving(true);
        try {
            await apiFetch("/transactions/unlock-overtime", {
                method: "POST",
                body: JSON.stringify({ pin })
            });
            // Sukses buka sesi, tutup modal dan ulangi transaksi
            setOvertimeModal({ isOpen: false, errorMsg: '' });
            await saveTransaction(); // Di dalam sini sudah ada setSaving(false) pada catch/finally
        } catch (err) {
            const errorMessage = formatError(err);
            showToast(errorMessage, "danger");
            setSaving(false); // MATIKAN LOADING AGAR LAYAR TIDAK FREEZE
            throw new Error(errorMessage);
        }
    };
    return {
        cartItems, setCartItems,
        selectedProductId, setSelectedProductId,
        transactionType, setTransactionType,
        quantity, setQuantity,
        modal, setModal,
        hargaJual, setHargaJual,
        datetime, setDatetime,
        message, messageType,
        saving, lastTransaction,
        searchTerm, setSearchTerm,
        isDropdownOpen, setIsDropdownOpen,
        selectedProduct, filteredProducts,
        totalAmount,
        addItem, removeItem, saveTransaction,
        overtimeModal,
        setOvertimeModal,
        submitOvertimeAuth
    };
}
