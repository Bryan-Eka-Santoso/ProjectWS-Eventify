import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";

function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
  });

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/events/${id}`)
      .then((res) => setFormData(res.data));
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    await axios.put(`http://localhost:5000/api/events/${id}`, formData);
    alert("Update Berhasil!");
    navigate("/events/my-events");
  };

  return (
    <>
      <Navbar />
      <div className="container mt-5">
        <div
          className="card shadow border-primary mx-auto"
          style={{ maxWidth: "600px" }}
        >
          <div className="card-body">
            <h3>Edit Event</h3>
            <form onSubmit={handleUpdate}>
              <div className="mb-3">
                <label>Judul</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />
              </div>
              {/* Tambahkan input location, deskripsi, dll sesuai keinginan */}
              <button className="btn btn-primary w-100">
                Simpan Perubahan
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
export default EditEvent;
