import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

function CreateEvent() {
  const navigate = useNavigate();

  // State untuk menampung data form
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    start_date: "",
    end_date: "",
  });

  // Fungsi untuk menangani perubahan input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Fungsi untuk kirim data ke Backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Kita kirim ke endpoint POST /api/events
      // Ingat: Backend sudah kita setting otomatis kasih status 'draft' dan organizer_id: 1
      await axios.post("http://localhost:5000/api/events", formData);

      alert("Event berhasil dibuat! Status saat ini: DRAFT");

      // Redirect ke halaman My Events setelah sukses
      navigate("/events/my-events");
    } catch (err) {
      console.error(err);
      alert("Gagal membuat event. Cek terminal server!");
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-5 mb-5" style={{ minHeight: "80vh" }}>
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card shadow border-0">
              {/* Header Card dengan warna Biru Primary sesuai desain timmu */}
              <div className="card-header bg-primary text-white p-3">
                <h5 className="mb-0 fw-bold">Buat Event Baru</h5>
              </div>

              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Judul Event
                    </label>
                    <input
                      type="text"
                      name="title"
                      className="form-control"
                      placeholder="Contoh: Konser Amal 2024"
                      required
                      onChange={handleChange}
                    />
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">
                        Tanggal Mulai
                      </label>
                      <input
                        type="datetime-local"
                        name="start_date"
                        className="form-control"
                        required
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-semibold">
                        Tanggal Selesai
                      </label>
                      <input
                        type="datetime-local"
                        name="end_date"
                        className="form-control"
                        required
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Lokasi</label>
                    <input
                      type="text"
                      name="location"
                      className="form-control"
                      placeholder="Nama Gedung / Kota"
                      required
                      onChange={handleChange}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      Deskripsi Event
                    </label>
                    <textarea
                      name="description"
                      className="form-control"
                      rows="4"
                      placeholder="Jelaskan detail acaramu di sini..."
                      onChange={handleChange}
                    ></textarea>
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary px-5 fw-bold"
                    >
                      Simpan sebagai Draft
                    </button>
                    <Link
                      to="/events"
                      className="btn btn-outline-secondary px-4"
                    >
                      Batal
                    </Link>
                  </div>
                </form>
              </div>
            </div>

            <p className="text-muted mt-3 small">
              *Setelah disimpan, ajukan event kamu di halaman{" "}
              <strong>My Events</strong> agar bisa diverifikasi oleh Admin.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default CreateEvent;
