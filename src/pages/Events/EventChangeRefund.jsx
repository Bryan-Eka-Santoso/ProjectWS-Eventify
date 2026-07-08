import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { AUTH_USER } from "../../config/auth";
import AppModal from "../../components/AppModal";

function EventChangeRefund() {
  const { id, eventChangeId } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState(null);
  const [reason, setReason] = useState("");

  const [modal, setModal] = useState({
    show: false,
    title: "",
    message: "",
    type: "info",
    showCancel: false,
    confirmText: "OK",
    cancelText: "Batal",
    onConfirm: null,
  });

  const showInfoModal = (title, message, type = "info") => {
    setModal({
      show: true,
      title,
      message,
      type,
      showCancel: false,
      confirmText: "OK",
      cancelText: "Batal",
      onConfirm: null,
    });
  };

  const showConfirmModal = ({
    title,
    message,
    type = "confirm",
    confirmText = "Ya",
    cancelText = "Batal",
    onConfirm,
  }) => {
    setModal({
      show: true,
      title,
      message,
      type,
      showCancel: true,
      confirmText,
      cancelText,
      onConfirm,
    });
  };

  const closeModal = () => {
    setModal((prev) => ({
      ...prev,
      show: false,
    }));
  };

  const fetchRefundInfo = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `http://localhost:5000/api/events/${id}/changes/${eventChangeId}/refund-info`,
        {
          params: {
            user_id: AUTH_USER.id,
          },
        },
      );

      setData(res.data.data);
    } catch (error) {
      console.error("Gagal mengambil detail perubahan event:", error);
      showInfoModal(
        "Gagal Mengambil Detail Perubahan Event",
        error.response?.data?.message ||
          "Gagal mengambil detail perubahan event.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefundInfo();
  }, [id, eventChangeId]);

  const processRequestRefund = async (transaction) => {
    try {
      setRequestingId(transaction.id);

      const res = await axios.post(
        `http://localhost:5000/api/events/${id}/refund-request`,
        {
          user_id: AUTH_USER.id,
          transaction_id: transaction.id,
          event_change_id: eventChangeId,
          reason: reason.trim() || null,
        },
      );

      showInfoModal(
        "Pengajuan Refund Berhasil",
        res.data.message || "Pengajuan refund berhasil dibuat.",
        "success",
      );

      setReason("");
      fetchRefundInfo();
    } catch (error) {
      console.error("Gagal request refund:", error);
      showInfoModal(
        "Gagal Mengajukan Refund",
        error.response?.data?.message ||
          "Gagal mengajukan refund untuk event ini.",
        "error",
      );
    } finally {
      setRequestingId(null);
    }
  };

  const handleRequestRefund = async (transaction) => {
    showConfirmModal({
      title: "Konfirmasi Pengajuan Refund",
      message: `Ajukan refund untuk transaksi #${transaction.id}?`,
      type: "confirm",
      confirmText: "Ya, Ajukan Refund",
      cancelText: "Batal",
      onConfirm: () => {
        closeModal();
        processRequestRefund(transaction);
      },
    });
  };

  const formatDateTime = (value) => {
    if (!value) return "-";

    return new Date(value).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  const getRefundStatusBadge = (status) => {
    const className = {
      requested: "bg-warning text-dark",
      processing: "bg-info text-dark",
      refunded: "bg-success",
      rejected: "bg-danger",
    };

    return (
      <span className={`badge ${className[status] || "bg-secondary"}`}>
        {String(status || "-").toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div
          className="container py-5 text-center"
          style={{ minHeight: "80vh" }}
        >
          <div className="spinner-border text-primary"></div>
          <p className="text-muted mt-2">Memuat detail perubahan event...</p>
        </div>

        <AppModal
          show={modal.show}
          title={modal.title}
          message={modal.message}
          type={modal.type}
          showCancel={modal.showCancel}
          confirmText={modal.confirmText}
          cancelText={modal.cancelText}
          onConfirm={modal.onConfirm}
          onClose={closeModal}
        />

        <Footer />
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Navbar />
        <div className="container py-5" style={{ minHeight: "80vh" }}>
          <div className="alert alert-danger rounded-4">
            Data perubahan event tidak ditemukan.
          </div>
          <Link to="/events/my-tickets" className="btn btn-primary">
            Kembali ke My Tickets
          </Link>
        </div>

        <AppModal
          show={modal.show}
          title={modal.title}
          message={modal.message}
          type={modal.type}
          showCancel={modal.showCancel}
          confirmText={modal.confirmText}
          cancelText={modal.cancelText}
          onConfirm={modal.onConfirm}
          onClose={closeModal}
        />

        <Footer />
      </>
    );
  }

  const event = data.event;
  const change = data.event_change;
  const transactions = data.transactions || [];

  return (
    <>
      <Navbar />

      <div className="container mt-5 mb-5" style={{ minHeight: "80vh" }}>
        <div className="mb-4">
          <Link
            to="/events/my-tickets"
            className="btn btn-light border fw-semibold rounded-3"
          >
            ⬅️ Kembali ke My Tickets
          </Link>
        </div>

        <div className="row g-4">
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm rounded-4 mb-4">
              <div className="card-header bg-primary text-white p-4 rounded-top-4">
                <h4 className="fw-bold mb-0">✏️ Detail Perubahan Event</h4>
              </div>

              <div className="card-body p-4">
                <h4 className="fw-bold mb-2">{event?.title || "-"}</h4>

                <p className="text-muted mb-3">
                  Event ini mengalami perubahan informasi. Kamu dapat memilih
                  untuk tetap mengikuti event atau mengajukan refund sebelum
                  batas waktu yang ditentukan.
                </p>

                <div className="alert alert-warning rounded-3">
                  <strong>Batas pengajuan refund:</strong>{" "}
                  {formatDateTime(change?.refund_deadline)}
                </div>

                {data.refund_deadline_expired && (
                  <div className="alert alert-danger rounded-3">
                    Batas waktu pengajuan refund sudah berakhir.
                  </div>
                )}

                <div className="table-responsive">
                  <table className="table table-bordered align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Bagian</th>
                        <th>Sebelum</th>
                        <th>Sesudah</th>
                      </tr>
                    </thead>

                    <tbody>
                      {(change?.old_start_date || change?.new_start_date) && (
                        <tr>
                          <td className="fw-semibold">Tanggal Mulai</td>
                          <td>{formatDateTime(change.old_start_date)}</td>
                          <td>{formatDateTime(change.new_start_date)}</td>
                        </tr>
                      )}

                      {(change?.old_end_date || change?.new_end_date) && (
                        <tr>
                          <td className="fw-semibold">Tanggal Selesai</td>
                          <td>{formatDateTime(change.old_end_date)}</td>
                          <td>{formatDateTime(change.new_end_date)}</td>
                        </tr>
                      )}

                      {(change?.old_location || change?.new_location) && (
                        <tr>
                          <td className="fw-semibold">Lokasi</td>
                          <td>{change.old_location || "-"}</td>
                          <td>{change.new_location || "-"}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {change?.change_reason && (
                  <div className="mt-3 p-3 bg-light border rounded-3">
                    <div className="fw-semibold mb-1">Alasan perubahan:</div>
                    <div className="text-muted">{change.change_reason}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-header bg-dark text-white p-4 rounded-top-4">
                <h5 className="fw-bold mb-0">💸 Pengajuan Refund</h5>
              </div>

              <div className="card-body p-4">
                {transactions.length === 0 ? (
                  <div className="alert alert-secondary rounded-3 mb-0">
                    Tidak ada transaksi paid untuk event ini.
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Alasan refund
                      </label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Contoh: Jadwal baru tidak cocok dengan waktu saya."
                      ></textarea>
                      <small className="text-muted">
                        Boleh dikosongkan jika tidak ingin mengisi alasan.
                      </small>
                    </div>

                    <div className="d-flex flex-column gap-3">
                      {transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="p-3 border rounded-3 bg-light"
                        >
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                              <div className="fw-bold">
                                Transaksi #{transaction.id}
                              </div>
                              <small className="text-muted">
                                Total: {formatRupiah(transaction.final_amount)}
                              </small>
                            </div>

                            {transaction.existing_refund ? (
                              getRefundStatusBadge(
                                transaction.existing_refund.status,
                              )
                            ) : (
                              <span className="badge bg-success">ELIGIBLE</span>
                            )}
                          </div>

                          {transaction.details?.map((detail) => (
                            <div
                              key={detail.id}
                              className="small text-muted mb-1"
                            >
                              🎫 {detail.ticket_name} x {detail.quantity}
                            </div>
                          ))}

                          {transaction.existing_refund ? (
                            <div className="alert alert-info small mt-3 mb-0 rounded-3">
                              Refund sudah diajukan. Status saat ini:{" "}
                              <strong>
                                {transaction.existing_refund.status}
                              </strong>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-danger w-100 fw-bold mt-3 rounded-3"
                              disabled={
                                data.refund_deadline_expired ||
                                !transaction.can_request_refund ||
                                requestingId === transaction.id
                              }
                              onClick={() => handleRequestRefund(transaction)}
                            >
                              {requestingId === transaction.id
                                ? "Mengajukan Refund..."
                                : "Ajukan Refund"}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AppModal
        show={modal.show}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        showCancel={modal.showCancel}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        onConfirm={modal.onConfirm}
        onClose={closeModal}
      />

      <Footer />
    </>
  );
}

export default EventChangeRefund;
