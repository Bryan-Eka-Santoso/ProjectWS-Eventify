import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { AUTH_USER } from "../../config/auth";
import AppModal from "../../components/AppModal";

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

  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [isLocationSelected, setIsLocationSelected] = useState(false);

  const [tickets, setTickets] = useState([{ name: "", price: "", quota: "" }]);

  const [modal, setModal] = useState({
    show: false,
    title: "",
    message: "",
    type: "info",
    showCancel: false,
    confirmText: "OK",
    cancelText: "Batal",
    onConfirm: null,
  });

  const showInfoModal = (title, message, type = "info", onConfirm = null) => {
    setModal({
      show: true,
      title,
      message,
      type,
      showCancel: false,
      confirmText: "OK",
      cancelText: "Batal",
      onConfirm,
    });
  };

  const closeModal = () => {
    setModal((prev) => ({
      ...prev,
      show: false,
    }));
  };

  useEffect(() => {
    axios
      .get(`http://localhost:${process.env.PORT}/api/events/categories`)
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Gagal mengambil kategori:", err));
  }, []);

  useEffect(() => {
    const searchLocation = async () => {
      const keyword = formData.location.trim();

      if (isLocationSelected) {
        return;
      }

      if (keyword.length < 3) {
        setLocationSuggestions([]);
        setShowLocationSuggestions(false);
        return;
      }

      try {
        setIsSearchingLocation(true);

        const response = await axios.get(
          `http://localhost:${process.env.PORT}/api/events/locations/autocomplete`,
          {
            params: {
              text: keyword,
            },
          },
        );

        setLocationSuggestions(response.data.data || []);
        setShowLocationSuggestions(true);
      } catch (error) {
        console.error("Gagal mencari lokasi dari backend Geoapify:", error);
        setLocationSuggestions([]);
        setShowLocationSuggestions(false);
      } finally {
        setIsSearchingLocation(false);
      }
    };

    const delaySearch = setTimeout(() => {
      searchLocation();
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [formData.location, isLocationSelected]);

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

  const handleLocationChange = (e) => {
    const value = e.target.value;

    setIsLocationSelected(false);

    setFormData({
      ...formData,
      location: value,
    });
  };

  const handleSelectLocation = (place) => {
    const selectedAddress = place.address || place.name || "";

    setFormData({
      ...formData,
      location: selectedAddress,
    });

    setIsLocationSelected(true);
    setLocationSuggestions([]);
    setShowLocationSuggestions(false);
  };

  const handleTicketChange = (index, e) => {
    const updatedTickets = [...tickets];
    updatedTickets[index][e.target.name] = e.target.value;
    setTickets(updatedTickets);
  };

  const addTicketRow = () => {
    setTickets([...tickets, { name: "", price: "", quota: "" }]);
  };

  const removeTicketRow = (index) => {
    if (tickets.length === 1) {
      showInfoModal(
        "Jenis Tiket Tidak Bisa Dihapus",
        "Minimal harus menyediakan 1 jenis tiket gess!",
        "warning",
      );
      return;
    }

    const filteredTickets = tickets.filter((_, i) => i !== index);
    setTickets(filteredTickets);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!mainImage) {
      showInfoModal(
        "Banner Utama Wajib Diunggah",
        "Harap unggah gambar utama event!",
        "warning",
      );
      return;
    }

    if (selectedCategories.length === 0) {
      showInfoModal(
        "Kategori Belum Dipilih",
        "Harap pilih minimal 1 kategori!",
        "warning",
      );
      return;
    }

    for (let i = 0; i < tickets.length; i++) {
      if (!tickets[i].name || !tickets[i].quota) {
        showInfoModal(
          "Data Tiket Belum Lengkap",
          `Harap lengkapi Nama Tiket dan Quota pada baris ke-${i + 1}!`,
          "warning",
        );
        return;
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
    data.append("tickets", JSON.stringify(tickets));

    try {
      const response = await axios.post(
        `http://localhost:${process.env.PORT}/api/events`,
        data,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      showInfoModal(
        "Event Berhasil Dibuat",
        response.data.message,
        "success",
        () => {
          closeModal();

          if (AUTH_USER.role === "admin") {
            navigate("/events");
          } else {
            navigate("/events/my-events");
          }
        },
      );
    } catch (err) {
      console.error(err);
      showInfoModal(
        "Gagal Membuat Event",
        err.response?.data?.message || "Gagal membuat event.",
        "error",
      );
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
                className={`card-header text-white p-4 ${
                  AUTH_USER.role === "admin" ? "bg-success" : "bg-primary"
                }`}
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

                    <div className="mb-3 position-relative">
                      <label className="form-label fw-semibold">Lokasi *</label>
                      <input
                        type="text"
                        name="location"
                        className="form-control border-2"
                        placeholder="Ketik nama gedung, mall, kampus, atau alamat event..."
                        required
                        value={formData.location}
                        onChange={handleLocationChange}
                        onFocus={() => {
                          if (locationSuggestions.length > 0) {
                            setShowLocationSuggestions(true);
                          }
                        }}
                        onBlur={() => {
                          setTimeout(() => {
                            setShowLocationSuggestions(false);
                          }, 200);
                        }}
                      />

                      {isSearchingLocation && (
                        <div className="form-text text-primary">
                          Mencari rekomendasi lokasi...
                        </div>
                      )}

                      {showLocationSuggestions &&
                        locationSuggestions.length > 0 && (
                          <div
                            className="list-group position-absolute w-100 shadow-sm"
                            style={{
                              zIndex: 1000,
                              maxHeight: "240px",
                              overflowY: "auto",
                            }}
                          >
                            {locationSuggestions.map((place, index) => (
                              <button
                                type="button"
                                key={
                                  place.place_id ||
                                  `${place.address || place.name}-${index}`
                                }
                                className="list-group-item list-group-item-action"
                                onMouseDown={() => handleSelectLocation(place)}
                              >
                                <div className="fw-semibold">
                                  {place.name || "Lokasi tanpa nama"}
                                </div>
                                <small className="text-muted">
                                  {place.address || "-"}
                                </small>
                              </button>
                            ))}
                          </div>
                        )}

                      {formData.location.trim().length >= 3 &&
                        !isSearchingLocation &&
                        showLocationSuggestions &&
                        locationSuggestions.length === 0 &&
                        !isLocationSelected && (
                          <div className="form-text text-muted">
                            Tidak ada rekomendasi lokasi ditemukan.
                          </div>
                        )}
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
                      className={`btn btn-lg px-5 fw-bold text-white ${
                        AUTH_USER.role === "admin"
                          ? "btn-success"
                          : "btn-primary"
                      }`}
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

      <AppModal
        show={modal.show}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        showCancel={modal.showCancel}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        onConfirm={modal.onConfirm}
        onClose={closeModal}
      />

      <Footer />
    </>
  );
}

export default CreateEvent;
