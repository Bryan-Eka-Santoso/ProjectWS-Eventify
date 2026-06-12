import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

function CreateEvent() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    start_date: "",
    end_date: "",
  });

  const [mainImage, setMainImage] = useState(null);
  const [album, setAlbum] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Ambil daftar kategori dari database saat load halaman
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/events/categories")
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Gagal mengambil kategori:", err));
  }, []);

  // PERBAIKAN: Fungsi toggle kategori (Bisa pilih/hapus lebih dari 1 kategori)
  const handleCategoryChange = (id) => {
    setSelectedCategories((prevSelected) => {
      if (prevSelected.includes(id)) {
        // Jika ID sudah ada, hapus dari list (uncheck)
        return prevSelected.filter((item) => item !== id);
      } else {
        // Jika ID belum ada, tambahkan ke list (check)
        return [...prevSelected, id];
      }
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mainImage) return alert("Harap unggah gambar utama event!");

    // Validasi agar user tidak mengosongkan kategori
    if (selectedCategories.length === 0) {
      return alert("Harap pilih minimal 1 kategori untuk event ini!");
    }

    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("location", formData.location);
    data.append("start_date", formData.start_date);
    data.append("end_date", formData.end_date);

    // Kirim ID kategori sebagai urutan string murni (Contoh: "1,2,4")
    data.append("category_ids", selectedCategories.join(","));
    data.append("main_image", mainImage);
    album.forEach((file) => data.append("album", file));

    try {
      await axios.post("http://localhost:5000/api/events", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Event Berhasil Dibuat dengan Status Draft!");
      navigate("/events/my-events");
    } catch (err) {
      console.error(err);
      alert("Gagal membuat event. Periksa kembali koneksi backend.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-5 mb-5" style={{ minHeight: "80vh" }}>
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card shadow-lg border-0 rounded-4">
              <div className="card-header bg-primary text-white p-4">
                <h4 className="mb-0 fw-bold">🚀 Buat Event Baru</h4>
              </div>

              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <h6 className="text-primary fw-bold border-bottom pb-2 mb-3">
                      Informasi Umum
                    </h6>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Judul Event *
                      </label>
                      <input
                        type="text"
                        name="title"
                        className="form-control border-2"
                        required
                        onChange={handleChange}
                      />
                    </div>

                    {/* SECTION PILIH KATEGORI (MANY-TO-MANY) */}
                    <div className="mb-3">
                      <label className="form-label fw-semibold d-block">
                        Pilih Kategori (Bisa lebih dari satu) *
                      </label>
                      <div className="d-flex flex-wrap gap-2 p-3 border rounded bg-light">
                        {categories.length === 0 ? (
                          <span className="text-muted small italic">
                            Memuat daftar kategori database...
                          </span>
                        ) : (
                          categories.map((cat) => (
                            <div key={cat.id}>
                              <input
                                type="checkbox"
                                className="btn-check"
                                id={`cat-${cat.id}`}
                                checked={selectedCategories.includes(cat.id)}
                                onChange={() => handleCategoryChange(cat.id)}
                              />
                              <label
                                className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-semibold"
                                htmlFor={`cat-${cat.id}`}
                              >
                                {cat.name}
                              </label>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">
                          Mulai *
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
                          Selesai *
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
                      <label className="form-label fw-semibold">Lokasi *</label>
                      <input
                        type="text"
                        name="location"
                        className="form-control border-2"
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
                        onChange={handleChange}
                      ></textarea>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h6 className="text-primary fw-bold border-bottom pb-2 mb-3">
                      Media Visual
                    </h6>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Banner Utama *
                      </label>
                      <input
                        type="file"
                        className="form-control border-2"
                        accept="image/*"
                        required
                        onChange={(e) => setMainImage(e.target.files[0])}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">
                        Album Galeri
                      </label>
                      <input
                        type="file"
                        className="form-control border-2"
                        accept="image/*"
                        multiple
                        onChange={(e) => setAlbum(Array.from(e.target.files))}
                      />
                    </div>
                  </div>

                  <div className="d-grid gap-2 d-md-flex pt-3 border-top">
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
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default CreateEvent;
