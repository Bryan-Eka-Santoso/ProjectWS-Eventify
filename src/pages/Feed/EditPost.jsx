import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AppModal from "../../components/AppModal";
import { AUTH_USER } from "../../config/auth";

const API_BASE = "http://localhost:5000/api/social";

function EditPost() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

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
    document.title = "Edit Post | Eventify";

    const fetchPost = async () => {
      try {
        const res = await axios.get(`${API_BASE}/posts/${id}`);
        const post = res.data.data;

        if (Number(post.user_id) !== Number(AUTH_USER.id)) {
          notify(
            "error",
            "Akses Ditolak",
            "Kamu hanya bisa mengedit post milikmu sendiri.",
            () => {
              closeModal();
              navigate("/feed");
            },
          );
          return;
        }

        setContent(post.content || "");
        setImageUrl(post.image_url || "");
      } catch (error) {
        console.error("Gagal mengambil post:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content || content.trim().length < 3) {
      notify("warning", "Validasi", "Konten post minimal 3 karakter.");
      return;
    }

    try {
      setSaving(true);

      await axios.put(`${API_BASE}/posts/${id}`, {
        user_id: AUTH_USER.id,
        content: content.trim(),
        image_url: imageUrl.trim() || null,
      });

      notify("success", "Berhasil", "Post berhasil diperbarui!", () => {
        closeModal();
        navigate(`/feed/${id}`);
      });
    } catch (error) {
      console.error("Gagal memperbarui post:", error);
      notify(
        "error",
        "Gagal",
        error.response?.data?.message || "Gagal memperbarui post.",
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

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted mt-2">Memuat post...</p>
          </div>
        ) : notFound ? (
          <div className="text-center py-5 bg-light border rounded-4">
            <h5 className="text-muted fw-normal">Post tidak ditemukan.</h5>
          </div>
        ) : (
          <div className="card border rounded-4 shadow-sm">
            <div className="card-body p-4">
              <h4 className="fw-bold mb-3">✏️ Edit Post</h4>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Konten</label>
                  <textarea
                    className="form-control"
                    rows="5"
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
                  <Link
                    to={`/feed/${id}`}
                    className="btn btn-light border fw-semibold"
                  >
                    Batal
                  </Link>
                  <button
                    type="submit"
                    className="btn btn-primary fw-bold px-4"
                    disabled={saving}
                  >
                    {saving ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
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

export default EditPost;
