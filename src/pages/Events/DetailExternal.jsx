import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../../config/api"; // ✅ Menggunakan instance api kita
import { getCurrentUser } from "../../config/auth";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import axios from "axios";

function DetailExternal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axios
      .get(`https://ll.thespacedevs.com/2.2.0/event/${id}/`)
      .then((res) => {
        setEvent(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal memuat detail API eksternal:", err);
        setLoading(false);
      });
  }, [id]);

  const handleAdoptEvent = () => {
    setSubmitting(true);

<<<<<<< HEAD
    // 🔥 MENGIRIM ID USER DAN ROLE ASLI DARI AUTH_USER PUSAT SEKARANG WOII
    axios
      .post(`http://localhost:5000/api/events/follow-external`, {
=======
    api
      .post("/events/follow-external", {
>>>>>>> 6dc3fad140a3881681fa5a10a95fea2ddd92055d
        external_id: id,
        title: event.name,
        location: event.location || "Online",
        start_date: event.date,
      })
      .then((res) => {
        alert(res.data.message);
        setSubmitting(false);

        // Alur redirect pasca sukses sesuai instruksimu gess
        if (getCurrentUser().role === "admin") {
          navigate("/events");
        } else {
          navigate("/events/my-events");
        }
      })
      .catch((err) => {
        console.error(err);
        alert(err.response?.data?.message || "Gagal mengadopsi event.");
        setSubmitting(false);
      });
  };

  if (loading)
    return (
      <div className="text-center my-5 p-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="text-muted mt-2">Memuat data event internasional...</p>
      </div>
    );

  if (!event)
    return (
      <div className="text-center my-5">
        Event internasional tidak ditemukan gess.
      </div>
    );

  return (
    <>
      <Navbar />
      <div className="container mt-5 mb-5">
        <Link
          to="/events/external"
          className="btn btn-light border fw-semibold mb-4 px-3 py-2 rounded-3 shadow-sm"
        >
          ⬅️ Kembali ke List Internasional
        </Link>

        <div className="row g-5">
          {/* VISUAL BANNER GLOBAL */}
          <div className="col-md-6">
            <img
              src={
                event.feature_image ||
                "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800"
              }
              className="img-fluid rounded-4 shadow-lg w-100 border"
              alt={event.name}
              style={{ maxHeight: "450px", objectFit: "cover" }}
            />
          </div>

          {/* KONTEN ADOPSI */}
          <div className="col-md-6">
            <span className="badge bg-success px-3 py-2 rounded-pill mb-2">
              {event.type?.name || "Global Science"}
            </span>
            <h1 className="fw-bold text-dark mb-3 display-6">{event.name}</h1>
            <p className="text-muted lh-lg" style={{ textAlign: "justify" }}>
              {event.description}
            </p>

            <div className="p-3 bg-light rounded-3 border my-4">
              <p className="text-dark fw-bold mb-0">
                📅 Tanggal Global:{" "}
                <span className="fw-normal text-muted">
                  {new Date(event.date).toLocaleDateString("id-ID", {
                    dateStyle: "full",
                  })}
                </span>
              </p>
            </div>

            {/* TOMBOL AKSI OTOMATIS */}
            <button
              className={`btn btn-lg w-100 rounded-3 fw-bold py-3 shadow ${getCurrentUser().role === "admin" ? "btn-success text-white" : "btn-primary"}`}
              onClick={handleAdoptEvent}
              disabled={submitting}
            >
              {submitting ? (
                <span>📥 Menghubungkan ke Database SQL Lokal...</span>
              ) : getCurrentUser().role === "admin" ? (
                `🚀 Publish Langsung ke Dashboard (${getCurrentUser().name})`
              ) : (
                `📥 Adopsi sebagai Draf Organizer (${getCurrentUser().name})`
              )}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default DetailExternal;
