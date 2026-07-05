import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { AUTH_USER } from "../../config/auth"; // 🔑 Menggunakan pusat kendali auth saklar utama gess

function ExploreExternal() {
  const [externalEvents, setExternalEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Menarik 12 data event luar angkasa internasional
    axios
      .get("https://ll.thespacedevs.com/2.2.0/event/?limit=12")
      .then((res) => {
        setExternalEvents(res.data.results);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal mengambil API internasional:", err);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <Navbar />
      <div className="container mt-5 mb-5" style={{ minHeight: "80vh" }}>
        {/* --- ALERT INFO TESTING AKTIF --- */}
        <div className="alert alert-success border-0 shadow-sm rounded-3 mb-4 d-flex justify-content-between align-items-center">
          <div>
            🌍 Global API Explorer Active: <strong>{AUTH_USER.name}</strong>
            <span className="badge bg-success ms-2">
              {AUTH_USER.role.toUpperCase()}
            </span>
          </div>
          <small className="text-muted">ID User: {AUTH_USER.id}</small>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold text-dark mb-1">
              🌍 International Space Events
            </h2>
            <p className="text-muted mb-0">
              Adopsi data dari API luar negeri langsung ke SQL lokal
            </p>
          </div>
          <Link
            to="/events"
            className="btn btn-outline-secondary fw-semibold rounded-3"
          >
            ⬅️ Kembali
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-5 my-5">
            <div className="spinner-border text-success" role="status"></div>
            <p className="text-muted mt-2">
              Menghubungkan ke server global space API...
            </p>
          </div>
        ) : (
          <div className="row g-4">
            {externalEvents.map((item) => (
              <div className="col-md-4 col-sm-6" key={item.id}>
                <div className="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                  <img
                    src={
                      item.feature_image ||
                      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800"
                    }
                    alt={item.name}
                    className="card-img-top"
                    style={{ height: "180px", objectFit: "cover" }}
                  />
                  <div className="card-body p-4 d-flex flex-column justify-content-between">
                    <div>
                      <span className="badge bg-light text-dark border mb-2">
                        {item.type?.name || "Space Event"}
                      </span>
                      <h6
                        className="fw-bold text-dark text-truncate mb-2"
                        title={item.name}
                      >
                        {item.name}
                      </h6>
                      <p className="text-muted small text-truncate mb-3">
                        📅{" "}
                        {new Date(item.date).toLocaleDateString("id-ID", {
                          dateStyle: "medium",
                        })}
                      </p>
                    </div>
                    {/* Mengarah ke rute halaman detail eksternal */}
                    <Link
                      to={`/events/external/${item.id}`}
                      className="btn btn-success w-100 fw-bold rounded-3 py-2"
                    >
                      🔎 Lihat Detail & Adopsi
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

export default ExploreExternal;
