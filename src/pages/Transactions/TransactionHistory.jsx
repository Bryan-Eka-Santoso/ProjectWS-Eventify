import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../config/api"; // ✅ Menggunakan instance api kita
import { getCurrentUser } from "../../config/auth";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

const API_BASE = "/transactions";

const STATUS_BADGE = {
  paid: "bg-success",
  pending: "bg-warning text-dark",
  expired: "bg-secondary",
  failed: "bg-danger",
};

function TransactionHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Transaction History | Eventify";

    const fetchTransactions = async () => {
      try {
        const res = await api.get(`${API_BASE}/my`);
        setTransactions(res.data.data || []);
      } catch (error) {
        console.error("Gagal mengambil riwayat transaksi:", error);
      } finally {
        setLoading(false);
      }
    };

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
    tx.Details?.[0]?.TicketType?.Event?.title || "Event";

  return (
    <>
      <Navbar />

      <div
        className="container mt-5 mb-5"
        style={{ minHeight: "75vh", maxWidth: "860px" }}
      >
        <div className="mb-4 border-bottom pb-3">
          <h2 className="fw-bold mb-1">🧾 Transaction History</h2>
          <p className="text-muted mb-0">
            Riwayat pembelian tiket event kamu.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted mt-2">Memuat transaksi...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-5 bg-light border rounded-4">
            <h5 className="text-muted fw-normal mb-2">
              Belum ada transaksi.
            </h5>
            <p className="small text-muted mb-3">
              Yuk cari event menarik dan beli tiket pertamamu!
            </p>
            <Link
              to="/events"
              className="btn btn-primary btn-sm fw-bold rounded-pill px-4"
            >
              Explore Events
            </Link>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {transactions.map((tx) => (
              <Link
                key={tx.id}
                to={`/transactions/${tx.id}`}
                className="card border rounded-4 shadow-sm text-decoration-none text-dark"
              >
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <div className="small text-muted mb-1">
                        Transaksi #{tx.id} · {formatDate(tx.created_at)}
                      </div>
                      <h5 className="fw-bold mb-0">{getEventTitle(tx)}</h5>
                    </div>
                    <span
                      className={`badge text-uppercase ${
                        STATUS_BADGE[tx.payment_status] || "bg-secondary"
                      }`}
                    >
                      {tx.payment_status}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center border-top pt-3">
                    <div className="small text-muted">
                      {tx.Details?.length || 0} jenis tiket
                      {tx.earned_points > 0 && (
                        <span className="text-success ms-2">
                          +{tx.earned_points} pts
                        </span>
                      )}
                      {tx.refund_status !== "none" && (
                        <span className="badge bg-info text-dark ms-2 text-uppercase">
                          Refund: {tx.refund_status}
                        </span>
                      )}
                    </div>
                    <div className="fw-bold fs-5 text-primary">
                      {formatRupiah(tx.final_amount)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}

export default TransactionHistory;
