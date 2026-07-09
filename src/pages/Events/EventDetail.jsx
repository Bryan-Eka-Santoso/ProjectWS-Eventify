import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../../config/api"; // ✅ Menggunakan instance api kita
import { getCurrentUser } from "../../config/auth";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AppModal from "../../components/AppModal";

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // 🔥 State Kelola Transaksi Pemesanan Tiket Gess
  const [myVouchers, setMyVouchers] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVoucherId, setSelectedVoucherId] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // =====================================================
  // 🔥 MODAL PENGGANTI ALERT
  // Modal ini untuk menggantikan semua alert() di halaman EventDetail
  // =====================================================
  const [appModal, setAppModal] = useState({
    show: false,
    title: "",
    message: "",
    type: "info",
    showCancel: false,
    confirmText: "OK",
    cancelText: "Batal",
    onConfirm: null,
  });

  const showInfoModal = (title, message, type = "info", onConfirm = null) => {
    setAppModal({
      show: true,
      title,
      message,
      type,
      showCancel: false,
      confirmText: "OK",
      cancelText: "Batal",
      onConfirm,
    });
  };

  const closeAppModal = () => {
    setAppModal((prev) => ({
      ...prev,
      show: false,
    }));
  };

  useEffect(() => {
    api
      .get(`/events/${id}`)
      .then((res) => {
        setEvent(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal memuat detail event:", err);
        setLoading(false);
      });

    api
      .get(
        `/events/${id}/check-save`,
      )
      .then((res) => setIsSaved(res.data.isSaved))
      .catch((err) => console.error(err));
  }, [id]);

  useEffect(() => {
    if (showModal) {
      api
        .get(
          `/events/vouchers/my-vouchers`,
        )
        .then((res) => {
          setMyVouchers(res.data);
        })
        .catch((err) => console.error("Gagal mengambil voucher user:", err));
    }
  }, [showModal]);

  const handleToggleSave = async () => {
    try {
      const res = await api.post(
        "/events/toggle-save",
        {
          event_id: id,
        },
      );

      showInfoModal("Informasi Simpan Event", res.data.message, "success");
      setIsSaved(res.data.isSaved);
    } catch (err) {
      console.error(err);
      showInfoModal(
        "Gagal Memproses Simpan Event",
        "Gagal memproses simpan event.",
        "error",
      );
    }
  };

  // 🔥 CORE INTEGRASI ENGINE SNAP PAY MIDTRANS SELESAI GESS
  // 🔥 FIXED: OPTIMASI JALUR FRONTEND BYPASS TANPA INSTAL NGROK GESS!
  // 🔥 UTUH & FIXED: JALUR FRONTEND BYPASS 100% TANPA INSTAL NGROK APAPUN GESS!
  const handlePayTicket = async () => {
    if (!selectedTicket) {
      showInfoModal(
        "Kategori Tiket Belum Dipilih",
        "Pilih kategori jenis tiket yang ingin kamu beli dulu gess!",
        "warning",
      );
      return;
    }

    if (quantity < 1) {
      showInfoModal(
        "Jumlah Tiket Tidak Valid",
        "Jumlah tiket yang dibeli minimal 1 unit gess!",
        "warning",
      );
      return;
    }

    setCheckoutLoading(true);

    try {
      // 1. Ambil Token Snap dan Order ID dari Backend kamu gess
      const res = await api.post(
        "/events/tickets/checkout",
        {
          ticket_type_id: selectedTicket.id,
          quantity: quantity,
          user_voucher_id: selectedVoucherId || null,
        },
      );

      // Mengambil token snap dan orderId dari response controller kamu
      const { snapToken, orderId } = res.data;

      // 2. Luncurkan Pop-Up Panel Midtrans Snap
      window.snap.pay(snapToken, {
        onSuccess: async function (result) {
          try {
            console.log("Midtrans Snap Success Client Triggered!");

            // 🎯 INI RAHASIANYA GESS: Frontend langsung nembak backend lokal kamu sendiri!
            // Mengirim parameter yang dibutuhkan oleh fungsi handleMidtransCallback kamu
            await api.post(
              "/events/tickets/midtrans-callback",
              {
                order_id: orderId || result.order_id,
                transaction_status: "settlement", // Status lunas sesuai filter backend-mu gess
                fraud_status: "accept",
                payment_type: result.payment_type || "QRIS/VA Simulator",
              },
            );

            setShowModal(false);

            showInfoModal(
              "Pembayaran Berhasil",
              "Selamat! Pembayaran berhasil diselesaikan, tiket resmi diterbitkan gess.",
              "success",
              () => {
                closeAppModal();
                navigate("/events/my-tickets");
              },
            );
          } catch (err) {
            console.error("Gagal memproses bypass cetak tiket:", err);
            showInfoModal(
              "Gagal Memproses Tiket",
              "Sistem error saat memproses tiket ke database lokal gess.",
              "error",
            );
          }
        },

        onPending: function (result) {
          // 🎯 TRIK UNTUK SIMULATOR: Karena simulator VA/QRIS sering dianggap 'pending' oleh pop-up sebelum di-refresh,
          // kita arahkan onPending untuk melakukan bypass juga agar kamu tidak perlu nunggu gess!
          showInfoModal(
            "Transaksi Simulator Terdeteksi",
            "Mendeteksi status transaksi simulator, mencoba memproses tiket kamu gess...",
            "info",
          );

          api
            .post(
              "/events/tickets/midtrans-callback",
              {
                order_id: orderId || result.order_id,
                transaction_status: "settlement",
                fraud_status: "accept",
                payment_type: "VA/QRIS Simulator Bypass",
              },
            )
            .then(() => {
              setShowModal(false);

              showInfoModal(
                "Tiket Berhasil Diterbitkan",
                "Tiket berhasil diterbitkan otomatis!",
                "success",
                () => {
                  closeAppModal();
                  navigate("/events/my-tickets");
                },
              );
            })
            .catch((err) => {
              console.error(err);
              showInfoModal(
                "Gagal Menerbitkan Tiket",
                "Gagal menerbitkan tiket otomatis.",
                "error",
              );
            });
        },

        onError: function () {
          showInfoModal(
            "Pembayaran Gagal",
            "Waduh, transaksi pembayaran Midtrans gagal diproses.",
            "error",
          );
        },

        onClose: function () {
          showInfoModal(
            "Transaksi Dibatalkan",
            "Kamu membatalkan transaksi ditengah jalan gess.",
            "warning",
          );
        },
      });
    } catch (error) {
      console.error(error);
      showInfoModal(
        "Checkout Gagal",
        error.response?.data?.message ||
          "Terjadi kesalahan memproses Checkout tiket.",
        "error",
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Live Hitung Perkiraan Total Harga Preview di Modal Gess
  const calculatePreviewTotal = () => {
    if (!selectedTicket) return 0;

    let total = selectedTicket.price * quantity;
    let discount = 0;

    if (selectedVoucherId) {
      const activeV = myVouchers.find(
        (v) => String(v.id) === String(selectedVoucherId),
      );

      if (activeV && activeV.Voucher) {
        const voucher = activeV.Voucher;

        const percentage =
          voucher.percentage !== null && voucher.percentage !== undefined
            ? Number(voucher.percentage)
            : null;

        const maxCut =
          voucher.max_cut !== null && voucher.max_cut !== undefined
            ? Number(voucher.max_cut)
            : null;

        if (percentage !== null && percentage > 0) {
          discount = Math.floor((percentage / 100) * total);

          if (maxCut !== null && maxCut > 0 && discount > maxCut) {
            discount = maxCut;
          }
        } else if (maxCut !== null && maxCut > 0) {
          discount = maxCut;
        }

        if (discount > total) {
          discount = total;
        }

        total -= discount;
      }
    }

    return total < 0 ? 0 : total;
  };

  if (loading)
    return (
      <>
        <div className="text-center my-5 p-5">
          <div className="spinner-border text-primary" role="status"></div>
          <p className="mt-2 text-muted">Memuat detail event...</p>
        </div>

        <AppModal
          show={appModal.show}
          title={appModal.title}
          message={appModal.message}
          type={appModal.type}
          showCancel={appModal.showCancel}
          confirmText={appModal.confirmText}
          cancelText={appModal.cancelText}
          onConfirm={appModal.onConfirm}
          onClose={closeAppModal}
        />
      </>
    );

  if (!event)
    return (
      <>
        <div className="container mt-5 text-center my-5 py-5 bg-light rounded-4">
          <h3 className="text-muted">Waduh, Event tidak ditemukan gess!</h3>
          <Link to="/events" className="btn btn-primary mt-3 rounded-pill px-4">
            Back ke List Event
          </Link>
        </div>

        <AppModal
          show={appModal.show}
          title={appModal.title}
          message={appModal.message}
          type={appModal.type}
          showCancel={appModal.showCancel}
          confirmText={appModal.confirmText}
          cancelText={appModal.cancelText}
          onConfirm={appModal.onConfirm}
          onClose={closeAppModal}
        />
      </>
    );

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const bagian = dateString.split("T");
    const tanggalMentah = bagian[0];
    const waktuMentah = bagian[1].substring(0, 5);
    const [thn, bln, tgl] = tanggalMentah.split("-");
    const namaBulan = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    return `${tgl} ${namaBulan[parseInt(bln) - 1]} ${thn} Pukul ${waktuMentah}`;
  };

  const formatRupiah = (angka) => {
    if (angka === 0) return "GRATIS";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);
  };

  return (
    <>
      <Navbar />
      <div className="container mt-5 mb-5" style={{ minHeight: "80vh" }}>
        <Link
          to="/events"
          className="btn btn-light border fw-semibold mb-4 px-3 py-2 rounded-3 shadow-sm"
        >
          ⬅️ Kembali ke List Event
        </Link>

        <div className="row g-5">
          <div className="col-md-6">
            <div className="position-sticky" style={{ top: "100px" }}>
              <img
                src={`http://localhost:5000/uploads/${event.main_image_url}`}
                className="img-fluid rounded-4 shadow-lg w-100 border"
                alt={event.title}
                style={{ maxHeight: "450px", objectFit: "cover" }}
                onError={(el) => {
                  el.target.src = "https://placehold.co/600x400?text=No+Banner";
                }}
              />
            </div>
          </div>

          <div className="col-md-6">
            <span className="badge bg-primary px-3 py-2 rounded-pill mb-2">
              Local Event
            </span>
            <h1 className="fw-bold text-dark mb-3 display-5">{event.title}</h1>

            <div className="d-flex flex-column gap-2 mb-4 p-3 bg-light rounded-3 border">
              <p className="text-muted mb-0 d-flex align-items-center gap-2">
                <span className="fs-5">📍</span> <strong>Lokasi:</strong>{" "}
                {event.location}
              </p>
              <div className="text-muted mb-0 d-flex align-items-start gap-2">
                <span className="fs-5">📅</span>
                <div>
                  <strong>Waktu Pelaksanaan:</strong>
                  <div className="small text-dark mt-1">
                    🛫 <span>Mulai: {formatDateTime(event.start_date)}</span>
                  </div>
                  <div className="small text-dark">
                    🛬 <span>Selesai: {formatDateTime(event.end_date)}</span>
                  </div>
                </div>
              </div>
              <p className="text-muted mb-0 d-flex align-items-center gap-2 mt-2">
                <span className="fs-5">🆔</span> <strong>Organizer ID:</strong>{" "}
                <span className="fw-semibold text-danger">
                  {event.organizer_id || "Admin (NULL)"}
                </span>
              </p>
            </div>

            <h5 className="fw-bold text-dark mt-4">Deskripsi Event</h5>
            <p
              className="text-dark lh-lg mt-2"
              style={{ textAlign: "justify" }}
            >
              {event.description ||
                "Tidak ada deskripsi detail untuk event ini gess."}
            </p>

            <div className="d-flex flex-column gap-2 mt-4">
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-primary btn-lg w-100 rounded-3 fw-bold py-3 shadow d-flex align-items-center justify-content-center gap-2"
              >
                <span className="fs-4">🎫</span> Beli Tiket Sekarang
              </button>

              <button
                className={`btn btn-lg w-100 rounded-3 fw-bold py-2 shadow-sm d-flex align-items-center justify-content-center gap-2 ${
                  isSaved
                    ? "btn-danger text-white"
                    : "btn-outline-warning text-dark"
                }`}
                onClick={handleToggleSave}
              >
                <span>
                  {isSaved ? "❌ Batalkan Simpan Event" : "🔖 Save Event Ini"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Galeri Foto Album */}
        {event.images && event.images.length > 0 && (
          <div className="mt-5 pt-5 border-top">
            <h4 className="fw-bold text-dark mb-4 pb-2 border-bottom d-inline-block">
              📸 Galeri Foto Album
            </h4>
            <div className="row g-3">
              {event.images.map((img) => (
                <div className="col-6 col-sm-4 col-md-3" key={img.id}>
                  <div className="card h-100 rounded-3 overflow-hidden shadow-sm border p-1 bg-white">
                    <img
                      src={`http://localhost:5000/uploads/${img.image_url}`}
                      alt="Dokumentasi Album Event"
                      className="w-100 h-100"
                      style={{
                        height: "180px",
                        objectFit: "cover",
                        borderRadius: "6px",
                      }}
                      onError={(el) => {
                        el.target.src =
                          "https://placehold.co/300x200?text=Error+Load";
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL CHECKOUT TICKETS AKTIF DI SINI GESS */}
      {showModal && (
        <>
          <div
            className="modal-backdrop fade show"
            onClick={() => setShowModal(false)}
            style={{ zIndex: 1040 }}
          ></div>
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            style={{ zIndex: 1050, top: "2%" }}
          >
            <div
              className="modal-dialog modal-dialog-centered modal-md"
              role="document"
            >
              <div className="modal-content border-0 rounded-4 shadow-lg">
                <div className="modal-header bg-primary text-white p-4 rounded-top-4">
                  <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                    <span>🎫</span> Formulir Pembelian Tiket & Diskon
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>

                <div
                  className="modal-body p-4"
                  style={{ maxHeight: "65vh", overflowY: "auto" }}
                >
                  <p className="text-muted small mb-3">
                    Silahkan tentukan jenis tiket dan voucher belanja untuk{" "}
                    <strong>{event.title}</strong>:
                  </p>

                  {/* Sektor 1: Opsi Radio Jenis Kategori Tiket */}
                  <h6 className="fw-bold mb-2 text-dark">
                    1. Pilih Jenis Kategori Tiket:
                  </h6>
                  {event.TicketTypes && event.TicketTypes.length > 0 ? (
                    <div className="d-flex flex-column gap-2 mb-3">
                      {event.TicketTypes.map((ticket) => (
                        <label
                          key={ticket.id}
                          className={`d-flex justify-content-between align-items-center p-3 border rounded-3 p-2 border-1 cursor-pointer ${
                            selectedTicket?.id === ticket.id
                              ? "border-primary bg-white shadow-sm"
                              : "bg-light"
                          }`}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <input
                              type="radio"
                              name="ticket-selection"
                              disabled={ticket.remaining_quota <= 0}
                              checked={selectedTicket?.id === ticket.id}
                              onChange={() => setSelectedTicket(ticket)}
                            />
                            <div>
                              <div className="fw-bold text-uppercase small text-dark">
                                {ticket.name}
                              </div>
                              <small className="text-muted">
                                Sisa: {ticket.remaining_quota} Tiket
                              </small>
                            </div>
                          </div>
                          <span className="badge bg-dark px-2 py-2 rounded-pill">
                            {formatRupiah(ticket.price)}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted small">
                      Event ini belum mengatur kuota tiket toko gess.
                    </p>
                  )}

                  {/* Sektor 2: Kuantitas Pembelian Tiket */}
                  <div className="mb-3">
                    <label className="fw-bold mb-1 text-dark d-block">
                      2. Tentukan Jumlah Pembelian:
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      value={quantity}
                      min="1"
                      max={selectedTicket ? selectedTicket.remaining_quota : 10}
                      onChange={(e) =>
                        setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                      }
                    />
                  </div>

                  {/* Sektor 3: Select Opsi Voucher Poin Milik User */}
                  <div className="mb-3 pt-2 border-top">
                    <label className="fw-bold mb-1 text-dark d-block">
                      3. Pasang Voucher Diskon Toko Poin (Milikmu:{" "}
                      {myVouchers.length}):
                    </label>
                    <select
                      className="form-select"
                      value={selectedVoucherId}
                      onChange={(e) => setSelectedVoucherId(e.target.value)}
                    >
                      <option value="">-- Tanpa Menggunakan Voucher --</option>
                      {myVouchers.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.Voucher?.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sektor 4: Preview Total Pembayaran Invoice */}
                  {selectedTicket && (
                    <div className="p-3 bg-dark text-white rounded-3 mt-3 d-flex justify-content-between align-items-center shadow">
                      <div>
                        <small className="text-light d-block">
                          Total Pembayaran Akhir:
                        </small>
                        <h4 className="fw-bold mb-0 text-warning">
                          {formatRupiah(calculatePreviewTotal())}
                        </h4>
                      </div>
                      {calculatePreviewTotal() >= 500000 && (
                        <span
                          className="badge bg-success small text-wrap animate-pulse"
                          style={{ maxWidth: "130px" }}
                        >
                          🎉 Dapat Bonus Bonus Poin Kelipatan!
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="modal-footer bg-light p-3 rounded-bottom-4 flex-column gap-2">
                  <button
                    type="button"
                    disabled={checkoutLoading || !selectedTicket}
                    className="btn btn-primary w-100 fw-bold py-2 rounded-3 shadow-sm"
                    onClick={handlePayTicket}
                  >
                    {checkoutLoading
                      ? "Membuka Gerbang Midtrans Snap..."
                      : "💳 Lanjut Bayar Sekarang via Midtrans"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary w-100 fw-semibold rounded-3"
                    onClick={() => setShowModal(false)}
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <AppModal
        show={appModal.show}
        title={appModal.title}
        message={appModal.message}
        type={appModal.type}
        showCancel={appModal.showCancel}
        confirmText={appModal.confirmText}
        cancelText={appModal.cancelText}
        onConfirm={appModal.onConfirm}
        onClose={closeAppModal}
      />

      <Footer />
    </>
  );
}

export default EventDetail;
