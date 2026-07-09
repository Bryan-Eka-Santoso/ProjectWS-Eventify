import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../../config/api"; // ✅ Menggunakan instance api kita
import { getCurrentUser } from "../../config/auth";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AppModal from "../../components/AppModal";

function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    start_date: "",
    end_date: "",
    change_reason: "",
  });

  const [mainImage, setMainImage] = useState(null);
  const [album, setAlbum] = useState([]);
  const [oldEvent, setOldEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [isLocationSelected, setIsLocationSelected] = useState(false);

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

  const showConfirmModal = ({
    title,
    message,
    type = "confirm",
    confirmText = "Ya",
    cancelText = "Batal",
    onConfirm,
  }) => {
    setModal({
      show: true,
      title,
      message,
      type,
      showCancel: true,
      confirmText,
      cancelText,
      onConfirm,
    });
  };

  const closeModal = () => {
    setModal((prev) => ({
      ...prev,
      show: false,
    }));
  };

  const formatDateForInput = (dateValue) => {
    if (!dateValue) return "";

    const date = new Date(dateValue);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);

    return localDate.toISOString().slice(0, 16);
  };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);

        const res = await api.get(`/events/${id}`);
        const event = res.data;

        setOldEvent(event);

        setFormData({
          title: event.title || "",
          description: event.description || "",
          location: event.location || "",
          start_date: formatDateForInput(event.start_date),
          end_date: formatDateForInput(event.end_date),
          change_reason: "",
        });

        setIsLocationSelected(true);
      } catch (error) {
        console.error("Gagal memuat detail event:", error);
        showInfoModal(
          "Gagal Memuat Detail Event",
          error.response?.data?.message || "Gagal memuat detail event.",
          "error",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

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

        const response = await api.get(
          "/events/locations/autocomplete",
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

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLocationChange = (e) => {
    const value = e.target.value;

    setIsLocationSelected(false);

    setFormData((prev) => ({
      ...prev,
      location: value,
    }));
  };

  const handleSelectLocation = (place) => {
    const selectedAddress = place.address || place.name || "";

    setFormData((prev) => ({
      ...prev,
      location: selectedAddress,
    }));

    setIsLocationSelected(true);
    setLocationSuggestions([]);
    setShowLocationSuggestions(false);
  };

  const isScheduleOrLocationChanged = () => {
    if (!oldEvent) return false;

    const oldStart = formatDateForInput(oldEvent.start_date);
    const oldEnd = formatDateForInput(oldEvent.end_date);
    const oldLocation = oldEvent.location || "";

    return (
      oldStart !== formData.start_date ||
      oldEnd !== formData.end_date ||
      oldLocation.trim() !== formData.location.trim()
    );
  };

  const processUpdateEvent = async () => {
    try {
      setSubmitting(true);

      const data = new FormData();

      data.append("title", formData.title);
      data.append("description", formData.description || "");
      data.append("location", formData.location);
      data.append("start_date", formData.start_date);
      data.append("end_date", formData.end_date);

      if (formData.change_reason.trim()) {
        data.append("change_reason", formData.change_reason);
      }

      if (mainImage) {
        data.append("main_image", mainImage);
      }

      album.forEach((file) => {
        data.append("album", file);
      });

      const res = await api.put(
        `/events/${id}`,
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const responseData = res.data?.data;

      if (responseData?.is_major_change) {
        showInfoModal(
          "Event Berhasil Diperbarui",
          "Event berhasil diperbarui. Karena jadwal/lokasi berubah, buyer akan mendapat notification dan bisa mengajukan refund.",
          "success",
          () => {
            closeModal();
            navigate("/events/my-events");
          },
        );
      } else {
        showInfoModal(
          "Event Berhasil Diperbarui",
          "Event berhasil diperbarui.",
          "success",
          () => {
            closeModal();
            navigate("/events/my-events");
          },
        );
      }
    } catch (error) {
      console.error("Gagal update event:", error);
      console.log("ERROR RESPONSE:", error.response?.data);

      const detailMessage =
        error.response?.data?.error ||
        error.response?.data?.details ||
        error.response?.data?.message ||
        "Gagal update event.";

      showInfoModal(
        "Gagal Update Event",
        typeof detailMessage === "string"
          ? detailMessage
          : JSON.stringify(detailMessage, null, 2),
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showInfoModal(
        "Judul Kosong",
        "Judul event tidak boleh kosong.",
        "warning",
      );
      return;
    }

    if (!formData.location.trim()) {
      showInfoModal(
        "Lokasi Kosong",
        "Lokasi event tidak boleh kosong.",
        "warning",
      );
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      showInfoModal(
        "Tanggal Belum Lengkap",
        "Tanggal mulai dan tanggal selesai wajib diisi.",
        "warning",
      );
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      showInfoModal(
        "Tanggal Tidak Valid",
        "Tanggal selesai tidak boleh lebih awal dari tanggal mulai.",
        "warning",
      );
      return;
    }

    if (isScheduleOrLocationChanged() && !formData.change_reason.trim()) {
      showConfirmModal({
        title: "Konfirmasi Perubahan Event",
        message:
          "Jadwal atau lokasi berubah, tapi alasan perubahan masih kosong. Tetap lanjut?",
        type: "warning",
        confirmText: "Tetap Lanjut",
        cancelText: "Batal",
        onConfirm: () => {
          closeModal();
          processUpdateEvent();
        },
      });

      return;
    }

    processUpdateEvent();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div
          className="container py-5 text-center"
          style={{ minHeight: "75vh" }}
        >
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted mt-2">Memuat data event...</p>
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

  return (
    <>
      <Navbar />

      <div className="container mt-5 mb-5" style={{ minHeight: "80vh" }}>
        <div className="mb-4">
          <Link
            to="/events/my-events"
            className="btn btn-light border fw-semibold rounded-3"
          >
            ⬅️ Kembali ke My Events
          </Link>
        </div>

        <div
          className="card shadow border-0 rounded-4 mx-auto"
          style={{ maxWidth: "780px" }}
        >
          <div className="card-header bg-warning text-dark rounded-top-4 p-4">
            <h3 className="fw-bold mb-1">✏️ Edit Event</h3>
            <p className="mb-0 small">
              Jika mengubah jadwal atau lokasi, sistem akan membuka refund
              window dan mengirim notification ke buyer.
            </p>
          </div>

          <div className="card-body p-4">
            <form onSubmit={handleUpdate}>
              <div className="mb-3">
                <label className="form-label fw-semibold">Judul Event</label>
                <input
                  type="text"
                  name="title"
                  className="form-control"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Masukkan judul event"
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Deskripsi</label>
                <textarea
                  name="description"
                  className="form-control"
                  rows="4"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Masukkan deskripsi event"
                ></textarea>
              </div>

              <div className="mb-3 position-relative">
                <label className="form-label fw-semibold">Lokasi</label>
                <input
                  type="text"
                  name="location"
                  className="form-control"
                  value={formData.location}
                  onChange={handleLocationChange}
                  placeholder="Ketik nama gedung, mall, kampus, atau alamat event..."
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

                {showLocationSuggestions && locationSuggestions.length > 0 && (
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

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label fw-semibold">
                    Tanggal Mulai
                  </label>
                  <input
                    type="datetime-local"
                    name="start_date"
                    className="form-control"
                    value={formData.start_date}
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
                    value={formData.end_date}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Alasan Perubahan
                </label>
                <textarea
                  name="change_reason"
                  className="form-control"
                  rows="3"
                  value={formData.change_reason}
                  onChange={handleChange}
                  placeholder="Isi jika kamu mengubah jadwal atau lokasi..."
                ></textarea>
                <small className="text-muted">
                  Alasan ini akan disimpan ke event_changes jika perubahan
                  termasuk jadwal atau lokasi.
                </small>
              </div>

              <hr className="my-4" />

              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Ganti Main Image
                </label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={(e) => setMainImage(e.target.files[0])}
                />
                <small className="text-muted">
                  Kosongkan jika tidak ingin mengganti gambar utama.
                </small>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold">
                  Tambah Album Image
                </label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  multiple
                  onChange={(e) => setAlbum(Array.from(e.target.files))}
                />
                <small className="text-muted">
                  File baru akan ditambahkan ke album event.
                </small>
              </div>

              <div className="d-flex gap-2">
                <Link
                  to="/events/my-events"
                  className="btn btn-light border w-50 fw-semibold"
                >
                  Batal
                </Link>

                <button
                  type="submit"
                  className="btn btn-warning w-50 fw-bold"
                  disabled={submitting}
                >
                  {submitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
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

export default EditEvent;
