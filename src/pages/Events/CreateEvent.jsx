import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

function CreateEvent() {
  const navigate = useNavigate();

  // State untuk data teks
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    start_date: "",
    end_date: "",
  });

  // State untuk file gambar
  const [mainImage, setMainImage] = useState(null);
  const [album, setAlbum] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi sederhana: Gambar utama wajib ada
    if (!mainImage) {
      alert("Harap unggah gambar utama event!");
      return;
    }

    // PAKAI FORMDATA (Wajib untuk kirim file lewat Multer)
    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("location", formData.location);
    data.append("start_date", formData.start_date);
    data.append("end_date", formData.end_date);

    // Append Gambar Utama (Satu file)
    data.append("main_image", mainImage);

    // Append Album (Banyak file)
    album.forEach((file) => {
      data.append("album", file);
    });

    try {
      await axios.post("http://localhost:5000/api/events", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Event Berhasil Dibuat!");
      navigate("/events/my-events");
    } catch (err) {
      console.error(err);
      alert("Gagal membuat event. Periksa koneksi server.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-5 mb-5" style={{ minHeight: "80vh" }}>
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card shadow-lg border-0 rounded-4">
              <div className="card-header bg-primary text-white p-4 rounded-top-4">
                <h4 className="mb-0 fw-bold">🚀 Buat Event Baru</h4>
                <p className="mb-0 small opacity-75">
                  Isi detail acaramu untuk menarik minat peserta.
                </p>
              </div>

              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  {/* --- SECTION 1: INFO UTAMA --- */}
                  <div className="mb-4">
                    <h6 className="text-primary fw-bold border-bottom pb-2 mb-3">
                      Informasi Umum
                    </h6>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Judul Event <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        className="form-control form-control-lg border-2"
                        placeholder="Contoh: Konser Jazz Malam Minggu"
                        required
                        onChange={handleChange}
                      />
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">
                          Tanggal Mulai <span className="text-danger">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          name="start_date"
                          className="form-control border-2"
                          required
                          onChange={handleChange}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">
                          Tanggal Selesai <span className="text-danger">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          name="end_date"
                          className="form-control border-2"
                          required
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Lokasi Acara <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="location"
                        className="form-control border-2"
                        placeholder="Nama tempat, Gedung, atau Kota"
                        required
                        onChange={handleChange}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Deskripsi
                      </label>
                      <textarea
                        name="description"
                        className="form-control border-2"
                        rows="4"
                        placeholder="Jelaskan detail acaramu dengan lengkap..."
                        onChange={handleChange}
                      ></textarea>
                    </div>
                  </div>

                  {/* --- SECTION 2: MEDIA / GAMBAR --- */}
                  <div className="mb-4">
                    <h6 className="text-primary fw-bold border-bottom pb-2 mb-3">
                      Media Visual
                    </h6>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Poster / Banner Utama{" "}
                        <span className="text-danger">*</span>
                      </label>
                      <input
                        type="file"
                        className="form-control border-2"
                        accept="image/*"
                        required
                        onChange={(e) => setMainImage(e.target.files[0])}
                      />
                      <div className="form-text">
                        Muncul di halaman utama (Rekomendasi: 1200x600 px).
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Album Galeri (Opsional)
                      </label>
                      <input
                        type="file"
                        className="form-control border-2"
                        accept="image/*"
                        multiple
                        onChange={(e) => setAlbum(Array.from(e.target.files))}
                      />
                      <div className="form-text">
                        Pilih beberapa foto sekaligus untuk ditampilkan di
                        detail event.
                      </div>
                    </div>
                  </div>

                  {/* --- TOMBOL AKSI --- */}
                  <div className="d-grid gap-2 d-md-flex justify-content-md-start pt-3 border-top">
                    <button
                      type="submit"
                      className="btn btn-primary btn-lg px-5 fw-bold"
                    >
                      Simpan sebagai Draft
                    </button>
                    <Link
                      to="/events"
                      className="btn btn-light btn-lg px-4 border"
                    >
                      Batal
                    </Link>
                  </div>
                </form>
              </div>
            </div>

            <div
              className="alert alert-info mt-4 border-0 shadow-sm"
              role="alert"
            >
              <i className="bi bi-info-circle-fill me-2"></i>
              Setelah disimpan, jangan lupa buka menu <strong>
                My Events
              </strong>{" "}
              untuk mengajukan persetujuan kepada Admin agar event kamu
              dipublikasikan.
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default CreateEvent;
