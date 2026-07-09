import React, { useEffect, useState } from "react";
import api from "../../config/api"; // ✅ Menggunakan instance api kita
import { getCurrentUser } from "../../config/auth";
import Navbar from "../../components/admin/Navbar";
import Footer from "../../components/admin/Footer";
import AppModal from "../../components/AppModal";


const API_BASE = "/events/categories";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // Form modal (create / edit)
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });

  // Feedback / confirm modal (pakai AppModal bawaan)
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

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await api.get(API_BASE);
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Gagal mengambil kategori:", error);
      notify(
        "error",
        "Gagal Memuat",
        error.response?.data?.message || "Gagal mengambil daftar kategori."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Categories (Admin) | Eventify";
    fetchCategories();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: "", description: "" });
    setShowForm(true);
  };

  const openEdit = (category) => {
    setEditingId(category.id);
    setForm({
      name: category.name || "",
      description: category.description || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || form.name.trim().length < 2) {
      notify("warning", "Validasi", "Nama kategori minimal 2 karakter.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
      };

      if (editingId) {
        await api.put(`${API_BASE}/${editingId}`, payload);
      } else {
        await api.post(API_BASE, payload);
      }

      setShowForm(false);
      await fetchCategories();
      notify(
        "success",
        "Berhasil",
        editingId
          ? "Kategori berhasil diperbarui."
          : "Kategori berhasil dibuat."
      );
    } catch (error) {
      console.error("Gagal menyimpan kategori:", error);
      notify(
        "error",
        "Gagal",
        error.response?.data?.message || "Gagal menyimpan kategori."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (category) => {
    setModal({
      show: true,
      type: "warning",
      title: "Hapus Kategori",
      message: `Yakin ingin menghapus kategori "${category.name}"?`,
      showCancel: true,
      onConfirm: () => confirmDelete(category),
    });
  };

  const confirmDelete = async (category) => {
    closeModal();
    try {
      await api.delete(`${API_BASE}/${category.id}`);
      await fetchCategories();
      notify("success", "Berhasil", "Kategori berhasil dihapus.");
    } catch (error) {
      console.error("Gagal menghapus kategori:", error);
      notify(
        "error",
        "Gagal",
        error.response?.data?.message || "Gagal menghapus kategori."
      );
    }
  };

  const filtered = categories.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Navbar />

      <div className="container mt-5 mb-5" style={{ minHeight: "80vh" }}>
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
          <div>
            <h2 className="fw-bold mb-1">🗂️ Categories</h2>
            <p className="text-muted mb-0">
              Kelola kategori untuk event dan chat room.
            </p>
          </div>

          <button className="btn btn-primary fw-semibold" onClick={openCreate}>
            <i className="bi bi-plus-lg"></i> Tambah Kategori
          </button>
        </div>

        <div className="mb-3" style={{ maxWidth: "320px" }}>
          <input
            type="text"
            className="form-control"
            placeholder="Cari kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted mt-2">Memuat kategori...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5 bg-light border rounded-4">
            <h5 className="text-muted fw-normal mb-0">
              {search
                ? "Tidak ada kategori yang cocok dengan pencarian."
                : "Belum ada kategori. Klik “Tambah Kategori” untuk membuat."}
            </h5>
          </div>
        ) : (
          <div className="table-responsive bg-white rounded-4 shadow-sm border p-3">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: "70px" }}>ID</th>
                  <th>Nama</th>
                  <th>Deskripsi</th>
                  <th className="text-end" style={{ width: "160px" }}>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((category) => (
                  <tr key={category.id}>
                    <td className="text-muted">{category.id}</td>
                    <td className="fw-semibold">{category.name}</td>
                    <td className="text-muted">
                      {category.description || (
                        <span className="fst-italic">— tidak ada —</span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary fw-semibold rounded-3"
                          onClick={() => openEdit(category)}
                        >
                          <i className="bi bi-pencil"></i> Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger fw-semibold rounded-3"
                          onClick={() => handleDelete(category)}
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

      {/* CREATE / EDIT FORM MODAL */}
      {showForm && (
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
                <form onSubmit={handleSubmit}>
                  <div className="modal-header bg-primary text-white rounded-top-4">
                    <h5 className="modal-title fw-bold mb-0">
                      {editingId ? "✏️ Edit Kategori" : "➕ Tambah Kategori"}
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => setShowForm(false)}
                    ></button>
                  </div>

                  <div className="modal-body p-4">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Nama Kategori
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Contoh: Music, Technology, Sport"
                        value={form.name}
                        onChange={(e) =>
                          setForm({ ...form, name: e.target.value })
                        }
                        autoFocus
                      />
                    </div>

                    <div className="mb-1">
                      <label className="form-label fw-semibold">
                        Deskripsi{" "}
                        <span className="text-muted fw-normal">(opsional)</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Deskripsi singkat kategori..."
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                      ></textarea>
                    </div>
                  </div>

                  <div className="modal-footer bg-light rounded-bottom-4">
                    <button
                      type="button"
                      className="btn btn-light border fw-semibold"
                      onClick={() => setShowForm(false)}
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

      {/* FEEDBACK / CONFIRM MODAL */}
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

export default Categories;
