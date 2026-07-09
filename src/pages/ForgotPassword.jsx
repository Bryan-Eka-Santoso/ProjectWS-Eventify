import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppModal from "../components/AppModal";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [devResetLink, setDevResetLink] = useState(null);

  const [modal, setModal] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
  });

  const closeModal = () => setModal((m) => ({ ...m, show: false }));

  const notify = (type, title, message) =>
    setModal({ show: true, type, title, message });

  useEffect(() => {
    document.title = "Forgot Password | Eventify";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      notify("warning", "Validasi", "Masukkan email akunmu dulu.");
      return;
    }

    try {
      setLoading(true);
      setDevResetLink(null);

      const response = await fetch(
        "http://localhost:5000/api/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        notify("error", "Gagal", data.message || "Terjadi kesalahan.");
        return;
      }

      if (data.dev_reset_link) {
        setDevResetLink(data.dev_reset_link);
      }

      notify(
        "success",
        "Permintaan Terkirim",
        "Jika email terdaftar, link reset password sudah dikirim. Silakan cek inbox (dan folder spam) email kamu.",
      );
    } catch (error) {
      console.error(error);
      notify(
        "error",
        "Gagal",
        "Tidak bisa terhubung ke server. Coba lagi nanti.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div
        className="card border-0 shadow-lg rounded-4 w-100"
        style={{ maxWidth: "480px" }}
      >
        <div className="card-body p-4 p-md-5">
          <h3 className="fw-bold mb-2">🔑 Forgot Password</h3>

          <p className="text-muted mb-4">
            Masukkan email akunmu. Kami akan mengirim link untuk membuat
            password baru.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label fw-semibold">Email Address</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bi bi-envelope-at"></i>
                </span>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Enter Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  required
                />
              </div>
            </div>

            <div className="d-grid mb-3">
              <button
                className="btn btn-primary fw-bold"
                type="submit"
                disabled={loading}
              >
                {loading ? "Mengirim..." : "Kirim Link Reset"}
              </button>
            </div>
          </form>

          {devResetLink && (
            <div className="alert alert-warning small rounded-3">
              <strong>Mode Development:</strong> SMTP belum dikonfigurasi, jadi
              link reset ditampilkan di sini:
              <br />
              <a href={devResetLink} className="text-break">
                {devResetLink}
              </a>
            </div>
          )}

          <div className="text-center">
            <Link to="/login" className="text-decoration-none small">
              ← Kembali ke Login
            </Link>
          </div>
        </div>
      </div>

      <AppModal
        show={modal.show}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />
    </div>
  );
}

export default ForgotPassword;
