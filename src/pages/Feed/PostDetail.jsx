import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AppModal from "../../components/AppModal";
import { AUTH_USER } from "../../config/auth";

const API_BASE = "http://localhost:5000/api/social";

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentBody, setCommentBody] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  const [followStats, setFollowStats] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);

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

  const fetchPost = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/posts/${id}`);
      setPost(res.data.data);
      return res.data.data;
    } catch (error) {
      console.error("Gagal mengambil post:", error);
      setPost(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchFollowStats = useCallback(async (authorId) => {
    try {
      const res = await axios.get(
        `${API_BASE}/users/${authorId}/follow-stats`,
        { params: { viewer_id: AUTH_USER.id } },
      );
      setFollowStats(res.data.data);
    } catch (error) {
      console.error("Gagal mengambil follow stats:", error);
    }
  }, []);

  useEffect(() => {
    document.title = "Detail Post | Eventify";

    const load = async () => {
      const loadedPost = await fetchPost();
      if (loadedPost?.User?.id) {
        fetchFollowStats(loadedPost.User.id);
      }
    };

    load();
  }, [fetchPost, fetchFollowStats]);

  const handleToggleFollow = async () => {
    if (!post?.User?.id) return;

    try {
      setFollowLoading(true);

      if (followStats?.is_following) {
        await axios.delete(`${API_BASE}/follow`, {
          data: { follower_id: AUTH_USER.id, following_id: post.User.id },
        });
      } else {
        await axios.post(`${API_BASE}/follow`, {
          follower_id: AUTH_USER.id,
          following_id: post.User.id,
        });
      }

      await fetchFollowStats(post.User.id);
    } catch (error) {
      console.error("Gagal follow/unfollow:", error);
      notify(
        "error",
        "Gagal",
        error.response?.data?.message || "Gagal memproses follow.",
      );
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!commentBody.trim()) {
      notify("warning", "Validasi", "Komentar tidak boleh kosong.");
      return;
    }

    try {
      setSendingComment(true);

      await axios.post(`${API_BASE}/posts/${id}/comments`, {
        user_id: AUTH_USER.id,
        body: commentBody.trim(),
      });

      setCommentBody("");
      await fetchPost();
    } catch (error) {
      console.error("Gagal mengirim komentar:", error);
      notify(
        "error",
        "Gagal",
        error.response?.data?.message || "Gagal mengirim komentar.",
      );
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = (comment) => {
    setModal({
      show: true,
      type: "warning",
      title: "Hapus Komentar",
      message: "Yakin ingin menghapus komentar ini?",
      showCancel: true,
      onConfirm: () => confirmDeleteComment(comment),
    });
  };

  const confirmDeleteComment = async (comment) => {
    closeModal();
    try {
      await axios.delete(`${API_BASE}/comments/${comment.id}`, {
        data: { user_id: AUTH_USER.id, role: AUTH_USER.role },
      });
      await fetchPost();
    } catch (error) {
      console.error("Gagal menghapus komentar:", error);
      notify(
        "error",
        "Gagal",
        error.response?.data?.message || "Gagal menghapus komentar.",
      );
    }
  };

  const handleDeletePost = () => {
    setModal({
      show: true,
      type: "warning",
      title: "Hapus Post",
      message: "Yakin ingin menghapus post ini?",
      showCancel: true,
      onConfirm: confirmDeletePost,
    });
  };

  const confirmDeletePost = async () => {
    closeModal();
    try {
      await axios.delete(`${API_BASE}/posts/${id}`, {
        data: { user_id: AUTH_USER.id, role: AUTH_USER.role },
      });
      navigate("/feed");
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

  const isAuthor = post && Number(post.user_id) === Number(AUTH_USER.id);
  const comments = post?.PostComments || [];

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
        ) : !post ? (
          <div className="text-center py-5 bg-light border rounded-4">
            <h5 className="text-muted fw-normal">Post tidak ditemukan.</h5>
          </div>
        ) : (
          <>
            {/* POST */}
            <div className="card border rounded-4 shadow-sm mb-4">
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-person-circle fs-2 text-secondary"></i>
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
                        {followStats && (
                          <span className="ms-2">
                            · {followStats.followers} followers
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="d-flex gap-2">
                    {!isAuthor && (
                      <button
                        className={`btn btn-sm fw-semibold rounded-pill px-3 ${
                          followStats?.is_following
                            ? "btn-outline-secondary"
                            : "btn-primary"
                        }`}
                        onClick={handleToggleFollow}
                        disabled={followLoading}
                      >
                        {followStats?.is_following ? "Following ✓" : "+ Follow"}
                      </button>
                    )}

                    {isAuthor && (
                      <>
                        <Link
                          to={`/feed/${post.id}/edit`}
                          className="btn btn-sm btn-outline-primary rounded-3"
                        >
                          <i className="bi bi-pencil"></i> Edit
                        </Link>
                        <button
                          className="btn btn-sm btn-outline-danger rounded-3"
                          onClick={handleDeletePost}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <p className="mb-3 fs-6" style={{ whiteSpace: "pre-line" }}>
                  {post.content}
                </p>

                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt="Post"
                    className="img-fluid rounded-3 border"
                  />
                )}
              </div>
            </div>

            {/* KOMENTAR */}
            <div className="card border rounded-4 shadow-sm">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3">
                  💬 Komentar ({comments.length})
                </h5>

                <form onSubmit={handleSubmitComment} className="mb-4">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tulis komentar..."
                      value={commentBody}
                      onChange={(e) => setCommentBody(e.target.value)}
                    />
                    <button
                      className="btn btn-primary fw-semibold"
                      type="submit"
                      disabled={sendingComment}
                    >
                      {sendingComment ? "..." : "Kirim"}
                    </button>
                  </div>
                </form>

                {comments.length === 0 ? (
                  <p className="text-muted text-center mb-0">
                    Belum ada komentar. Jadilah yang pertama!
                  </p>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="d-flex gap-2 border-bottom pb-3"
                      >
                        <i className="bi bi-person-circle fs-4 text-secondary"></i>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-semibold">
                              {comment.User?.name || "Pengguna"}
                            </span>
                            <div className="d-flex align-items-center gap-2">
                              <span className="small text-muted">
                                {formatDate(comment.created_at)}
                              </span>
                              {(Number(comment.user_id) ===
                                Number(AUTH_USER.id) ||
                                AUTH_USER.role === "admin") && (
                                <button
                                  className="btn btn-sm btn-link text-danger p-0"
                                  onClick={() => handleDeleteComment(comment)}
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="mb-0">{comment.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
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

export default PostDetail;
