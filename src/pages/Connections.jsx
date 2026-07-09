import React, { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../config/api"; // ✅ Menggunakan instance api kita
import { getCurrentUser } from "../config/auth";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AppModal from "../components/AppModal";
import { AUTH_USER } from "../config/auth";

const API_BASE = `http://localhost:5000/api/social`;

// Satu halaman untuk dua route: /profile/followers dan /profile/following
function Connections() {
  const location = useLocation();
  const initialTab = location.pathname.endsWith("/following")
    ? "following"
    : "followers";

  // ✅ Panggil sekali saja di atas, lebih aman dan hemat memori
  const currentUser = getCurrentUser(); 

  const [activeTab, setActiveTab] = useState(initialTab);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
  });

  const closeModal = () => setModal((m) => ({ ...m, show: false }));

  const notify = (type, title, message) =>
    setModal({ show: true, type, title, message });

  const fetchConnections = useCallback(async () => {
    if (!currentUser) return; // Jaga-jaga kalau token null
    
    try {
      setLoading(true);
      // ✅ URL lebih pendek, dan viewer_id sudah dihapus karena backend otomatis baca token
      const [followersRes, followingRes] = await Promise.all([
        api.get(`/social/users/${currentUser.id}/followers`),
        api.get(`/social/users/${currentUser.id}/following`),
      ]);
      setFollowers(followersRes.data.data || []);
      setFollowing(followingRes.data.data || []);
    } catch (error) {
      console.error("Gagal mengambil data koneksi:", error);
      notify(
        "error",
        "Gagal Memuat",
        error.response?.data?.message || "Gagal mengambil data followers."
      );
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]); // Masukkan currentUser sebagai dependency

  useEffect(() => {
    document.title =
      activeTab === "followers"
        ? "Followers | Eventify"
        : "Following | Eventify";
  }, [activeTab]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleFollow = async (user) => {
    try {
      // ✅ Payload jauh lebih ringkas! follower_id dihapus.
      await api.post("/social/follow", {
        following_id: user.id, 
      });
      await fetchConnections();
    } catch (error) {
      notify(
        "error",
        "Gagal",
        error.response?.data?.message || "Gagal follow user."
      );
    }
  };

  const handleUnfollow = async (user) => {
    try {
      // ✅ Payload jauh lebih ringkas! follower_id dihapus.
      await api.delete("/social/follow", {
        data: { following_id: user.id },
      });
      await fetchConnections();
    } catch (error) {
      notify(
        "error",
        "Gagal",
        error.response?.data?.message || "Gagal unfollow user."
      );
    }
  };

  const renderUserCard = (user, mode) => (
    <div key={user.id} className="card border rounded-4 shadow-sm">
      <div className="card-body p-3 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          <i className="bi bi-person-circle fs-2 text-secondary"></i>
          <div>
            <div className="fw-bold">
              {user.name}
              {user.role === "organizer" && (
                <span className="badge bg-info text-dark ms-2">Organizer</span>
              )}
            </div>
            <div className="small text-muted">
              {user.bio || "Belum ada bio."}
            </div>
          </div>
        </div>

        {mode === "followers" ? (
          user.is_followed_by_viewer ? (
            <button
              className="btn btn-sm btn-outline-secondary fw-semibold rounded-pill px-3"
              onClick={() => handleUnfollow(user)}
            >
              Following ✓
            </button>
          ) : (
            <button
              className="btn btn-sm btn-primary fw-semibold rounded-pill px-3"
              onClick={() => handleFollow(user)}
            >
              + Follow Back
            </button>
          )
        ) : (
          <button
            className="btn btn-sm btn-outline-danger fw-semibold rounded-pill px-3"
            onClick={() => handleUnfollow(user)}
          >
            Unfollow
          </button>
        )}
      </div>
    </div>
  );

  const activeList = activeTab === "followers" ? followers : following;

  return (
    <>
      <Navbar />

      <div
        className="container mt-5 mb-5"
        style={{ minHeight: "75vh", maxWidth: "720px" }}
      >
        <Link
          to="/profile"
          className="btn btn-light border fw-semibold mb-4 px-3 py-2 rounded-3 shadow-sm"
        >
          ⬅️ Kembali ke Profile
        </Link>

        <div className="mb-4 border-bottom pb-3">
          <h2 className="fw-bold mb-1">👥 Koneksi</h2>
          <p className="text-muted mb-0">
            Daftar followers dan orang yang kamu ikuti.
          </p>
        </div>

        <ul className="nav nav-pills mb-4 gap-2">
          <li className="nav-item">
            <button
              className={`nav-link fw-semibold ${
                activeTab === "followers" ? "active" : ""
              }`}
              onClick={() => setActiveTab("followers")}
            >
              Followers ({followers.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link fw-semibold ${
                activeTab === "following" ? "active" : ""
              }`}
              onClick={() => setActiveTab("following")}
            >
              Following ({following.length})
            </button>
          </li>
        </ul>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted mt-2">Memuat data...</p>
          </div>
        ) : activeList.length === 0 ? (
          <div className="text-center py-5 bg-light border rounded-4">
            <h5 className="text-muted fw-normal mb-2">
              {activeTab === "followers"
                ? "Belum ada yang mengikutimu."
                : "Kamu belum mengikuti siapa pun."}
            </h5>
            <p className="small text-muted mb-0">
              Aktif di <Link to="/feed">Feed</Link> untuk terhubung dengan
              pengguna lain!
            </p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {activeList.map((user) => renderUserCard(user, activeTab))}
          </div>
        )}
      </div>

      <AppModal
        show={modal.show}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />

      <Footer />
    </>
  );
}

export default Connections;