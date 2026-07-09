import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AppModal from "../components/AppModal";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const id = searchParams.get("id");
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [modal, setModal] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
  });

  const closeModal = () => setModal((m) => ({ ...m, show: false }));

  const notify = (type, title, message, onConfirm = null) =>
    setModal({ show: true, type, title, message, onConfirm });

  useEffect(() => {
    document.title = "Reset Password | Eventify";
  }, []);

  const invalidLink = !id || !token;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      notify("warning", "Validasi", "Password baru minimal 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      notify("warning", "Validasi", "Konfirmasi password tidak sama.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `http://localhost:${process.env.PORT}/api/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, token, newPassword }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        notify("error", "Gagal", data.message || "Terjadi kesalahan.");
        return;
      }

      notify(
        "success",
        "Berhasil",
        "Password berhasil direset. Silakan login dengan password barumu.",
        () => {
          closeModal();
          navigate("/login");
        },
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
          <h3 className="fw-bold mb-2">🔒 Reset Password</h3>

          {invalidLink ? (
            <>
              <div className="alert alert-danger rounded-3 mt-3">
                Link reset password tidak valid. Silakan minta link baru lewat
                halaman Forgot Password.
              </div>
              <div className="text-center">
                <Link to="/forgot-password" className="text-decoration-none">
                  Minta Link Baru
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-muted mb-4">
                Masukkan password baru untuk akunmu.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Password Baru
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-lock"></i>
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Minimal 6 karakter"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Konfirmasi Password Baru
                  </label>
                  <div className="input-group">
                    <span className="input-group-text">
                      <i className="bi bi-lock-fill"></i>
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Ulangi password baru"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                    {loading ? "Menyimpan..." : "Reset Password"}
                  </button>
                </div>
              </form>

              <div className="text-center">
                <Link to="/login" className="text-decoration-none small">
                  ← Kembali ke Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <AppModal
        show={modal.show}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onClose={closeModal}
      />
    </div>
  );
}

export default ResetPassword;
