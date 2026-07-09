import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../config/api"; // ✅ Menggunakan instance api kita
import { getCurrentUser } from "../../config/auth";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AppModal from "../../components/AppModal";
import { AUTH_USER } from "../../config/auth";

const API_BASE = `http://localhost:5000/api/social`;

function CreatePost() {
  const navigate = useNavigate();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);

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
    document.title = "Buat Post | Eventify";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content || content.trim().length < 3) {
      notify("warning", "Validasi", "Konten post minimal 3 karakter.");
      return;
    }

    try {
      setSaving(true);

      await api.post(`${API_BASE}/posts`, {
        content: content.trim(),
        image_url: imageUrl.trim() || null,
      });

      notify("success", "Berhasil", "Post berhasil dibuat!", () => {
        closeModal();
        navigate("/feed");
      });
    } catch (error) {
      console.error("Gagal membuat post:", error);
      notify(
        "error",
        "Gagal",
        error.response?.data?.message || "Gagal membuat post.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar />

      <div
        className="container mt-5 mb-5"
        style={{ minHeight: "75vh", maxWidth: "720px" }}
      >
        <Link
          to="/feed"
          className="btn btn-light border fw-semibold mb-4 px-3 py-2 rounded-3 shadow-sm"
        >
          ⬅️ Kembali ke Feed
        </Link>

        <div className="card border rounded-4 shadow-sm">
          <div className="card-body p-4">
            <h4 className="fw-bold mb-3">✏️ Buat Post Baru</h4>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Apa yang ingin kamu bagikan?
                </label>
                <textarea
                  className="form-control"
                  rows="5"
                  placeholder="Tulis ceritamu di sini..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  autoFocus
                ></textarea>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold">
                  URL Gambar{" "}
                  <span className="text-muted fw-normal">(opsional)</span>
                </label>
                <input
                  type="url"
                  className="form-control"
                  placeholder="https://contoh.com/gambar.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              <div className="d-flex justify-content-end gap-2">
                <Link to="/feed" className="btn btn-light border fw-semibold">
                  Batal
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary fw-bold px-4"
                  disabled={saving}
                >
                  {saving ? "Memposting..." : "Posting"}
                </button>
              </div>
            </form>
          </div>
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

      <Footer />
    </>
  );
}

export default CreatePost;
