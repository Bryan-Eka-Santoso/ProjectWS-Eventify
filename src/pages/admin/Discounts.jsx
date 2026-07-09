import React, { useEffect, useState } from "react";
import api from "../../config/api"; // ✅ Menggunakan instance api kita
import { getCurrentUser } from "../../config/auth";
import Navbar from "../../components/admin/Navbar";
import Footer from "../../components/admin/Footer";
import AppModal from "../../components/AppModal";

const API_BASE = "/events/vouchers";

const emptyForm = {
  code: "",
  name: "",
  percentage: "",
  max_cut: "",
  points_required: "",
  stock: "",
  valid_until: "",
  is_active: true,
};

function Discounts() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

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

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${API_BASE}/admin-list`);
      setVouchers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Gagal mengambil voucher:", error);
      notify(
        "error",
        "Gagal Memuat",
        error.response?.data?.message || "Gagal mengambil daftar voucher."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Discounts (Admin) | Eventify";
    fetchVouchers();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (voucher) => {
    setEditingId(voucher.id);
    setForm({
      code: voucher.code || "",
      name: voucher.name || "",
      percentage: voucher.percentage ?? "",
      max_cut: voucher.max_cut ?? "",
      points_required: voucher.points_required ?? "",
      stock: voucher.stock ?? "",
      // input type=date butuh format YYYY-MM-DD
      valid_until: voucher.valid_until ? voucher.valid_until.slice(0, 10) : "",
      is_active: !!voucher.is_active,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.code || form.code.trim().length < 3) {
      notify("warning", "Validasi", "Kode voucher minimal 3 karakter.");
      return;
    }
    if (!form.name || form.name.trim().length < 2) {
      notify("warning", "Validasi", "Nama voucher minimal 2 karakter.");
      return;
    }
    if (
      form.percentage !== "" &&
      (Number(form.percentage) < 1 || Number(form.percentage) > 100)
    ) {
      notify("warning", "Validasi", "Persentase diskon harus antara 1 - 100.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        code: form.code.trim(),
        name: form.name.trim(),
        percentage: form.percentage === "" ? null : Number(form.percentage),
        max_cut: form.max_cut === "" ? null : Number(form.max_cut),
        points_required:
          form.points_required === "" ? 0 : Number(form.points_required),
        stock: form.stock === "" ? null : Number(form.stock),
        valid_until: form.valid_until || null,
        is_active: form.is_active,
      };

      if (editingId) {
        await api.put(`${API_BASE}/${editingId}`, payload);
      } else {
        await api.post(API_BASE, payload);
      }

      setShowForm(false);
      await fetchVouchers();
      notify(
        "success",
        "Berhasil",
        editingId ? "Voucher berhasil diperbarui." : "Voucher berhasil dibuat."
      );
    } catch (error) {
      console.error("Gagal menyimpan voucher:", error);
      notify(
        "error",
        "Gagal",
        error.response?.data?.message || "Gagal menyimpan voucher."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (voucher) => {
    setModal({
      show: true,
      type: "warning",
      title: "Hapus Voucher",
      message: `Yakin ingin menghapus voucher "${voucher.code}"?`,
      showCancel: true,
      onConfirm: () => confirmDelete(voucher),
    });
  };

  const confirmDelete = async (voucher) => {
    closeModal();
    try {
      await api.delete(`${API_BASE}/${voucher.id}`);
      await fetchVouchers();
      notify("success", "Berhasil", "Voucher berhasil dihapus.");
    } catch (error) {
      console.error("Gagal menghapus voucher:", error);
      notify(
        "error",
        "Gagal",
        error.response?.data?.message || "Gagal menghapus voucher."
      );
    }
  };

  const formatDate = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("id-ID", { dateStyle: "medium" });
  };

  const filtered = vouchers.filter(
    (v) =>
      v.code?.toLowerCase().includes(search.toLowerCase()) ||
      v.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Navbar />

      <div className="container mt-5 mb-5" style={{ minHeight: "80vh" }}>
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
          <div>
            <h2 className="fw-bold mb-1">🏷️ Discounts</h2>
            <p className="text-muted mb-0">
              Kelola voucher diskon yang bisa diklaim user.
            </p>
          </div>

          <button className="btn btn-primary fw-semibold" onClick={openCreate}>
            <i className="bi bi-plus-lg"></i> Tambah Voucher
          </button>
        </div>

        <div className="mb-3" style={{ maxWidth: "320px" }}>
          <input
            type="text"
            className="form-control"
            placeholder="Cari kode / nama voucher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted mt-2">Memuat voucher...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5 bg-light border rounded-4">
            <h5 className="text-muted fw-normal mb-0">
              {search
                ? "Tidak ada voucher yang cocok dengan pencarian."
                : "Belum ada voucher. Klik “Tambah Voucher” untuk membuat."}
            </h5>
          </div>
        ) : (
          <div className="table-responsive bg-white rounded-4 shadow-sm border p-3">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Kode</th>
                  <th>Nama</th>
                  <th className="text-center">Diskon</th>
                  <th className="text-center">Max Potongan</th>
                  <th className="text-center">Poin</th>
                  <th className="text-center">Stok</th>
                  <th className="text-center">Berlaku s/d</th>
                  <th className="text-center">Status</th>
                  <th className="text-end" style={{ width: "160px" }}>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <span className="badge bg-dark-subtle text-dark border font-monospace">
                        {v.code}
                      </span>
                    </td>
                    <td className="fw-semibold">{v.name}</td>
                    <td className="text-center">
                      {v.percentage != null ? `${v.percentage}%` : "—"}
                    </td>
                    <td className="text-center">
                      {v.max_cut != null
                        ? `Rp${Number(v.max_cut).toLocaleString("id-ID")}`
                        : "—"}
                    </td>
                    <td className="text-center">{v.points_required ?? 0}</td>
                    <td className="text-center">
                      {v.stock != null ? v.stock : "∞"}
                    </td>
                    <td className="text-center">{formatDate(v.valid_until)}</td>
                    <td className="text-center">
                      {v.is_active ? (
                        <span className="badge bg-success">Aktif</span>
                      ) : (
                        <span className="badge bg-secondary">Non-aktif</span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary fw-semibold rounded-3"
                          onClick={() => openEdit(v)}
                        >
                          <i className="bi bi-pencil"></i> Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger fw-semibold rounded-3"
                          onClick={() => handleDelete(v)}
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
            <div
              className="modal-dialog modal-dialog-centered modal-lg"
              role="document"
            >
              <div className="modal-content border-0 rounded-4 shadow-lg">
                <form onSubmit={handleSubmit}>
                  <div className="modal-header bg-primary text-white rounded-top-4">
                    <h5 className="modal-title fw-bold mb-0">
                      {editingId ? "✏️ Edit Voucher" : "➕ Tambah Voucher"}
                    </h5>
                    <button
                      type="button"
                      className="btn-close btn-close-white"
                      onClick={() => setShowForm(false)}
                    ></button>
                  </div>

                  <div className="modal-body p-4">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Kode Voucher
                        </label>
                        <input
                          type="text"
                          className="form-control text-uppercase"
                          placeholder="Contoh: NEWYEAR25"
                          value={form.code}
                          onChange={(e) =>
                            setForm({ ...form, code: e.target.value })
                          }
                          autoFocus
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Nama Voucher
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Contoh: Diskon Tahun Baru"
                          value={form.name}
                          onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                          }
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Diskon (%)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          className="form-control"
                          placeholder="1 - 100"
                          value={form.percentage}
                          onChange={(e) =>
                            setForm({ ...form, percentage: e.target.value })
                          }
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Maks. Potongan (Rp)
                        </label>
                        <input
                          type="number"
                          min="0"
                          className="form-control"
                          placeholder="Kosongkan jika tanpa batas"
                          value={form.max_cut}
                          onChange={(e) =>
                            setForm({ ...form, max_cut: e.target.value })
                          }
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Poin Dibutuhkan
                        </label>
                        <input
                          type="number"
                          min="0"
                          className="form-control"
                          placeholder="0"
                          value={form.points_required}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              points_required: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Stok{" "}
                          <span className="text-muted fw-normal">
                            (kosong = tak terbatas)
                          </span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          className="form-control"
                          placeholder="Kosongkan untuk tak terbatas"
                          value={form.stock}
                          onChange={(e) =>
                            setForm({ ...form, stock: e.target.value })
                          }
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Berlaku Sampai
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          value={form.valid_until}
                          onChange={(e) =>
                            setForm({ ...form, valid_until: e.target.value })
                          }
                        />
                      </div>

                      <div className="col-md-6 d-flex align-items-end">
                        <div className="form-check form-switch fs-5">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="voucherActive"
                            checked={form.is_active}
                            onChange={(e) =>
                              setForm({ ...form, is_active: e.target.checked })
                            }
                          />
                          <label
                            className="form-check-label fs-6 fw-semibold ms-1"
                            htmlFor="voucherActive"
                          >
                            Voucher Aktif
                          </label>
                        </div>
                      </div>
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

export default Discounts;
