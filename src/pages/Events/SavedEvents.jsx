import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { AUTH_USER } from "../../config/auth"; // 🔑 Membaca privasi bookmark per akun

function SavedEvents() {
  const [savedEvents, setSavedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tarik data event spesifik yang disimpan oleh user_id aktif gess
    axios
      .get(
        `http://localhost:${process.env.PORT}/api/events/saved-list?user_id=${AUTH_USER.id}`,
      )
      .then((res) => {
        setSavedEvents(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal memuat saved events:", err);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <Navbar />
      <div className="container mt-5 mb-5" style={{ minHeight: "80vh" }}>
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
          <div>
            <h2 className="fw-bold text-dark mb-1">🔖 My Saved Bookmarks</h2>
            <p className="text-muted mb-0">
              Menampilkan koleksi event milik:{" "}
              <strong className="text-warning">{AUTH_USER.name}</strong>
            </p>
          </div>
          <Link
            to="/events"
            className="btn btn-outline-secondary fw-bold rounded-3"
          >
            ⬅️ Beranda Event
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status"></div>
          </div>
        ) : savedEvents.length === 0 ? (
          <div className="text-center py-5 bg-light rounded-4 border border-dashed">
            <h5 className="text-muted fw-normal">
              Kamu belum menyimpan / menandai event apapun gess.
            </h5>
            <Link
              to="/events"
              className="btn btn-primary fw-bold mt-3 rounded-3"
            >
              Cari Event Menarik
            </Link>
          </div>
        ) : (
          <div className="row g-4">
            {savedEvents.map((e) => (
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
                    {/* 🔎 KEMBALI KE DETAIL EVENT UTAMA SESUAI PERINTAH KAMU GESS */}
                    <Link
                      to={`/events/${e.id}`}
                      className="btn btn-warning text-dark fw-bold w-100 py-2 rounded-3 shadow-sm"
                    >
                      🔎 Lihat Detail Event
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

export default SavedEvents;
