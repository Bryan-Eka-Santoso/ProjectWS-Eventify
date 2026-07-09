import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../../components/admin/Navbar";
import Footer from "../../components/admin/Footer";
import AppModal from "../../components/AppModal";
import { AUTH_USER } from "../../config/auth";

const API_BASE = "http://localhost:5000/api/transactions/admin/all";

const STATUS_BADGE = {
  paid: "bg-success",
  pending: "bg-warning text-dark",
  expired: "bg-secondary",
  failed: "bg-danger",
};

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTx, setSelectedTx] = useState(null);

  const [modal, setModal] = useState({
    show: false,
    type: "info",
    title: "",
    message: "",
  });

  const closeModal = () => setModal((m) => ({ ...m, show: false }));

  const notify = (type, title, message) =>
    setModal({ show: true, type, title, message });

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_BASE, {
        params: { role: AUTH_USER.role },
      });
      setTransactions(res.data.data || []);
    } catch (error) {
      console.error("Gagal mengambil transaksi:", error);
      notify(
        "error",
        "Gagal Memuat",
        error.response?.data?.message || "Gagal mengambil daftar transaksi.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Transactions (Admin) | Eventify";
    fetchTransactions();
  }, []);

  const formatRupiah = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0);

  const formatDate = (date) =>
    new Date(date).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const getEventTitle = (tx) =>
    tx.Details?.[0]?.TicketType?.Event?.title || "—";

  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      tx.User?.name?.toLowerCase().includes(search.toLowerCase()) ||
      tx.User?.email?.toLowerCase().includes(search.toLowerCase()) ||
      getEventTitle(tx).toLowerCase().includes(search.toLowerCase()) ||
      String(tx.id).includes(search);
    const matchesStatus =
      statusFilter === "all" || tx.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = transactions
    .filter((tx) => tx.payment_status === "paid")
    .reduce((sum, tx) => sum + (tx.final_amount || 0), 0);

  return (
    <>
      <Navbar />

      <div className="container mt-5 mb-5" style={{ minHeight: "80vh" }}>
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3 flex-wrap gap-2">
          <div>
            <h2 className="fw-bold mb-1">💳 Transactions</h2>
            <p className="text-muted mb-0">
              Pantau semua transaksi pembelian tiket di Eventify.
            </p>
          </div>

          <div className="d-flex gap-4 text-end">
            <div>
              <div className="small text-muted">Total Transaksi</div>
              <div className="fs-4 fw-bold text-primary">
                {transactions.length}
              </div>
            </div>
            <div>
              <div className="small text-muted">Revenue (Paid)</div>
              <div className="fs-4 fw-bold text-success">
                {formatRupiah(totalRevenue)}
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex gap-2 mb-3 flex-wrap">
          <input
            type="text"
            className="form-control"
            style={{ maxWidth: "320px" }}
            placeholder="Cari user, email, event, atau ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="form-select"
            style={{ maxWidth: "180px" }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Semua Status</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted mt-2">Memuat transaksi...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5 bg-light border rounded-4">
            <h5 className="text-muted fw-normal mb-0">
              Tidak ada transaksi yang cocok dengan filter.
            </h5>
          </div>
        ) : (
          <div className="table-responsive bg-white rounded-4 shadow-sm border p-3">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: "70px" }}>ID</th>
                  <th>User</th>
                  <th>Event</th>
                  <th>Tanggal</th>
                  <th className="text-end">Total</th>
                  <th>Status</th>
                  <th>Refund</th>
                  <th className="text-end" style={{ width: "100px" }}>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((tx) => (
                  <tr key={tx.id}>
                    <td className="text-muted">#{tx.id}</td>
                    <td>
                      <div className="fw-semibold">{tx.User?.name || "—"}</div>
                      <div className="small text-muted">
                        {tx.User?.email || ""}
                      </div>
                    </td>
                    <td className="fw-semibold">{getEventTitle(tx)}</td>
                    <td className="text-muted small">
                      {formatDate(tx.created_at)}
                    </td>
                    <td className="text-end fw-semibold">
                      {formatRupiah(tx.final_amount)}
                    </td>
                    <td>
                      <span
                        className={`badge text-uppercase ${
                          STATUS_BADGE[tx.payment_status] || "bg-secondary"
                        }`}
                      >
                        {tx.payment_status}
                      </span>
                    </td>
                    <td>
                      {tx.refund_status === "none" ? (
                        <span className="text-muted small">—</span>
                      ) : (
                        <span className="badge bg-info text-dark text-uppercase">
                          {tx.refund_status}
                        </span>
                      )}
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-primary fw-semibold rounded-3"
                        onClick={() => setSelectedTx(tx)}
                      >
                        <i className="bi bi-eye"></i> Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DETAIL TRANSAKSI */}
      {selectedTx && (
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
                    💳 Transaksi #{selectedTx.id}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setSelectedTx(null)}
                  ></button>
                </div>

                <div className="modal-body p-4">
                  <div className="mb-3">
                    <div className="small text-muted">Pembeli</div>
                    <div className="fw-semibold">
                      {selectedTx.User?.name} ({selectedTx.User?.email})
                    </div>
                  </div>

                  <table className="table table-sm align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Tiket</th>
                        <th className="text-center">Qty</th>
                        <th className="text-end">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedTx.Details || []).map((detail) => (
                        <tr key={detail.id}>
                          <td>
                            <div className="fw-semibold">
                              {detail.TicketType?.Event?.title || "Event"}
                            </div>
                            <div className="small text-muted text-uppercase">
                              {detail.TicketType?.name}
                            </div>
                          </td>
                          <td className="text-center">{detail.quantity}</td>
                          <td className="text-end">
                            {formatRupiah(detail.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="bg-light rounded-3 p-3">
                    <div className="d-flex justify-content-between mb-1 small">
                      <span className="text-muted">Total</span>
                      <span>{formatRupiah(selectedTx.total_amount)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-1 small text-success">
                      <span>Diskon</span>
                      <span>-{formatRupiah(selectedTx.discount_amount)}</span>
                    </div>
                    <div className="d-flex justify-content-between fw-bold border-top pt-2 mt-1">
                      <span>Total Bayar</span>
                      <span className="text-primary">
                        {formatRupiah(selectedTx.final_amount)}
                      </span>
                    </div>
                  </div>

                  <div className="row mt-3 small">
                    <div className="col-6">
                      <div className="text-muted">Metode</div>
                      <div className="fw-semibold">
                        {selectedTx.payment_method || "—"}
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-muted">Poin Didapat</div>
                      <div className="fw-semibold text-success">
                        +{selectedTx.earned_points || 0} pts
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light rounded-bottom-4">
                  <button
                    type="button"
                    className="btn btn-primary fw-bold"
                    onClick={() => setSelectedTx(null)}
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
        onClose={closeModal}
      />

      <Footer />
    </>
  );
}

export default Transactions;
