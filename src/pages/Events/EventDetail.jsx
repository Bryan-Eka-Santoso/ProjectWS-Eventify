import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { AUTH_USER } from "../../config/auth"; // 🔑 Mengikuti pusat kendali auth

function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false); // 🔖 State status bookmark

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/events/${id}`)
      .then((res) => {
        setEvent(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal memuat detail event:", err);
        setLoading(false);
      });

    // 🔍 Jalankan pengecekan status awal saat halaman dibuka gess
    axios
      .get(
        `http://localhost:5000/api/events/${id}/check-save?user_id=${AUTH_USER.id}`,
      )
      .then((res) => setIsSaved(res.data.isSaved))
      .catch((err) => console.error(err));
  }, [id]);

  // 🔥 Fungsi eksekusi simpan & batalkan simpan otomatis (Toggle)
  const handleToggleSave = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/events/toggle-save",
        {
          user_id: AUTH_USER.id,
          event_id: id,
        },
      );
      alert(res.data.message);
      setIsSaved(res.data.isSaved); // Ubah visual tombol langsung tanpa refresh gess
    } catch (err) {
      console.error(err);
      alert("Gagal memproses simpan event.");
    }
  };

  if (loading)
    return (
      <div className="text-center my-5 p-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2 text-muted">Memuat detail event...</p>
      </div>
    );

  if (!event)
    return (
      <div className="container mt-5 text-center my-5 py-5 bg-light rounded-4">
        <h3 className="text-muted">Waduh, Event tidak ditemukan gess!</h3>
        <Link to="/events" className="btn btn-primary mt-3 rounded-pill px-4">
          Kembali ke List Event
        </Link>
      </div>
    );

  const formatDateTime = (dateString) => {
    if (!dateString) return "-";
    const bagian = dateString.split("T");
    const tanggalMentah = bagian[0];
    const waktuMentah = bagian[1].substring(0, 5);
    const [thn, bln, tgl] = tanggalMentah.split("-");
    const namaBulan = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];
    return `${tgl} ${namaBulan[parseInt(bln) - 1]} ${thn} Pukul ${waktuMentah}`;
  };

  return (
    <>
      <Navbar />
      <div className="container mt-5 mb-5" style={{ minHeight: "80vh" }}>
        <Link
          to="/events"
          className="btn btn-light border fw-semibold mb-4 px-3 py-2 rounded-3 shadow-sm"
        >
          ⬅️ Kembali ke List Event
        </Link>

        <div className="row g-5">
          <div className="col-md-6">
            <div className="position-sticky" style={{ top: "100px" }}>
              <img
                src={`http://localhost:5000/uploads/${event.main_image_url}`}
                className="img-fluid rounded-4 shadow-lg w-100 border"
                alt={event.title}
                style={{ maxHeight: "450px", objectFit: "cover" }}
                onError={(el) => {
                  el.target.src = "https://placehold.co/600x400?text=No+Banner";
                }}
              />
            </div>
          </div>

          <div className="col-md-6">
            <span className="badge bg-primary px-3 py-2 rounded-pill mb-2">
              Local Event
            </span>
            <h1 className="fw-bold text-dark mb-3 display-5">{event.title}</h1>

            <div className="d-flex flex-column gap-2 mb-4 p-3 bg-light rounded-3 border">
              <p className="text-muted mb-0 d-flex align-items-center gap-2">
                <span className="fs-5">📍</span> <strong>Lokasi:</strong>{" "}
                {event.location}
              </p>
              <div className="text-muted mb-0 d-flex align-items-start gap-2">
                <span className="fs-5">📅</span>
                <div>
                  <strong>Waktu Pelaksanaan:</strong>
                  <div className="small text-dark mt-1">
                    🛫 <span>Mulai: {formatDateTime(event.start_date)}</span>
                  </div>
                  <div className="small text-dark">
                    🛬 <span>Selesai: {formatDateTime(event.end_date)}</span>
                  </div>
                </div>
              </div>
              <p className="text-muted mb-0 d-flex align-items-center gap-2 mt-2">
                <span className="fs-5">🆔</span> <strong>Organizer ID:</strong>{" "}
                <span className="fw-semibold text-danger">
                  {event.organizer_id || "Admin (NULL)"}
                </span>
              </p>
            </div>

            <h5 className="fw-bold text-dark mt-4">Deskripsi Event</h5>
            <p
              className="text-dark lh-lg mt-2"
              style={{ textAlign: "justify" }}
            >
              {event.description ||
                "Tidak ada deskripsi detail untuk event ini gess."}
            </p>

            {/* 🔥 BARIS BUTTON INTERAKSI KELOMPOK */}
            <div className="d-flex flex-column gap-2 mt-4">
              <button className="btn btn-primary btn-lg w-100 rounded-3 fw-bold py-3 shadow d-flex align-items-center justify-content-center gap-2">
                <span className="fs-4">🎫</span> Beli Tiket Sekarang
              </button>

              {/* 🔖 TOMBOL TOGGLE SAVE / BATAL SAVE RESMI HADIR */}
              <button
                className={`btn btn-lg w-100 rounded-3 fw-bold py-2 shadow-sm d-flex align-items-center justify-content-center gap-2 ${isSaved ? "btn-danger text-white" : "btn-outline-warning text-dark"}`}
                onClick={handleToggleSave}
              >
                <span>
                  {isSaved ? "❌ Batalkan Simpan Event" : "🔖 Save Event Ini"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* FITUR GALERI ALBUM AMAN SENTOSA */}
        {event.images && event.images.length > 0 && (
          <div className="mt-5 pt-5 border-top">
            <h4 className="fw-bold text-dark mb-4 pb-2 border-bottom d-inline-block">
              📸 Galeri Foto Album
            </h4>
            <div className="row g-3">
              {event.images.map((img) => (
                <div className="col-6 col-sm-4 col-md-3" key={img.id}>
                  <div className="card h-100 rounded-3 overflow-hidden shadow-sm border p-1 bg-white">
                    <img
                      src={`http://localhost:5000/uploads/${img.image_url}`}
                      alt="Dokumentasi Album Event"
                      className="w-100 h-100"
                      style={{
                        height: "180px",
                        objectFit: "cover",
                        borderRadius: "6px",
                      }}
                      onError={(el) => {
                        el.target.src =
                          "https://placehold.co/300x200?text=Error+Load";
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default EventDetail;
