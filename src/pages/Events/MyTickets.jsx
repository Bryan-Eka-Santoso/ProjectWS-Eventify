import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../config/api";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    api
      .get("/events/tickets/my-tickets")
      .then((res) => {
        setTickets(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal menarik daftar tiket kepemilikan gess:", err);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <Navbar />
      <div className="container mt-5 mb-5" style={{ minHeight: "75vh" }}>
        <Link
          to="/events"
          className="btn btn-light border fw-semibold mb-4 px-3 py-2 rounded-3 shadow-sm"
        >
          ⬅️ Kembali ke Eksplor Event
        </Link>

        <h3 className="fw-bold text-dark mb-4">
          🎫 Daftar Tiket Resmi Milikmu
        </h3>

        {loading ? (
          <div className="text-center p-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 text-muted">
              Sedang menarik data manifes tiket...
            </p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-5 bg-light rounded-4 border border-2 border-dashed">
            <h5 className="text-muted mb-2">
              Kamu belum memiliki tiket resmi apa pun gess.
            </h5>
            <p className="small text-muted mb-3">
              Silahkan cari event menarik dan lakukan pembelian tiket.
            </p>
            <Link
              to="/events"
              className="btn btn-primary btn-sm fw-bold rounded-pill px-4"
            >
              Cari Event Seru
            </Link>
          </div>
        ) : (
          <div className="row g-4">
            {tickets.map((t) => (
              <div className="col-md-6 col-lg-4" key={t.id}>
                <div
                  className="card h-100 border-2 rounded-4 shadow-sm overflow-hidden"
                  style={{ borderStyle: "dashed" }}
                >
                  <div className="bg-primary p-3 text-white d-flex justify-content-between align-items-center">
                    <span className="small fw-bold text-uppercase tracking-wider">
                      Official Entry Ticket
                    </span>
                    <span className="badge bg-white text-primary fw-bold text-uppercase">
                      {t.status}
                    </span>
                  </div>

                  <div className="card-body p-4">
                    <h5 className="fw-bold text-dark mb-1">
                      {/* 🎯 FIXED: Diganti dari .event jadi .Event (E Kapital) sesuai skema database */}
                      {t.TicketType?.Event?.title || "Judul Event"}
                    </h5>
                    <p className="text-muted small mb-3">
                      {/* 🎯 FIXED: Diganti dari .event jadi .Event (E Kapital) sesuai skema database */}
                      📍 {t.TicketType?.Event?.location || "Lokasi Event"}
                    </p>

                    <div className="p-2 bg-light rounded-3 border mb-3">
                      <div className="small text-muted">Kategori Tiket:</div>
                      <div className="fw-bold text-uppercase text-dark">
                        {t.TicketType?.name || "REGULAR"}
                      </div>
                    </div>

                    <div className="text-center p-3 bg-dark rounded-3 text-white">
                      <div className="small text-light mb-1">
                        KODE UNIK MASUK GESS (TAMPILKAN KE PANITIA):
                      </div>
                      <code className="fs-5 fw-bold text-warning d-block tracking-widest">
                        {t.ticket_code}
                      </code>
                    </div>
                  </div>

                  <div className="card-footer bg-light p-3 text-center border-top">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary fw-semibold rounded-pill px-4"
                      onClick={() => setSelectedTicket(t)}
                    >
                      🔍 Lihat Detail Tiket
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DETAIL TIKET */}
      {selectedTicket && (
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
                    🎫 Detail Tiket
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setSelectedTicket(null)}
                  ></button>
                </div>

                <div className="modal-body p-4">
                  <h5 className="fw-bold mb-1">
                    {selectedTicket.TicketType?.Event?.title || "Judul Event"}
                  </h5>
                  <p className="text-muted small mb-3">
                    📍 {selectedTicket.TicketType?.Event?.location || "Lokasi"}
                    {selectedTicket.TicketType?.Event?.start_date && (
                      <>
                        <br />
                        🗓️{" "}
                        {new Date(
                          selectedTicket.TicketType.Event.start_date,
                        ).toLocaleString("id-ID", {
                          dateStyle: "long",
                          timeStyle: "short",
                        })}
                      </>
                    )}
                  </p>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <div className="p-2 bg-light rounded-3 border h-100">
                        <div className="small text-muted">Kategori Tiket</div>
                        <div className="fw-bold text-uppercase">
                          {selectedTicket.TicketType?.name || "REGULAR"}
                        </div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-2 bg-light rounded-3 border h-100">
                        <div className="small text-muted">Status</div>
                        <div className="fw-bold text-uppercase">
                          {selectedTicket.status}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center p-4 bg-dark rounded-3 text-white">
                    <div className="small text-light mb-2">
                      KODE UNIK MASUK (TAMPILKAN KE PANITIA):
                    </div>
                    <code className="fs-4 fw-bold text-warning d-block tracking-widest">
                      {selectedTicket.ticket_code}
                    </code>
                  </div>
                </div>

                <div className="modal-footer bg-light rounded-bottom-4">
                  <small className="text-muted me-auto">
                    Diterbitkan otomatis oleh Eventify System
                  </small>
                  <button
                    type="button"
                    className="btn btn-primary fw-bold"
                    onClick={() => setSelectedTicket(null)}
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <Footer />
    </>
  );
}

export default MyTickets;
