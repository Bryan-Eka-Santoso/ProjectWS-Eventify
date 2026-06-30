import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { AUTH_USER } from "../../config/auth";

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

  // 🔥 1. State Awal Jenis Tiket (Default 1 Opsi Kosong Sesuai Permintaanmu)
  const [tickets, setTickets] = useState([{ name: "", price: "", quota: "" }]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/events/categories")
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Gagal mengambil kategori:", err));
  }, []);

  const handleCategoryChange = (id) => {
    setSelectedCategories((prevSelected) => {
      if (prevSelected.includes(id)) {
        return prevSelected.filter((item) => item !== id);
      } else {
        return [...prevSelected, id];
      }
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 🔥 2. Fungsi Mengubah Data Inputan Di Salah Satu Opsi Tiket
  const handleTicketChange = (index, e) => {
    const updatedTickets = [...tickets];
    updatedTickets[index][e.target.name] = e.target.value;
    setTickets(updatedTickets);
  };

  // 🔥 3. Tombol (+) Menambah Opsi Jenis Tiket Baru
  const addTicketRow = () => {
    setTickets([...tickets, { name: "", price: "", quota: "" }]);
  };

  // 🔥 4. Tombol Hapus Opsi Jenis Tiket Tertentu
  const removeTicketRow = (index) => {
    // Sisakan minimal 1 baris input jenis tiket agar tidak kosong melompong gess
    if (tickets.length === 1) {
      alert("Minimal harus menyediakan 1 jenis tiket gess!");
      return;
    }
    const filteredTickets = tickets.filter((_, i) => i !== index);
    setTickets(filteredTickets);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mainImage) return alert("Harap unggah gambar utama event!");
    if (selectedCategories.length === 0)
      return alert("Harap pilih minimal 1 kategori!");

    // Validasi singkat agar user tidak mengirim tiket kosong
    for (let i = 0; i < tickets.length; i++) {
      if (!tickets[i].name || !tickets[i].quota) {
        return alert(
          `Harap lengkapi Nama Tiket dan Quota pada baris ke-${i + 1}!`,
        );
      }
    }

    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("location", formData.location);
    data.append("start_date", formData.start_date);
    data.append("end_date", formData.end_date);
    data.append("category_ids", selectedCategories.join(","));
    data.append("main_image", mainImage);

    album.forEach((file) => data.append("album", file));

    data.append("user_id", AUTH_USER.id);
    data.append("role", AUTH_USER.role);

    // 🔥 5. Append array jenis tiket yang dikonversi ke JSON String
    data.append("tickets", JSON.stringify(tickets));

    try {
      const response = await axios.post(
        "http://localhost:5000/api/events",
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      alert(response.data.message);

      if (AUTH_USER.role === "admin") {
        navigate("/events");
      } else {
        navigate("/events/my-events");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Gagal membuat event.");
    }
  };

  return (
    <>
      <Navbar />
      <div className="container mt-5 mb-5" style={{ minHeight: "80vh" }}>
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="card shadow-lg border-0 rounded-4">
              <div
                className={`card-header text-white p-4 ${AUTH_USER.role === "admin" ? "bg-success" : "bg-primary"}`}
              >
                <h4 className="mb-0 fw-bold">
                  🚀 Buat Event Baru ({AUTH_USER.role.toUpperCase()})
                </h4>
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

                    <div className="mb-3">
                      <label className="form-label fw-semibold d-block">
                        Pilih Kategori *
                      </label>
                      <div className="d-flex flex-wrap gap-2 p-3 border rounded bg-light">
                        {categories.map((cat) => (
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
                        ))}
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

                  {/* 🔥 BLOK BARU: INPUT DINAMIS JENIS TIKET */}
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                      <h6 className="text-primary fw-bold mb-0">
                        🎫 Konfigurasi Kategori Jenis Tiket
                      </h6>
                      <button
                        type="button"
                        className="btn btn-outline-success btn-sm fw-bold rounded-pill px-3"
                        onClick={addTicketRow}
                      >
                        ➕ Tambah Jenis Tiket
                      </button>
                    </div>

                    {tickets.map((ticket, index) => (
                      <div
                        className="row g-2 align-items-end p-3 mb-2 rounded border bg-light position-relative"
                        key={index}
                      >
                        <div className="col-md-5">
                          <label className="form-label small fw-bold">
                            Nama Tiket (Contoh: VIP / Regular) *
                          </label>
                          <input
                            type="text"
                            name="name"
                            placeholder="Nama tiket gess"
                            className="form-control form-control-sm border-2"
                            value={ticket.name}
                            required
                            onChange={(e) => handleTicketChange(index, e)}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small fw-bold">
                            Harga Tiket (IDR) *
                          </label>
                          <input
                            type="number"
                            name="price"
                            placeholder="0 (Jika gratis)"
                            className="form-control form-control-sm border-2"
                            value={ticket.price}
                            required
                            min="0"
                            onChange={(e) => handleTicketChange(index, e)}
                          />
                        </div>
                        <div className="col-md-2">
                          <label className="form-label small fw-bold">
                            Quota *
                          </label>
                          <input
                            type="number"
                            name="quota"
                            placeholder="100"
                            className="form-control form-control-sm border-2"
                            value={ticket.quota}
                            required
                            min="1"
                            onChange={(e) => handleTicketChange(index, e)}
                          />
                        </div>
                        <div className="col-md-1 text-center">
                          <button
                            type="button"
                            className="btn btn-danger btn-sm rounded-3 mb-1"
                            onClick={() => removeTicketRow(index)}
                            title="Hapus tipe tiket"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
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
                        Album Galeri Tambahan
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
                      className={`btn btn-lg px-5 fw-bold text-white ${AUTH_USER.role === "admin" ? "btn-success" : "btn-primary"}`}
                    >
                      {AUTH_USER.role === "admin"
                        ? "🚀 Publish Event Langsung"
                        : "📥 Simpan sebagai Draft"}
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
