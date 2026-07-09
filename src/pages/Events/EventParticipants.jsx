import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { AUTH_USER } from "../../config/auth";

const API_BASE = `http://localhost:5000/api/transactions`;

const STATUS_BADGE = {
  active: "bg-success",
  used: "bg-secondary",
  refunded: "bg-danger",
};

function EventParticipants() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    document.title = "Event Participants | Eventify";

    const fetchParticipants = async () => {
      try {
        const res = await axios.get(`${API_BASE}/events/${id}/participants`, {
          params: { user_id: AUTH_USER.id, role: AUTH_USER.role },
        });
        setEvent(res.data.data?.event || null);
        setParticipants(res.data.data?.participants || []);
      } catch (error) {
        console.error("Gagal mengambil peserta:", error);
        setErrorMessage(
          error.response?.data?.message || "Gagal mengambil daftar peserta.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [id]);

  const filtered = participants.filter(
    (p) =>
      p.User?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.User?.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.ticket_code?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <Navbar />

      <div className="container mt-5 mb-5" style={{ minHeight: "75vh" }}>
        <Link
          to="/events/my-events"
          className="btn btn-light border fw-semibold mb-4 px-3 py-2 rounded-3 shadow-sm"
        >
          ⬅️ Kembali ke My Events
        </Link>

        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3 flex-wrap gap-2">
          <div>
            <h2 className="fw-bold mb-1">👥 Peserta Event</h2>
            <p className="text-muted mb-0">
              {event ? event.title : "Daftar pembeli tiket event ini."}
            </p>
          </div>

          <div className="text-end">
            <div className="small text-muted">Total Tiket Terjual</div>
            <div className="fs-3 fw-bold text-primary">
              {participants.length}
            </div>
          </div>
        </div>

        <div className="mb-3" style={{ maxWidth: "360px" }}>
          <input
            type="text"
            className="form-control"
            placeholder="Cari nama, email, atau kode tiket..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted mt-2">Memuat peserta...</p>
          </div>
        ) : errorMessage ? (
          <div className="text-center py-5 bg-light border rounded-4">
            <h5 className="text-muted fw-normal">{errorMessage}</h5>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-5 bg-light border rounded-4">
            <h5 className="text-muted fw-normal mb-0">
              {search
                ? "Tidak ada peserta yang cocok dengan pencarian."
                : "Belum ada peserta yang membeli tiket."}
            </h5>
          </div>
        ) : (
          <div className="table-responsive bg-white rounded-4 shadow-sm border p-3">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th style={{ width: "60px" }}>#</th>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Jenis Tiket</th>
                  <th>Kode Tiket</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, index) => (
                  <tr key={p.id}>
                    <td className="text-muted">{index + 1}</td>
                    <td className="fw-semibold">
                      {p.User?.name || "Pengguna"}
                    </td>
                    <td className="text-muted">{p.User?.email || "—"}</td>
                    <td>
                      <span className="badge bg-light text-dark border text-uppercase">
                        {p.TicketType?.name || "REGULAR"}
                      </span>
                    </td>
                    <td>
                      <code>{p.ticket_code}</code>
                    </td>
                    <td>
                      <span
                        className={`badge text-uppercase ${
                          STATUS_BADGE[p.status] || "bg-secondary"
                        }`}
                      >
                        {p.status}
                      </span>
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

export default EventParticipants;
