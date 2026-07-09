import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { AUTH_USER } from "../../config/auth";
import AppModal from "../../components/AppModal";

function VoucherShop() {
  const [vouchers, setVouchers] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState({
    show: false,
    title: "",
    message: "",
    type: "info",
    showCancel: false,
    confirmText: "OK",
    cancelText: "Batal",
    onConfirm: null,
  });

  const showInfoModal = (title, message, type = "info") => {
    setModal({
      show: true,
      title,
      message,
      type,
      showCancel: false,
      confirmText: "OK",
      cancelText: "Batal",
      onConfirm: null,
    });
  };

  const showConfirmModal = ({
    title,
    message,
    type = "confirm",
    confirmText = "Ya",
    cancelText = "Batal",
    onConfirm,
  }) => {
    setModal({
      show: true,
      title,
      message,
      type,
      showCancel: true,
      confirmText,
      cancelText,
      onConfirm,
    });
  };

  const closeModal = () => {
    setModal((prev) => ({
      ...prev,
      show: false,
    }));
  };

  useEffect(() => {
    fetchUserPoints();
    fetchVouchers();
  }, []);

  const fetchUserPoints = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/events/vouchers/user-points?user_id=${AUTH_USER.id}`,
      );
      setUserPoints(res.data.points);
    } catch (err) {
      console.error("Gagal memuat poin user:", err);
    }
  };

  const fetchVouchers = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/events/vouchers/shop-list`,
      );
      setVouchers(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Gagal memuat daftar voucher:", err);
      setLoading(false);
    }
  };

  const claimVoucher = async (voucherId) => {
    try {
      const res = await axios.post(
        `http://localhost:5000/api/events/vouchers/claim`,
        {
          user_id: AUTH_USER.id,
          voucher_id: voucherId,
        },
      );

      showInfoModal("Voucher Berhasil Diklaim", res.data.message, "success");

      // Update sisa poin secara real-time di UI
      setUserPoints(res.data.remainingPoints);
    } catch (err) {
      console.error(err);
      showInfoModal(
        "Gagal Mengklaim Voucher",
        err.response?.data?.message || "Gagal mengklaim voucher.",
        "error",
      );
    }
  };

  const handleClaimVoucher = async (voucherId, pointCost, voucherName) => {
    // 🔥 PENGECEKAN POIN DI FRONTEND: Takutnya kalau ga cukup gess!
    if (userPoints < pointCost) {
      showInfoModal(
        "Poin Tidak Cukup",
        `Waduh gess! Poin kamu tidak cukup untuk menukar ${voucherName}. Butuh ${pointCost} poin, kamu baru punya ${userPoints} poin.`,
        "warning",
      );
      return;
    }

    showConfirmModal({
      title: "Konfirmasi Penukaran Voucher",
      message: `Apakah kamu yakin ingin menukarkan ${pointCost} poin untuk ${voucherName}?`,
      type: "confirm",
      confirmText: "Ya, Tukarkan",
      cancelText: "Batal",
      onConfirm: () => {
        closeModal();
        claimVoucher(voucherId);
      },
    });
  };

  return (
    <>
      <Navbar />
      <div className="container mt-5 mb-5" style={{ minHeight: "75vh" }}>
        <Link
          to="/events"
          className="btn btn-light border fw-semibold mb-4 px-3 py-2 rounded-3 shadow-sm"
        >
          ⬅️ Kembali ke List Event
        </Link>

        {/* --- CARD TAMPILAN POIN USER --- */}
        <div
          className="card border-0 shadow-sm rounded-4 p-4 mb-5 bg-gradient text-white"
          style={{ backgroundColor: "#4f46e5" }}
        >
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h5 className="mb-1 opacity-75">Halo, {AUTH_USER.name}! 👋</h5>
              <p className="mb-0 small opacity-50">ID User: {AUTH_USER.id}</p>
            </div>
            <div className="text-end">
              <span className="small opacity-75 d-block text-uppercase fw-bold mb-1">
                Total Poin Kamu
              </span>
              <h2 className="fw-black mb-0 d-flex align-items-center justify-content-end gap-2">
                🪙 <span className="text-warning">{userPoints}</span> Poin
              </h2>
            </div>
          </div>
        </div>

        <h4 className="fw-bold text-dark mb-4 pb-2 border-bottom">
          🎁 Tukarkan Poin dengan Voucher Diskon Tiket
        </h4>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">Memuat gerai voucher gess...</p>
          </div>
        ) : vouchers.length === 0 ? (
          <div className="text-center py-5">
            <h5 className="text-muted">Toko voucher sedang kosong gess.</h5>
          </div>
        ) : (
          <div className="row g-4">
            {vouchers.map((v) => (
              <div className="col-md-6 col-lg-4" key={v.id}>
                <div className="card h-100 shadow-sm border-2 rounded-4 overflow-hidden position-relative bg-white">
                  {/* Efek Potongan Gunting Khas Tiket/Voucher */}
                  <div className="p-4 d-flex flex-column justify-content-between h-100">
                    <div>
                      <span className="badge bg-danger mb-3 px-3 py-2 rounded-pill fw-bold">
                        Potongan {v.percentage}%
                      </span>
                      <h5 className="fw-bold text-dark mb-1">{v.name}</h5>
                      <code className="text-primary fw-bold d-block mb-3 fs-6">
                        Kode: {v.code}
                      </code>
                    </div>

                    <div className="pt-3 border-top mt-3 d-flex align-items-center justify-content-between">
                      <div>
                        <small className="text-muted d-block">Harga Poin</small>
                        <strong className="text-dark fs-5">
                          🪙 {v.point_cost} Poin
                        </strong>
                      </div>
                      <button
                        onClick={() =>
                          handleClaimVoucher(v.id, v.point_cost, v.name)
                        }
                        className={`btn fw-bold px-4 py-2 rounded-3 shadow-sm ${
                          userPoints >= v.point_cost
                            ? "btn-success"
                            : "btn-outline-secondary"
                        }`}
                      >
                        {userPoints >= v.point_cost
                          ? "Tukarkan"
                          : "Poin Kurang"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AppModal
        show={modal.show}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        showCancel={modal.showCancel}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        onConfirm={modal.onConfirm}
        onClose={closeModal}
      />

      <Footer />
    </>
  );
}

export default VoucherShop;
