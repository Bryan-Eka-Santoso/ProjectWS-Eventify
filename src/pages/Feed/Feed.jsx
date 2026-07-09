import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../config/api"; // ✅ Menggunakan instance api kita
import { getCurrentUser } from "../../config/auth";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AppModal from "../../components/AppModal";

const API_BASE = "/social";

function Feed() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
    showCancel: false,
    onConfirm: null,
  });

  const closeModal = () => setModal((m) => ({ ...m, show: false }));

  const notify = (type, title, message) =>
    setModal({
      show: true,
      type,
      title,
      message,
      showCancel: false,
      onConfirm: null,
    });

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${API_BASE}/posts`);
      setPosts(res.data.data || []);
    } catch (error) {
      console.error("Gagal mengambil feed:", error);
      notify(
        "error",
        "Gagal Memuat",
        error.response?.data?.message || "Gagal mengambil feed posts.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Feed | Eventify";
    fetchPosts();
  }, []);

  const handleDelete = (post) => {
    setModal({
      show: true,
      type: "warning",
      title: "Hapus Post",
      message: "Yakin ingin menghapus post ini?",
      showCancel: true,
      onConfirm: () => confirmDelete(post),
    });
  };

  const confirmDelete = async (post) => {
    closeModal();
    try {
      await api.delete(`${API_BASE}/posts/${post.id}`);
      await fetchPosts();
      notify("success", "Berhasil", "Post berhasil dihapus.");
    } catch (error) {
      console.error("Gagal menghapus post:", error);
      notify(
        "error",
        "Gagal",
        error.response?.data?.message || "Gagal menghapus post.",
      );
    }
  };

  const formatDate = (date) =>
    new Date(date).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <>
      <Navbar />

      <div
        className="container mt-5 mb-5"
        style={{ minHeight: "75vh", maxWidth: "720px" }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
          <div>
            <h2 className="fw-bold mb-1">📰 Feed</h2>
            <p className="text-muted mb-0">
              Lihat apa yang sedang dibicarakan komunitas Eventify.
            </p>
          </div>

          <Link to="/feed/create" className="btn btn-primary fw-semibold">
            <i className="bi bi-plus-lg"></i> Buat Post
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted mt-2">Memuat feed...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-5 bg-light border rounded-4">
            <h5 className="text-muted fw-normal mb-2">
              Belum ada post di feed.
            </h5>
            <p className="small text-muted mb-3">
              Jadilah yang pertama berbagi cerita!
            </p>
            <Link
              to="/feed/create"
              className="btn btn-primary btn-sm fw-bold rounded-pill px-4"
            >
              Buat Post Pertamamu
            </Link>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {posts.map((post) => (
              <div
                key={post.id}
                className="card border rounded-4 shadow-sm"
              >
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-person-circle fs-3 text-secondary"></i>
                      <div>
                        <div className="fw-bold">
                          {post.User?.name || "Pengguna"}
                          {post.User?.role === "organizer" && (
                            <span className="badge bg-info text-dark ms-2">
                              Organizer
                            </span>
                          )}
                        </div>
                        <div className="small text-muted">
                          {formatDate(post.created_at)}
                        </div>
                      </div>
                    </div>

                    {Number(post.user_id) === Number(getCurrentUser().id) && (
                      <div className="d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary rounded-3"
                          onClick={() => navigate(`/feed/${post.id}/edit`)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger rounded-3"
                          onClick={() => handleDelete(post)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="mb-3" style={{ whiteSpace: "pre-line" }}>
                    {post.content}
                  </p>

                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt="Post"
                      className="img-fluid rounded-3 border mb-3"
                      style={{ maxHeight: "360px", objectFit: "cover" }}
                    />
                  )}

                  <div className="d-flex align-items-center gap-3 border-top pt-3">
                    <Link
                      to={`/feed/${post.id}`}
                      className="text-decoration-none small fw-semibold"
                    >
                      <i className="bi bi-chat me-1"></i>
                      {post.comment_count} Komentar
                    </Link>
                    <Link
                      to={`/feed/${post.id}`}
                      className="text-decoration-none small text-muted ms-auto"
                    >
                      Lihat Detail →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AppModal
        show={modal.show}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        showCancel={modal.showCancel}
        confirmText={modal.showCancel ? "Hapus" : "OK"}
        cancelText="Batal"
        onConfirm={modal.onConfirm}
        onClose={closeModal}
      />

      <Footer />
    </>
  );
}

export default Feed;
