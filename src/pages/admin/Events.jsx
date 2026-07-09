import React, { useEffect, useState } from "react";
import api from "../../config/api"; // ✅ Menggunakan instance api kita
import { getCurrentUser } from "../../config/auth";
import Navbar from "../../components/admin/Navbar";
import Footer from "../../components/admin/Footer";
import AppModal from "../../components/AppModal";
import EventStatusBadge from "../../components/EventStatusBadge";


const API_BASE = "/events";

const STATUS_OPTIONS = [
  "draft",
  "pending_approval",
  "published",
  "rejected",
  "canceled",
  "completed",
];

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [processingId, setProcessingId] = useState(null);

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

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get(`${API_BASE}/admin/all-events`, {
        params: {
          status: statusFilter || undefined,
        },
      });
      setEvents(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Gagal mengambil event:", error);
      notify(
        "error",
        "Gagal Memuat",
        error.response?.data?.message || "Gagal mengambil daftar event."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Events (Admin) | Eventify";
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const changeStatus = async (event, newStatus) => {
    if (newStatus === event.status) return;

    try {
      setProcessingId(event.id);
      await api.patch(`${API_BASE}/${event.id}/status`, {
        status: newStatus,
      });
      await fetchEvents();
      notify(
        "success",
        "Berhasil",
        `Status event "${event.title}" diubah menjadi ${newStatus}.`
      );
    } catch (error) {
      console.error("Gagal mengubah status:", error);
      notify(
        "error",
        "Gagal",
        error.response?.data?.message || "Gagal mengubah status event."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const filtered = events.filter(
    (e) =>
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.Organizer?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Navbar />

      <div className="container mt-5 mb-5" style={{ minHeight: "80vh" }}>
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
          <div>
            <h2 className="fw-bold mb-1">📅 Events</h2>
            <p className="text-muted mb-0">
              Moderasi semua event dari seluruh organizer.
            </p>
          </div>

          <div className="d-flex gap-2 align-items-center">
            <label className="fw-semibold text-muted">Status:</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: "200px" }}
            >
              <option value="">Semua Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-3" style={{ maxWidth: "320px" }}>
          <input
            type="text"
            className="form-control"
            placeholder="Cari judul / organizer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted mt-2">Memuat event...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5 bg-light border rounded-4">
            <h5 className="text-muted fw-normal mb-0">
              Tidak ada event yang cocok.
            </h5>
          </div>
        ) : (
          <div className="table-responsive bg-white rounded-4 shadow-sm border p-3">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Event</th>
                  <th>Organizer</th>
                  <th>Jadwal</th>
                  <th>Kategori</th>
                  <th className="text-center">Status</th>
                  <th style={{ width: "190px" }}>Ubah Status</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <div className="fw-bold">{event.title}</div>
                      <small className="text-muted d-block">
                        📍 {event.location || "—"}
                      </small>
                    </td>

                    <td>
                      {event.Organizer ? (
                        <>
                          <div className="fw-semibold">
                            {event.Organizer.name}
                          </div>
                          <small className="text-muted">
                            {event.Organizer.email}
                          </small>
                        </>
                      ) : (
                        <span className="text-muted fst-italic">
                          Event eksternal
                        </span>
                      )}
                    </td>

                    <td>
                      <small className="d-block">
                        🟢 {formatDate(event.start_date)}
                      </small>
                      <small className="text-muted d-block">
                        🔴 {formatDate(event.end_date)}
                      </small>
                    </td>

                    <td>
                      {event.Categories && event.Categories.length > 0 ? (
                        <div className="d-flex flex-wrap gap-1">
                          {event.Categories.map((c) => (
                            <span
                              key={c.id}
                              className="badge bg-light text-dark border"
                            >
                              {c.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    <td className="text-center">
                      <EventStatusBadge status={event.status} />
                    </td>

                    <td>
                      <select
                        className="form-select form-select-sm"
                        value={event.status}
                        disabled={processingId === event.id}
                        onChange={(e) => changeStatus(event, e.target.value)}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
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
        confirmText="OK"
        onConfirm={modal.onConfirm}
        onClose={closeModal}
      />

      <Footer />
    </>
  );
}

export default Events;
