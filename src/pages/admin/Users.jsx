import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../../components/admin/Navbar";
import Footer from "../../components/admin/Footer";
import AppModal from "../../components/AppModal";
import { AUTH_USER } from "../../config/auth";

const API_BASE = "http://localhost:5000/api/social/admin/users";

const ROLE_BADGE = {
  admin: "bg-danger",
  organizer: "bg-info text-dark",
  user: "bg-secondary",
};

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Modal ganti role
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState("user");

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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_BASE, {
        params: { role: AUTH_USER.role },
      });
      setUsers(res.data.data || []);
    } catch (error) {
      console.error("Gagal mengambil users:", error);
      notify(
        "error",
        "Gagal Memuat",
        error.response?.data?.message || "Gagal mengambil daftar user.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Users (Admin) | Eventify";
    fetchUsers();
  }, []);

  const openRoleForm = (user) => {
    setEditingUser(user);
    setNewRole(user.role);
    setShowRoleForm(true);
  };

  const handleSubmitRole = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      await axios.put(`${API_BASE}/${editingUser.id}/role`, {
        role: AUTH_USER.role,
        new_role: newRole,
      });

      setShowRoleForm(false);
      await fetchUsers();
      notify("success", "Berhasil", "Role user berhasil diubah.");
    } catch (error) {
      console.error("Gagal mengubah role:", error);
      notify(
        "error",
        "Gagal",
        error.response?.data?.message || "Gagal mengubah role user.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (user) => {
    setModal({
      show: true,
      type: "warning",
      title: "Hapus User",
      message: `Yakin ingin menghapus user "${user.name}" (${user.email})?`,
      showCancel: true,
      onConfirm: () => confirmDelete(user),
    });
  };

  const confirmDelete = async (user) => {
    closeModal();
    try {
      await axios.delete(`${API_BASE}/${user.id}`, {
        data: { role: AUTH_USER.role, admin_id: AUTH_USER.id },
      });
      await fetchUsers();
      notify("success", "Berhasil", "User berhasil dihapus.");
    } catch (error) {
      console.error("Gagal menghapus user:", error);
      notify(
        "error",
        "Gagal",
        error.response?.data?.message || "Gagal menghapus user.",
      );
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <>
      <Navbar />

      <div className="container mt-5 mb-5" style={{ minHeight: "80vh" }}>
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
          <div>
            <h2 className="fw-bold mb-1">👤 Users</h2>
            <p className="text-muted mb-0">
              Kelola user, organizer, dan admin Eventify.
            </p>
          </div>

          <div className="text-end">
            <div className="small text-muted">Total User</div>
            <div className="fs-4 fw-bold text-primary">{users.length}</div>
          </div>
        </div>

        <div className="d-flex gap-2 mb-3 flex-wrap">
          <input
            type="text"
            className="form-control"
            style={{ maxWidth: "320px" }}
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="form-select"
            style={{ maxWidth: "180px" }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">Semua Role</option>
            <option value="admin">Admin</option>
            <option value="organizer">Organizer</option>
            <option value="user">User</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted mt-2">Memuat users...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5 bg-light border rounded-4">
            <h5 className="text-muted fw-normal mb-0">
              Tidak ada user yang cocok dengan filter.
            </h5>
          </div>
        ) : (
          <div className="table-responsive bg-white rounded-4 shadow-sm border p-3">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: "70px" }}>ID</th>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th className="text-end">Points</th>
                  <th className="text-end" style={{ width: "200px" }}>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id}>
                    <td className="text-muted">{user.id}</td>
                    <td className="fw-semibold">{user.name}</td>
                    <td className="text-muted">{user.email}</td>
                    <td>
                      <span
                        className={`badge text-uppercase ${
                          ROLE_BADGE[user.role] || "bg-secondary"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="text-end">{user.points ?? 0} pts</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary fw-semibold rounded-3"
                          onClick={() => openRoleForm(user)}
                          disabled={user.id === AUTH_USER.id}
                        >
                          <i className="bi bi-person-gear"></i> Role
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger fw-semibold rounded-3"
                          onClick={() => handleDelete(user)}
                          disabled={user.id === AUTH_USER.id}
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

      {/* MODAL GANTI ROLE */}
      {showRoleForm && editingUser && (
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
                <form onSubmit={handleSubmitRole}>
                  <div className="modal-header bg-primary text-white rounded-top-4">
                    <h5 className="modal-title fw-bold mb-0">
                      👤 Ubah Role: {editingUser.name}
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => setShowRoleForm(false)}
                    ></button>
                  </div>

                  <div className="modal-body p-4">
                    <label className="form-label fw-semibold">Role Baru</label>
                    <select
                      className="form-select"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="organizer">Organizer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="modal-footer bg-light rounded-bottom-4">
                    <button
                      type="button"
                      className="btn btn-light border fw-semibold"
                      onClick={() => setShowRoleForm(false)}
                      disabled={saving}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary fw-bold"
                      disabled={saving}
                    >
                      {saving ? "Menyimpan..." : "Simpan"}
                    </button>
                  </div>
                </form>
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

export default Users;
