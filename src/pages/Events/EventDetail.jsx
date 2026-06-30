import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { AUTH_USER } from "../../config/auth";

function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  // 🔥 State Baru: Untuk mengontrol pop-up modal tiket gess
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/events/${id}`)
      .then((res) => {
        setEvent(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal memuat detail event:", err);
        setLoading(false);
      });

    axios
      .get(
        `http://localhost:5000/api/events/${id}/check-save?user_id=${AUTH_USER.id}`,
      )
      .then((res) => setIsSaved(res.data.isSaved))
      .catch((err) => console.error(err));
  }, [id]);

  const handleToggleSave = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/events/toggle-save",
        {
          user_id: AUTH_USER.id,
          event_id: id,
        },
      );
      alert(res.data.message);
      setIsSaved(res.data.isSaved);
    } catch (err) {
      console.error(err);
      alert("Gagal memproses simpan event.");
    }
  };

  if (loading)
    return (
      <div className="text-center my-5 p-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Memuat detail event...</p>
      </div>
    );

  if (!event)
    return (
      <div className="container mt-5 text-center my-5 py-5 bg-light rounded-4">
        <h3 className="text-muted">Waduh, Event tidak ditemukan gess!</h3>
        <Link to="/events" className="btn btn-primary mt-3 rounded-pill px-4">
          Back ke List Event
        </Link>
      </div>
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

  // 🔥 Fungsi formatter rupiah gess
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
              {/* 🔥 Ketika diklik, langsung set state modal jadi true gess */}
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-primary btn-lg w-100 rounded-3 fw-bold py-3 shadow d-flex align-items-center justify-content-center gap-2"
              >
                <span className="fs-4">🎫</span> Beli Tiket Sekarang
              </button>

              <button
                className={`btn btn-lg w-100 rounded-3 fw-bold py-2 shadow-sm d-flex align-items-center justify-content-center gap-2 ${isSaved ? "btn-danger text-white" : "btn-outline-warning text-dark"}`}
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

      {/* 🔥 MODAL POP-UP TICKETS SELECTION (BOOTSTRAP PURE CSS-REACT TRIGGERED) */}
      {showModal && (
        <>
          {/* Backdrop / Background hitam transparan gess */}
          <div
            className="modal-backdrop fade show"
            onClick={() => setShowModal(false)}
            style={{ zIndex: 1040 }}
          ></div>

          {/* Box Main Modal */}
          <div
            className="modal fade show d-block animate__animated animate__fadeInUp"
            tabIndex="-1"
            role="dialog"
            style={{ zIndex: 1050, top: "10%" }}
          >
            <div
              className="modal-dialog modal-dialog-centered modal-md"
              role="document"
            >
              <div className="modal-content border-0 rounded-4 shadow-lg">
                {/* Header Pop Up */}
                <div className="modal-header bg-primary text-white p-4 rounded-top-4">
                  <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                    <span>🎫</span> Kategori Tiket Tersedia
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    aria-label="Close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>

                {/* Body Pop Up Konten Tiket */}
                <div
                  className="modal-body p-4"
                  style={{ maxHeight: "60vh", overflowY: "auto" }}
                >
                  <p className="text-muted small mb-3">
                    Silahkan pilih jenis tiket untuk event{" "}
                    <strong>{event.title}</strong>:
                  </p>

                  {event.ticket_types && event.ticket_types.length > 0 ? (
                    <div className="d-flex flex-column gap-3">
                      {event.ticket_types.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="d-flex justify-content-between align-items-center p-3 border-2 rounded-3 bg-light hover-shadow transition-all"
                        >
                          <div>
                            <div className="fw-bold text-dark text-uppercase mb-1">
                              {ticket.name}
                            </div>
                            <small className="text-muted d-block">
                              Sisa Kuota:{" "}
                              <span
                                className={
                                  ticket.remaining_quota > 0
                                    ? "text-success fw-bold"
                                    : "text-danger fw-bold"
                                }
                              >
                                {ticket.remaining_quota} / {ticket.quota} Tiket
                              </span>
                            </small>
                          </div>
                          <div className="text-end">
                            <span className="badge bg-dark fs-6 px-3 py-2 rounded-pill shadow-sm">
                              {formatRupiah(ticket.price)}
                            </span>
                            {/* Di-disable dulu sesuai instruksi alur transaksi belum jalan */}
                            <button
                              disabled
                              className="btn btn-sm btn-outline-secondary d-block mt-2 w-100 fw-bold rounded-pill"
                              style={{ fontSize: "11px" }}
                            >
                              Pilih
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-muted mb-0">
                        Waduh gess! Event ini belum mengonfigurasi tipe tiket
                        masuk.
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer Pop Up */}
                <div className="modal-footer bg-light p-3 rounded-bottom-4">
                  <button
                    type="button"
                    className="btn btn-secondary w-100 fw-bold rounded-3"
                    onClick={() => setShowModal(false)}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <Footer />
    </>
  );
}

export default EventDetail;
