import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
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

function TransactionDetail() {
  const { id } = useParams();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    document.title = "Transaction Detail | Eventify";

    const fetchTransaction = async () => {
      try {
        const res = await api.get(`${API_BASE}/${id}`);
        setTransaction(res.data.data);
      } catch (error) {
        console.error("Gagal mengambil detail transaksi:", error);
        setErrorMessage(
          error.response?.data?.message || "Transaksi tidak ditemukan.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [id]);

  const formatRupiah = (amount) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount || 0);

  const formatDate = (date) =>
    new Date(date).toLocaleString("id-ID", {
      dateStyle: "long",
      timeStyle: "short",
    });

  const details = transaction?.Details || [];
  const event = details[0]?.TicketType?.Event;

  return (
    <>
      <Navbar />

      <div
        className="container mt-5 mb-5"
        style={{ minHeight: "75vh", maxWidth: "720px" }}
      >
        <Link
          to="/transactions"
          className="btn btn-light border fw-semibold mb-4 px-3 py-2 rounded-3 shadow-sm"
        >
          ⬅️ Kembali ke Riwayat Transaksi
        </Link>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted mt-2">Memuat detail transaksi...</p>
          </div>
        ) : errorMessage ? (
          <div className="text-center py-5 bg-light border rounded-4">
            <h5 className="text-muted fw-normal">{errorMessage}</h5>
          </div>
        ) : (
          <div className="card border rounded-4 shadow-sm overflow-hidden">
            <div className="bg-primary text-white p-4 d-flex justify-content-between align-items-center">
              <div>
                <div className="small text-white-50">Transaksi</div>
                <h4 className="fw-bold mb-0">#{transaction.id}</h4>
              </div>
              <span
                className={`badge fs-6 text-uppercase ${
                  STATUS_BADGE[transaction.payment_status] || "bg-secondary"
                }`}
              >
                {transaction.payment_status}
              </span>
            </div>

            <div className="card-body p-4">
              {event && (
                <div className="mb-4">
                  <h5 className="fw-bold mb-1">{event.title}</h5>
                  <p className="text-muted small mb-0">
                    📍 {event.location}
                    <br />
                    🗓️ {formatDate(event.start_date)}
                  </p>
                </div>
              )}

              <table className="table align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Jenis Tiket</th>
                    <th className="text-center">Qty</th>
                    <th className="text-end">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((detail) => (
                    <tr key={detail.id}>
                      <td className="fw-semibold">
                        {detail.TicketType?.name || "Tiket"}
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
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-muted">Total</span>
                  <span>{formatRupiah(transaction.total_amount)}</span>
                </div>
                {transaction.discount_amount > 0 && (
                  <div className="d-flex justify-content-between mb-1 text-success">
                    <span>Diskon Voucher</span>
                    <span>-{formatRupiah(transaction.discount_amount)}</span>
                  </div>
                )}
                <div className="d-flex justify-content-between fw-bold fs-5 border-top pt-2 mt-2">
                  <span>Total Bayar</span>
                  <span className="text-primary">
                    {formatRupiah(transaction.final_amount)}
                  </span>
                </div>
              </div>

              <div className="row mt-4 small">
                <div className="col-6">
                  <div className="text-muted">Metode Pembayaran</div>
                  <div className="fw-semibold">
                    {transaction.payment_method || "—"}
                  </div>
                </div>
                <div className="col-6">
                  <div className="text-muted">Tanggal Transaksi</div>
                  <div className="fw-semibold">
                    {formatDate(transaction.created_at)}
                  </div>
                </div>
                <div className="col-6 mt-3">
                  <div className="text-muted">Poin Didapat</div>
                  <div className="fw-semibold text-success">
                    +{transaction.earned_points || 0} pts
                  </div>
                </div>
                <div className="col-6 mt-3">
                  <div className="text-muted">Status Refund</div>
                  <div className="fw-semibold text-uppercase">
                    {transaction.refund_status}
                  </div>
                </div>
              </div>
            </div>

            <div className="card-footer bg-light p-3 text-center">
              <Link
                to="/events/my-tickets"
                className="btn btn-outline-primary btn-sm fw-semibold rounded-pill px-4"
              >
                🎫 Lihat Tiket Saya
              </Link>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}

export default TransactionDetail;
