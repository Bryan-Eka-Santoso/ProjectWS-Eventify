import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { AUTH_USER } from "../../config/auth";
import EventStatusBadge from "../../components/EventStatusBadge";
import CancelEventModal from "../../components/CancelEventModal";
import AppModal from "../../components/AppModal";

function MyEvents() {
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCancelEvent, setSelectedCancelEvent] = useState(null);

  const [modal, setModal] = useState({
    show: false,
    title: "",
    message: "",
    type: "info",
  });

  const showInfoModal = (title, message, type = "info") => {
    setModal({
      show: true,
      title,
      message,
      type,
    });
  };

  const closeModal = () => {
    setModal((prev) => ({
      ...prev,
      show: false,
    }));
  };

  const fetchMyEvents = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        "http://localhost:5000/api/events/my-events",
        {
          params: {
            user_id: AUTH_USER.id,
            role: AUTH_USER.role,
          },
        },
      );

      setMyEvents(res.data);
    } catch (error) {
      console.error("Gagal memuat event saya:", error);
      showInfoModal(
        "Gagal Memuat Event",
        error.response?.data?.message || "Gagal memuat event saya.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyEvents();
  }, []);

  return (
    <>
      <Navbar />

      <div className="container mt-5 mb-5" style={{ minHeight: "80vh" }}>
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
          <div>
            <h2 className="fw-bold text-dark mb-1">📋 My Managed Events</h2>
            <p className="text-muted mb-0">
              Menampilkan data milik:{" "}
              <strong className="text-primary">{AUTH_USER.name}</strong> (
              {AUTH_USER.role.toUpperCase()})
            </p>
          </div>

          <div className="d-flex gap-2">
            <Link
              to="/events"
              className="btn btn-outline-secondary fw-bold rounded-3"
            >
              ⬅️ Beranda Event
            </Link>

            {AUTH_USER.role !== "user" && (
              <Link
                to="/events/create"
                className="btn btn-primary fw-bold rounded-3"
              >
                + Buat Event
              </Link>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted mt-2">Memuat event...</p>
          </div>
        ) : myEvents.length === 0 ? (
          <div className="text-center py-5 bg-light rounded-4 border border-dashed">
            <h5 className="text-muted fw-normal">
              Kamu belum membuat / mengadopsi event apapun.
            </h5>

            {AUTH_USER.role !== "user" && (
              <Link
                to="/events/create"
                className="btn btn-primary fw-bold mt-3 rounded-3"
              >
                + Buat Event Sekarang
              </Link>
            )}
          </div>
        ) : (
          <div className="table-responsive bg-white rounded-4 shadow-sm p-3 border">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col" className="ps-3">
                    Judul Event
                  </th>
                  <th scope="col">Lokasi</th>
                  <th scope="col">Tanggal Mulai</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="text-end pe-3">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {myEvents.map((event) => (
                  <tr key={event.id}>
                    <td className="fw-bold text-dark ps-3">{event.title}</td>

                    <td>📍 {event.location}</td>

                    <td>
                      📅{" "}
                      {new Date(event.start_date).toLocaleDateString("id-ID", {
                        dateStyle: "medium",
                      })}
                    </td>

                    <td>
                      <EventStatusBadge status={event.status} />
                    </td>

                    <td className="text-end pe-3">
                      <div className="d-flex justify-content-end gap-2">
                        <Link
                          to={`/events/${event.id}`}
                          className="btn btn-sm btn-outline-primary rounded-3"
                        >
                          Detail
                        </Link>

                        {event.status !== "canceled" && (
                          <>
                            <Link
                              to={`/events/${event.id}/validate-ticket`}
                              className="btn btn-sm btn-success rounded-3 fw-semibold"
                            >
                              Validate Ticket
                            </Link>
                            <Link
                              to={`/events/${event.id}/edit`}
                              className="btn btn-sm btn-warning rounded-3 fw-semibold"
                            >
                              Edit
                            </Link>

                            <button
                              type="button"
                              className="btn btn-sm btn-danger rounded-3 fw-semibold"
                              onClick={() => setSelectedCancelEvent(event)}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCancelEvent && (
        <CancelEventModal
          event={selectedCancelEvent}
          onClose={() => setSelectedCancelEvent(null)}
          onSuccess={fetchMyEvents}
        />
      )}

      <AppModal
        show={modal.show}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={closeModal}
      />

      <Footer />
    </>
  );
}

export default MyEvents;
