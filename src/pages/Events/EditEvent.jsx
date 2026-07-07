import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { AUTH_USER } from "../../config/auth";

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

        const res = await axios.get(`http://localhost:5000/api/events/${id}`);
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
      } catch (error) {
        console.error("Gagal memuat detail event:", error);
        alert(error.response?.data?.message || "Gagal memuat detail event.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("Judul event tidak boleh kosong.");
      return;
    }

    if (!formData.location.trim()) {
      alert("Lokasi event tidak boleh kosong.");
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      alert("Tanggal mulai dan tanggal selesai wajib diisi.");
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      alert("Tanggal selesai tidak boleh lebih awal dari tanggal mulai.");
      return;
    }

    if (isScheduleOrLocationChanged() && !formData.change_reason.trim()) {
      const confirmWithoutReason = window.confirm(
        "Jadwal atau lokasi berubah, tapi alasan perubahan masih kosong. Tetap lanjut?"
      );

      if (!confirmWithoutReason) return;
    }

    try {
      setSubmitting(true);

      const data = new FormData();

      data.append("user_id", AUTH_USER.id);
      data.append("role", AUTH_USER.role);
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

      const res = await axios.put(
        `http://localhost:5000/api/events/${id}`,
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const responseData = res.data?.data;

      if (responseData?.is_major_change) {
        alert(
          "Event berhasil diperbarui. Karena jadwal/lokasi berubah, buyer akan mendapat notification dan bisa mengajukan refund."
        );
      } else {
        alert("Event berhasil diperbarui.");
      }

      navigate("/events/my-events");
    } catch (error) {
      console.error("Gagal update event:", error);
      console.log("ERROR RESPONSE:", error.response?.data);

      const detailMessage =
        error.response?.data?.error ||
        error.response?.data?.details ||
        error.response?.data?.message ||
        "Gagal update event.";

      alert(
        typeof detailMessage === "string"
          ? detailMessage
          : JSON.stringify(detailMessage, null, 2)
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container py-5 text-center" style={{ minHeight: "75vh" }}>
          <div className="spinner-border text-primary" role="status"></div>
          <p className="text-muted mt-2">Memuat data event...</p>
        </div>
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

              <div className="mb-3">
                <label className="form-label fw-semibold">Lokasi</label>
                <input
                  type="text"
                  name="location"
                  className="form-control"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Masukkan lokasi event"
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

      <Footer />
    </>
  );
}

export default EditEvent;