import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer"; // 👈 1. PASTIKAN FOOTER DI-IMPORT

function Events() {
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const role = "organizer"; // Hardcoded role

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/events/published");
      setEvents(res.data);
    } catch (error) {
      console.error("Gagal mengambil data event:", error);
    }
  };

  // Filter pencarian di sisi client
  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <Navbar />
      {/* 👈 2. BUNGKUS DENGAN CONTAINER DAN MIN-HEIGHT BIAR FOOTER GA NAIK */}
      <div className="container mt-5 mb-5" style={{ minHeight: "75vh" }}>
        {/* SECTION FILTER & BUTTONS */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mb-5">
          <input
            type="text"
            className="form-control form-control-lg border-2 shadow-sm w-50"
            placeholder="Cari event seru di sini..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="gap-2 d-flex">
            {role !== "user" && (
              <>
                <Link
                  to="/events/my-events"
                  className="btn btn-outline-primary btn-lg px-4 fw-semibold shadow-sm"
                >
                  My Events
                </Link>
                <Link
                  to="/events/create"
                  className="btn btn-primary btn-lg px-4 fw-bold shadow-sm"
                >
                  + Create Event
                </Link>
              </>
            )}
          </div>
        </div>

        {/* SECTION LIST CARDS */}
        <h4 className="fw-bold text-primary mb-4 border-bottom pb-2">
          🚀 Featured Events
        </h4>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-5">
            <h5 className="text-muted">Belum ada event yang dipublikasikan.</h5>
          </div>
        ) : (
          <div className="row g-4">
            {" "}
            {/* 👈 Menggunakan g-4 agar ada jarak antar card yang pas */}
            {filteredEvents.map((e) => (
              <div className="col-sm-6 col-md-4 col-lg-3" key={e.id}>
                <div className="card h-100 shadow border-0 rounded-4 overflow-hidden card-hover">
                  <img
                    src={`http://localhost:5000/uploads/${e.main_image_url}`}
                    alt={e.title}
                    className="card-img-top"
                    style={{ height: "180px", objectFit: "cover" }}
                    onError={(img) => {
                      img.target.onerror = null;
                      img.target.src =
                        "https://placehold.co/600x400?text=No+Poster";
                    }}
                  />
                  <div className="card-body d-flex flex-column justify-content-between p-4">
                    <div>
                      <h5 className="fw-bold text-dark text-truncate mb-2">
                        {e.title}
                      </h5>
                      <p className="text-muted small mb-3">📍 {e.location}</p>
                    </div>
                    <Link
                      to={`/events/${e.id}`}
                      className="btn btn-primary w-100 fw-bold py-2 rounded-3"
                    >
                      Beli Tiket
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer /> {/* 👈 3. PASANG FOOTER DI SINI */}
    </>
  );
}

export default Events;
