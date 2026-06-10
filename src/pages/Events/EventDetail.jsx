import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventDetail = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/events/${id}`);
        setEvent(res.data);
      } catch (err) {
        console.error("Gagal memuat detail event:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEventDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center mt-5" style={{ minHeight: "70vh" }}>
        <div className="spinner-border text-primary" role="status"></div>
        <p className="mt-2">Memuat informasi event...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mt-5 text-center" style={{ minHeight: "70vh" }}>
        <h3>⚠️ Event Tidak Ditemukan</h3>
        <Link to="/events" className="btn btn-primary mt-3">
          Kembali ke Explore
        </Link>
      </div>
    );
  }

  return (
    <>
      <Navbar />

      {/* Container utama dibuat agak ramping (max-width md atau col-md-10) agar enak dibaca dari atas ke bawah */}
      <div className="container mt-5 mb-5" style={{ minHeight: "75vh" }}>
        <div className="row justify-content-center">
          <div className="col-lg-9">
            {/* CARD UTAMA (BUNGLUSAN ALL-IN-ONE) */}
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
              {/* 1. BANNER UTAMA (PALING ATAS) */}
              <img
                src={`http://localhost:5000/uploads/${event.main_image_url}`}
                alt={event.title}
                className="img-fluid w-100"
                style={{ maxHeight: "450px", objectFit: "cover" }}
              />

              <div className="card-body p-4 p-md-5">
                {/* 2. JUDUL EVENT */}
                <h2 className="fw-bold text-dark mb-3">{event.title}</h2>
                <hr className="my-4 text-muted opacity-25" />

                {/* 3. DESKRIPSI EVENT */}
                <h5 className="fw-bold text-primary mb-3">Deskripsi Acara</h5>
                <p
                  className="text-secondary mb-5"
                  style={{ whiteSpace: "pre-line", lineHeight: "1.7" }}
                >
                  {event.description || "Tidak ada deskripsi untuk event ini."}
                </p>

                <hr className="my-4 text-muted opacity-25" />

                {/* 4. INFORMASI LOGISTIK (LOKASI & TANGGAL) */}
                <h5 className="fw-bold text-primary mb-3">
                  Detail Pelaksanaan
                </h5>
                <div className="row g-3 bg-light p-4 rounded-4 mb-5">
                  <div className="col-md-4">
                    <label className="text-muted small fw-bold d-block text-uppercase">
                      📍 Lokasi Tempat
                    </label>
                    <span className="fw-semibold text-dark">
                      {event.location}
                    </span>
                  </div>
                  <div className="col-md-4">
                    <label className="text-muted small fw-bold d-block text-uppercase">
                      📅 Tanggal Mulai
                    </label>
                    <span className="text-dark">
                      {new Date(event.start_date).toLocaleString("id-ID")} WIB
                    </span>
                  </div>
                  <div className="col-md-4">
                    <label className="text-muted small fw-bold d-block text-uppercase">
                      🏁 Tanggal Selesai
                    </label>
                    <span className="text-dark">
                      {new Date(event.end_date).toLocaleString("id-ID")} WIB
                    </span>
                  </div>
                </div>

                {/* 5. BUTTON AKSI UTAMA */}
                <div className="d-grid gap-3 mb-5">
                  <button
                    className="btn btn-primary btn-lg fw-bold py-3 rounded-3 shadow-sm"
                    onClick={() => alert("Fitur pembelian tiket segera hadir!")}
                  >
                    🎟️ Amankan Tiket Sekarang
                  </button>
                </div>

                {/* 6. ALBUM GALLERY (PALING BAWAH SEBELUM TOMBOL BACK) */}
                {event.images && event.images.length > 0 && (
                  <div className="mt-5">
                    <h5 className="fw-bold text-primary mb-3">
                      📸 Galeri Foto Pendukung
                    </h5>
                    <div className="row g-3">
                      {event.images.map((img) => (
                        <div className="col-6 col-sm-4 col-md-3" key={img.id}>
                          <img
                            src={`http://localhost:5000/uploads/${img.image_url}`}
                            alt="Dokumentasi Album"
                            className="img-fluid rounded-3 border"
                            style={{
                              height: "140px",
                              width: "100%",
                              objectFit: "cover",
                              cursor: "pointer",
                            }}
                            onClick={() =>
                              window.open(
                                `http://localhost:5000/uploads/${img.image_url}`,
                                "_blank",
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* TOMBOL KEMBALI DI LUAR CARD */}
            <div className="text-center mt-4">
              <Link
                to="/events"
                className="btn btn-light px-4 border text-muted rounded-3 shadow-sm"
              >
                ← Kembali ke Daftar Event
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default EventDetail;
