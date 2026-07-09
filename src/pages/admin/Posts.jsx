import React, { useEffect, useState } from "react";
import api from "../../config/api"; // ✅ Menggunakan instance api kita
import { getCurrentUser } from "../../config/auth";
import Navbar from "../../components/admin/Navbar";
import Footer from "../../components/admin/Footer";
import AppModal from "../../components/AppModal";


const API_BASE = "/social";

function Posts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);

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
      const res = await api.get(`${API_BASE}/admin/posts`);
      setPosts(res.data.data || []);
    } catch (error) {
      console.error("Gagal mengambil posts:", error);
      notify(
        "error",
        "Gagal Memuat",
        error.response?.data?.message || "Gagal mengambil daftar post.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Posts (Admin) | Eventify";
    fetchPosts();
  }, []);

  const handleDelete = (post) => {
    setModal({
      show: true,
      type: "warning",
      title: "Hapus Post",
      message: `Yakin ingin menghapus post milik "${post.User?.name}"? Semua komentarnya juga akan terhapus.`,
      showCancel: true,
      onConfirm: () => confirmDelete(post),
    });
  };

  const confirmDelete = async (post) => {
    closeModal();
    try {
      await api.delete(`${API_BASE}/posts/${post.id}`);
      setSelectedPost(null);
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

  const truncate = (text, max = 80) =>
    text?.length > max ? `${text.slice(0, max)}…` : text;

  const filtered = posts.filter(
    (p) =>
      p.content?.toLowerCase().includes(search.toLowerCase()) ||
      p.User?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.User?.email?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <Navbar />

      <div className="container mt-5 mb-5" style={{ minHeight: "80vh" }}>
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
          <div>
            <h2 className="fw-bold mb-1">📰 Posts</h2>
            <p className="text-muted mb-0">
              Moderasi post yang dibuat pengguna di Feed.
            </p>
          </div>

          <div className="text-end">
            <div className="small text-muted">Total Post</div>
            <div className="fs-4 fw-bold text-primary">{posts.length}</div>
          </div>
        </div>

        <div className="mb-3" style={{ maxWidth: "360px" }}>
          <input
            type="text"
            className="form-control"
            placeholder="Cari konten atau nama user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted mt-2">Memuat posts...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5 bg-light border rounded-4">
            <h5 className="text-muted fw-normal mb-0">
              {search
                ? "Tidak ada post yang cocok dengan pencarian."
                : "Belum ada post dari pengguna."}
            </h5>
          </div>
        ) : (
          <div className="table-responsive bg-white rounded-4 shadow-sm border p-3">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: "70px" }}>ID</th>
                  <th>Penulis</th>
                  <th>Konten</th>
                  <th className="text-center">Komentar</th>
                  <th>Tanggal</th>
                  <th className="text-end" style={{ width: "180px" }}>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((post) => (
                  <tr key={post.id}>
                    <td className="text-muted">{post.id}</td>
                    <td>
                      <div className="fw-semibold">
                        {post.User?.name || "—"}
                      </div>
                      <div className="small text-muted">
                        {post.User?.email || ""}
                      </div>
                    </td>
                    <td className="text-muted">{truncate(post.content)}</td>
                    <td className="text-center">
                      <span className="badge bg-light text-dark border">
                        {post.comment_count}
                      </span>
                    </td>
                    <td className="text-muted small">
                      {formatDate(post.created_at)}
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary fw-semibold rounded-3"
                          onClick={() => setSelectedPost(post)}
                        >
                          <i className="bi bi-eye"></i> Lihat
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger fw-semibold rounded-3"
                          onClick={() => handleDelete(post)}
                        >
                          <i className="bi bi-trash"></i> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL PREVIEW POST */}
      {selectedPost && (
        <>
          <div
            className="modal-backdrop fade show"
            style={{ zIndex: 1900 }}
          ></div>

          <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            style={{ zIndex: 1910 }}
          >
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content border-0 rounded-4 shadow-lg">
                <div className="modal-header bg-primary text-white rounded-top-4">
                  <h5 className="modal-title fw-bold mb-0">
                    📰 Post #{selectedPost.id}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setSelectedPost(null)}
                  ></button>
                </div>

                <div className="modal-body p-4">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <i className="bi bi-person-circle fs-3 text-secondary"></i>
                    <div>
                      <div className="fw-bold">{selectedPost.User?.name}</div>
                      <div className="small text-muted">
                        {formatDate(selectedPost.created_at)}
                      </div>
                    </div>
                  </div>

                  <p style={{ whiteSpace: "pre-line" }}>
                    {selectedPost.content}
                  </p>

                  {selectedPost.image_url && (
                    <img
                      src={selectedPost.image_url}
                      alt="Post"
                      className="img-fluid rounded-3 border"
                    />
                  )}
                </div>

                <div className="modal-footer bg-light rounded-bottom-4">
                  <button
                    type="button"
                    className="btn btn-outline-danger fw-semibold"
                    onClick={() => handleDelete(selectedPost)}
                  >
                    <i className="bi bi-trash"></i> Hapus Post
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary fw-bold"
                    onClick={() => setSelectedPost(null)}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

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

export default Posts;
