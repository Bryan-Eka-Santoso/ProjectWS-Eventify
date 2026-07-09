import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../../components/admin/Navbar";
import Footer from "../../components/admin/Footer";
import AppModal from "../../components/AppModal";
import { AUTH_USER } from "../../config/auth";

const SERVER_URL = "http://localhost:5000";
const API_BASE = `${SERVER_URL}/api/community`;

const imageSrc = (url) => {
  if (!url) return "https://via.placeholder.com/80?text=No+Img";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/uploads/")) return `${SERVER_URL}${url}`;
  return `${SERVER_URL}/uploads/${url}`;
};

function ChatRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/admin/all-rooms`, {
        params: { role: AUTH_USER.role },
      });
      setRooms(res.data?.data || []);
    } catch (error) {
      console.error("Gagal mengambil chat room:", error);
      notify(
        "error",
        "Gagal Memuat",
        error.response?.data?.message || "Gagal mengambil daftar chat room."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Chat Rooms (Admin) | Eventify";
    fetchRooms();
  }, []);

  const handleDelete = (room) => {
    setModal({
      show: true,
      type: "warning",
      title: "Hapus Chat Room",
      message: `Yakin ingin menghapus chat room "${room.name}"? Semua pesan & member di dalamnya akan ikut terhapus permanen.`,
      showCancel: true,
      onConfirm: () => confirmDelete(room),
    });
  };

  const confirmDelete = async (room) => {
    closeModal();
    try {
      await axios.delete(`${API_BASE}/admin/rooms/${room.id}`, {
        data: { role: AUTH_USER.role },
      });
      await fetchRooms();
      notify("success", "Berhasil", "Chat room berhasil dihapus.");
    } catch (error) {
      console.error("Gagal menghapus chat room:", error);
      notify(
        "error",
        "Gagal",
        error.response?.data?.message || "Gagal menghapus chat room."
      );
    }
  };

  const formatDate = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("id-ID", { dateStyle: "medium" });
  };

  const filtered = rooms.filter(
    (r) =>
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.Creator?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Navbar />

      <div className="container mt-5 mb-5" style={{ minHeight: "80vh" }}>
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
          <div>
            <h2 className="fw-bold mb-1">💬 Chat Rooms</h2>
            <p className="text-muted mb-0">
              Pantau dan kelola semua chat room komunitas.
            </p>
          </div>

          <span className="badge bg-primary fs-6">
            Total: {rooms.length} room
          </span>
        </div>

        <div className="mb-3" style={{ maxWidth: "320px" }}>
          <input
            type="text"
            className="form-control"
            placeholder="Cari nama room / creator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted mt-2">Memuat chat room...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5 bg-light border rounded-4">
            <h5 className="text-muted fw-normal mb-0">
              Tidak ada chat room yang cocok.
            </h5>
          </div>
        ) : (
          <div className="table-responsive bg-white rounded-4 shadow-sm border p-3">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Chat Room</th>
                  <th>Creator</th>
                  <th className="text-center">Member</th>
                  <th className="text-center">Dibuat</th>
                  <th className="text-end" style={{ width: "120px" }}>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((room) => (
                  <tr key={room.id}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <img
                          src={imageSrc(room.profile_image_url)}
                          alt={room.name}
                          style={{
                            width: "48px",
                            height: "48px",
                            objectFit: "cover",
                            borderRadius: "12px",
                          }}
                        />
                        <div>
                          <div className="fw-bold">{room.name}</div>
                          <small className="text-muted">
                            {room.description || "— tanpa deskripsi —"}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      {room.Creator ? (
                        <>
                          <div className="fw-semibold">{room.Creator.name}</div>
                          <small className="text-muted">
                            {room.Creator.email}
                          </small>
                        </>
                      ) : (
                        <span className="text-muted fst-italic">
                          Tidak diketahui
                        </span>
                      )}
                    </td>

                    <td className="text-center">
                      <span className="badge bg-info text-dark">
                        {room.member_count ?? 0}
                      </span>
                    </td>

                    <td className="text-center">
                      {formatDate(room.created_at)}
                    </td>

                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-danger fw-semibold rounded-3"
                        onClick={() => handleDelete(room)}
                      >
                        <i className="bi bi-trash"></i> Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

export default ChatRooms;
