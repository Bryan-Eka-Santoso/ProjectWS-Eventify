import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

function DetailExternal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 📥 Otomatis mengambil role kiriman dari Events.jsx via localStorage
  const currentRole = localStorage.getItem("simulated_role") || "organizer";

  useEffect(() => {
    axios
      .get(`https://ll.thespacedevs.com/2.2.0/event/${id}/`)
      .then((res) => {
        setEvent(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal memuat detail API luar:", err);
        setLoading(false);
      });
  }, [id]);

  const handleAdoptEvent = () => {
    setSubmitting(true);

    // Kirim data ke backend controller beserta rolenya
    axios
      .post("http://localhost:5000/api/events/follow-external", {
        external_id: id,
        title: event.name,
        location: event.location || "Online",
        start_date: event.date,
        role: currentRole, // 🔥 Dikirim otomatis gess!
      })
      .then((res) => {
        alert(res.data.message);
        setSubmitting(false);

        if (currentRole === "admin") {
          navigate("/events"); // Admin langsung ke halaman utama biar nampak live
        } else {
          navigate("/events/my-events"); // Organizer ke dashboard draf
        }
      })
      .catch((err) => {
        console.error(err);
        alert(err.response?.data?.message || "Gagal menyimpan ke database.");
        setSubmitting(false);
      });
  };

  if (loading)
    return (
      <div className="text-center my-5 p-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Memuat data live...</p>
      </div>
    );

  if (!event)
    return <div className="text-center my-5">Event tidak ditemukan.</div>;

  return (
    <>
      <Navbar />
      <div className="container mt-5 mb-5" style={{ minHeight: "80vh" }}>
        <Link
          to="/events/external"
          className="btn btn-light border fw-semibold mb-4 px-3 py-2 rounded-3"
        >
          ⬅️ Kembali ke Explore
        </Link>

        <div className="row g-5">
          <div className="col-md-6">
            <img
              src={(item) =>
                event.feature_image ||
                "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800"
              }
              className="img-fluid rounded-4 shadow-sm w-100"
              alt={event.name}
              style={{ maxHeight: "450px", objectFit: "cover" }}
            />
          </div>

          <div className="col-md-6">
            <span className="badge bg-primary px-3 py-2 rounded-pill mb-2">
              {event.type?.name}
            </span>
            <h1 className="fw-bold text-dark mb-3">{event.name}</h1>

            <p className="text-muted lh-lg" style={{ textAlign: "justify" }}>
              {event.description}
            </p>
            <p className="text-dark fw-bold mt-3">
              📅 Tanggal:{" "}
              {new Date(event.date).toLocaleDateString("id-ID", {
                dateStyle: "full",
              })}
            </p>

            <button
              className={`btn btn-lg w-100 rounded-3 fw-bold mt-4 py-3 shadow-sm ${currentRole === "admin" ? "btn-success text-white" : "btn-primary"}`}
              onClick={handleAdoptEvent}
              disabled={submitting}
            >
              {submitting
                ? "Menyimpan..."
                : currentRole === "admin"
                  ? "🚀 Publish Langsung ke Web (Admin)"
                  : "📥 Simpan sebagai Draf (Organizer)"}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default DetailExternal;
