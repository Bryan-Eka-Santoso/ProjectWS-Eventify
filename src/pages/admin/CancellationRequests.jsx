import React, { useEffect, useState } from "react";
import api from "../../config/api"; // ✅ Menggunakan instance api kita
import { getCurrentUser } from "../../config/auth";
import Navbar from "../../components/admin/Navbar";
import Footer from "../../components/Footer";
import EventStatusBadge from "../../components/EventStatusBadge";

function CancellationRequests() {
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchCancellationRequests = async () => {
    try {
      setLoading(true);

      const res = await api.get("/events/cancellation-requests", {
        params: {
          status,
          page: 1,
          limit: 50,
        },
      });

      setRequests(res.data.data?.requests || []);
    } catch (error) {
      console.error("Gagal mengambil cancellation requests:", error);
      alert(
        error.response?.data?.message ||
          "Gagal mengambil daftar request pembatalan event.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (getCurrentUser().role === "admin") {
      fetchCancellationRequests();
    } else {
      setLoading(false);
    }
  }, [status]);

  const handleApprove = async (request) => {
    const confirmApprove = window.confirm(
      `Setujui pembatalan event "${request.Event?.title}"?`,
    );

    if (!confirmApprove) return;

    const adminNote = window.prompt(
      "Catatan admin:",
      "Request pembatalan event disetujui oleh admin.",
    );

    try {
      setProcessingId(request.id);

      const res = await api.patch(
        `/events/cancellation-requests/${request.id}/approve`,
        {
          admin_note: adminNote || null,
        },
      );

      alert(res.data.message);
      fetchCancellationRequests();
    } catch (error) {
      console.error("Gagal approve cancellation request:", error);
      alert(
        error.response?.data?.message ||
          "Gagal approve request pembatalan event.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request) => {
    const adminNote = window.prompt(
      `Masukkan alasan penolakan untuk event "${request.Event?.title}":`,
    );

    if (!adminNote || adminNote.trim().length < 3) {
      alert("Alasan penolakan minimal 3 karakter.");
      return;
    }

    try {
      setProcessingId(request.id);

      const res = await api.patch(
        `/events/cancellation-requests/${request.id}/reject`,
        {
          admin_note: adminNote,
        },
      );

      alert(res.data.message);
      fetchCancellationRequests();
    } catch (error) {
      console.error("Gagal reject cancellation request:", error);
      alert(
        error.response?.data?.message ||
          "Gagal reject request pembatalan event.",
      );
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";

    return new Date(dateValue).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  if (getCurrentUser().role !== "admin") {
    return (
      <>
        <Navbar />

        <div className="container py-5" style={{ minHeight: "80vh" }}>
          <div className="alert alert-danger rounded-4 shadow-sm">
            <h5 className="fw-bold mb-1">Akses Ditolak</h5>
            <p className="mb-0">Halaman ini hanya dapat diakses oleh admin.</p>
          </div>
        </div>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="container mt-5 mb-5" style={{ minHeight: "80vh" }}>
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
          <div>
            <h2 className="fw-bold mb-1">🛑 Cancellation Requests</h2>
            <p className="text-muted mb-0">
              Kelola request pembatalan event dari organizer.
            </p>
          </div>

          <div className="d-flex gap-2 align-items-center">
            <label className="fw-semibold text-muted">Filter:</label>

            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{ width: "180px" }}
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted mt-2">Memuat cancellation requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-5 bg-light border rounded-4">
            <h5 className="text-muted fw-normal mb-0">
              Tidak ada cancellation request dengan status{" "}
              <strong>{status}</strong>.
            </h5>
          </div>
        ) : (
          <div className="table-responsive bg-white rounded-4 shadow-sm border p-3">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Event</th>
                  <th>Requester</th>
                  <th>Alasan Cancel</th>
                  <th>Status</th>
                  <th>Requested At</th>
                  <th>Reviewed At</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>

              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <div className="fw-bold">
                        {request.Event?.title || "-"}
                      </div>

                      <small className="text-muted d-block">
                        📍 {request.Event?.location || "-"}
                      </small>

                      <small className="text-muted d-block">
                        📅 {formatDate(request.Event?.start_date)}
                      </small>
                    </td>

                    <td>
                      <div className="fw-semibold">
                        {request.Requester?.name || "-"}
                      </div>

                      <small className="text-muted">
                        {request.Requester?.email || "-"}
                      </small>
                    </td>

                    <td style={{ maxWidth: "280px" }}>
                      <span className="text-muted">
                        {request.reason || "-"}
                      </span>
                    </td>

                    <td>
                      <EventStatusBadge status={request.status} />
                    </td>

                    <td>{formatDate(request.requested_at)}</td>

                    <td>{formatDate(request.reviewed_at)}</td>

                    <td className="text-end">
                      {request.status === "pending" ? (
                        <div className="d-flex justify-content-end gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-success fw-semibold rounded-3"
                            disabled={processingId === request.id}
                            onClick={() => handleApprove(request)}
                          >
                            {processingId === request.id
                              ? "Processing..."
                              : "Approve"}
                          </button>

                          <button
                            type="button"
                            className="btn btn-sm btn-danger fw-semibold rounded-3"
                            disabled={processingId === request.id}
                            onClick={() => handleReject(request)}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div>
                          <span className="text-muted small d-block">
                            Sudah diproses
                          </span>

                          {request.admin_note && (
                            <small className="text-secondary d-block mt-1">
                              Note: {request.admin_note}
                            </small>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}

export default CancellationRequests;
