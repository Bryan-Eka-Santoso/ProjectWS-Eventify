import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

function Events() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);

  // 🧪 PUSAT KENDALI SIMULASI ROLE
  // Ganti jadi "admin", "organizer", atau "user" untuk ngetes seluruh alur web gess!
  const role = "admin"; // Ubah sesuai kebutuhan: "admin", "organizer", atau "user"

  // Setiap kali halaman dimuat atau nilai role diubah, simpan ke localStorage
  useEffect(() => {
    localStorage.setItem("simulated_role", role);
  }, [role]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [activeCategory]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5000/api/events/categories",
      );
      setCategories(res.data);
    } catch (err) {
      console.error("Gagal memuat kategori:", err);
    }
  };

  const fetchEvents = async () => {
    try {
      const url = activeCategory
        ? `http://localhost:5000/api/events/published?category_id=${activeCategory}`
        : "http://localhost:5000/api/events/published";
      const res = await axios.get(url);
      setEvents(res.data);
    } catch (err) {
      console.error("Gagal memuat event:", err);
    }
  };

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <Navbar />
      <div className="container mt-5 mb-5" style={{ minHeight: "75vh" }}>
        {/* --- BARIS SEJAJAR: SEARCH BAR & FILTER KATEGORI --- */}
        <div className="row g-3 align-items-center mb-4">
          <div className="col-lg-4 col-md-5">
            <input
              type="text"
              className="form-control form-control-lg border-2 shadow-sm"
              placeholder="Cari event seru di sini..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="col-lg-8 col-md-7 d-flex flex-wrap gap-2 align-items-center">
            <span className="text-muted small fw-bold me-1">Filter:</span>
            <button
              className={`btn btn-sm rounded-pill px-3 fw-bold ${activeCategory === null ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setActiveCategory(null)}
            >
              Semua
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`btn btn-sm rounded-pill px-3 fw-bold ${activeCategory === cat.id ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* --- ACTION BAR BUTTONS (HANYA MUNCUL UNTUK ORGANIZER & ADMIN) --- */}
        {role !== "user" && (
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            {/* 🌍 TOMBOL API LUAR */}
            <div>
              <Link
                to="/events/external"
                className="btn btn-success fw-bold rounded-3 shadow-sm d-flex align-items-center gap-2"
              >
                <span>
                  🌍 Explore International Events ({role.toUpperCase()})
                </span>
              </Link>
            </div>

            {/* TOMBOL MANAJEMEN */}
            <div className="d-flex gap-2">
              <Link
                to="/events/my-events"
                className="btn btn-outline-primary fw-semibold rounded-3"
              >
                My Events
              </Link>
              <Link
                to="/events/create"
                className="btn btn-primary fw-bold rounded-3"
              >
                + Create Event
              </Link>
            </div>
          </div>
        )}

        {/* LIST CARDS LOKAL */}
        <h4 className="fw-bold text-primary mb-4 pb-2 border-bottom">
          🚀 Featured Local Events
        </h4>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-5">
            <h5 className="text-muted">
              Tidak ada event dalam kategori ini atau belum ada yang di-publish.
            </h5>
          </div>
        ) : (
          <div className="row g-4">
            {filteredEvents.map((e) => (
              <div className="col-sm-6 col-md-4 col-lg-3" key={e.id}>
                <div className="card h-100 shadow border-0 rounded-4 overflow-hidden">
                  <img
                    src={`http://localhost:5000/uploads/${e.main_image_url}`}
                    alt={e.title}
                    className="card-img-top"
                    style={{ height: "180px", objectFit: "cover" }}
                    onError={(el) => {
                      el.target.src =
                        "https://placehold.co/600x400?text=No+Poster";
                    }}
                  />
                  <div className="card-body p-4 d-flex flex-column justify-content-between">
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
      <Footer />
    </>
  );
}

export default Events;
