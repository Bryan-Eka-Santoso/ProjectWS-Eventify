import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../config/api"; // ✅ Menggunakan instance api kita
import { getCurrentUser } from "../../config/auth";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AppModal from "../../components/AppModal";

function ValidateTicket() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [ticketCode, setTicketCode] = useState("");
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState(null);

  const [modal, setModal] = useState({
    show: false,
    title: "",
    message: "",
    type: "info",
  });

  const showInfoModal = (title, message, type = "info") => {
    setModal({
      show: true,
      title,
      message,
      type,
    });
  };

  const closeModal = () => {
    setModal((prev) => ({
      ...prev,
      show: false,
    }));
  };

  const fetchEvent = async () => {
    try {
      setLoadingEvent(true);

      const res = await api.get(`/events/${id}`);
      setEvent(res.data);
    } catch (error) {
      console.error("Gagal mengambil detail event:", error);
      showInfoModal(
        "Gagal Mengambil Detail Event",
        error.response?.data?.message || "Gagal mengambil detail event.",
        "error",
      );
    } finally {
      setLoadingEvent(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const handleValidateTicket = async (e) => {
    e.preventDefault();

    if (!ticketCode.trim()) {
      showInfoModal(
        "Kode Tiket Wajib Diisi",
        "Kode tiket wajib diisi.",
        "warning",
      );
      return;
    }

    try {
      setValidating(true);
      setResult(null);

      const res = await api.patch(`/events/${id}/tickets/validate`, {
        ticket_code: ticketCode.trim(),
      });

      setResult({
        success: true,
        message: res.data.message,
        data: res.data.data,
      });

      setTicketCode("");
    } catch (error) {
      console.error("Gagal validasi tiket:", error);

      setResult({
        success: false,
        message:
          error.response?.data?.message ||
          "Kode tiket tidak valid atau gagal divalidasi.",
        data: null,
      });
    } finally {
      setValidating(false);
    }
  };

  if (getCurrentUser().role !== "organizer" && getCurrentUser().role !== "admin") {
    return (
      <>
        <Navbar />

        <div className="container py-5" style={{ minHeight: "80vh" }}>
          <div className="alert alert-danger rounded-4 shadow-sm">
            <h5 className="fw-bold mb-1">Akses Ditolak</h5>
            <p className="mb-0">
              Halaman validasi tiket hanya dapat diakses organizer atau admin.
            </p>
          </div>
        </div>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="container mt-5 mb-5" style={{ minHeight: "80vh" }}>
        <div className="mb-4">
          <Link
            to="/events/my-events"
            className="btn btn-light border fw-semibold rounded-3"
          >
            ⬅️ Kembali ke My Events
          </Link>
        </div>

        <div className="row g-4">
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-primary text-white p-4 rounded-top-4">
                <h4 className="fw-bold mb-0">🎫 Validasi Tiket</h4>
              </div>

              <div className="card-body p-4">
                {loadingEvent ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary"></div>
                    <p className="text-muted mt-2 mb-0">Memuat event...</p>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-light rounded-3 border">
                    <h5 className="fw-bold mb-1">
                      {event?.title || "Event tidak ditemukan"}
                    </h5>
                    <p className="text-muted small mb-1">
                      📍 {event?.location || "-"}
                    </p>
                    <p className="text-muted small mb-0">
                      Status:{" "}
                      <strong className="text-uppercase">
                        {event?.status || "-"}
                      </strong>
                    </p>
                  </div>
                )}

                <form onSubmit={handleValidateTicket}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Masukkan Kode Tiket
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      placeholder="Contoh: TIX-I4YHWP-9-9"
                      value={ticketCode}
                      onChange={(e) => setTicketCode(e.target.value)}
                    />
                    <small className="text-muted">
                      Kode ini diambil dari tiket user yang ditampilkan ke
                      panitia.
                    </small>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 fw-bold py-2 rounded-3"
                    disabled={validating}
                  >
                    {validating ? "Memvalidasi..." : "Validasi Tiket"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            {!result ? (
              <div className="card border-0 shadow-sm rounded-4 h-100">
                <div className="card-body p-5 text-center d-flex flex-column justify-content-center">
                  <div style={{ fontSize: "4rem" }}>🧾</div>
                  <h5 className="fw-bold mt-3">Belum ada hasil validasi</h5>
                  <p className="text-muted mb-0">
                    Masukkan kode tiket, lalu klik tombol validasi.
                  </p>
                </div>
              </div>
            ) : result.success ? (
              <div className="card border-success shadow-sm rounded-4 h-100">
                <div className="card-header bg-success text-white p-4 rounded-top-4">
                  <h4 className="fw-bold mb-0">✅ Tiket Valid</h4>
                </div>

                <div className="card-body p-4">
                  <div className="alert alert-success rounded-3">
                    {result.message}
                  </div>

                  <div className="mb-3">
                    <small className="text-muted">Kode Tiket</small>
                    <h4 className="fw-bold text-dark">
                      {result.data?.ticket_code}
                    </h4>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded-3 border">
                        <small className="text-muted">Event</small>
                        <div className="fw-bold">
                          {result.data?.event?.title || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded-3 border">
                        <small className="text-muted">Kategori Tiket</small>
                        <div className="fw-bold">
                          {result.data?.ticket_type?.name || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded-3 border">
                        <small className="text-muted">Nama Buyer</small>
                        <div className="fw-bold">
                          {result.data?.buyer?.name || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="p-3 bg-light rounded-3 border">
                        <small className="text-muted">Email Buyer</small>
                        <div className="fw-bold">
                          {result.data?.buyer?.email || "-"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-dark text-white rounded-3 text-center">
                    <small>Status Tiket</small>
                    <h3 className="fw-bold text-warning mb-0 text-uppercase">
                      {result.data?.status}
                    </h3>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card border-danger shadow-sm rounded-4 h-100">
                <div className="card-header bg-danger text-white p-4 rounded-top-4">
                  <h4 className="fw-bold mb-0">❌ Tiket Tidak Valid</h4>
                </div>

                <div className="card-body p-4">
                  <div className="alert alert-danger rounded-3">
                    {result.message}
                  </div>

                  <p className="text-muted mb-0">
                    Pastikan kode tiket benar, belum digunakan, belum direfund,
                    dan memang berasal dari event ini.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AppModal
        show={modal.show}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={closeModal}
      />

      <Footer />
    </>
  );
}

export default ValidateTicket;
