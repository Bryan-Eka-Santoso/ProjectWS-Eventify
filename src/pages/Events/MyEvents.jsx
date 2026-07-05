import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { AUTH_USER } from "../../config/auth"; // 🔑 Membaca data privasi login

function MyEvents() {
  const [myEvents, setMyEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(
        `http://localhost:5000/api/events/my-events?user_id=${AUTH_USER.id}&role=${AUTH_USER.role}`,
      )
      .then((res) => {
        setMyEvents(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Gagal memuat event saya:", err);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <Navbar />
      <div className="container mt-5 mb-5" style={{ minHeight: "80vh" }}>
        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
          <div>
            <h2 className="fw-bold text-dark mb-1">📋 My Managed Events</h2>
            <p className="text-muted mb-0">
              Menampilkan data milik:{" "}
              <strong className="text-primary">{AUTH_USER.name}</strong> (
              {AUTH_USER.role.toUpperCase()})
            </p>
          </div>
          <Link
            to="/events"
            className="btn btn-outline-secondary fw-bold rounded-3"
          >
            ⬅️ Beranda Event
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : myEvents.length === 0 ? (
          <div className="text-center py-5 bg-light rounded-4 border border-dashed">
            <h5 className="text-muted fw-normal">
              Kamu belum membuat / mengadopsi event apapun.
            </h5>
            {AUTH_USER.role !== "user" && (
              <Link
                to="/events/create"
                className="btn btn-primary fw-bold mt-3 rounded-3"
              >
                + Buat Event Sekarang
              </Link>
            )}
          </div>
        ) : (
          <div className="table-responsive bg-white rounded-4 shadow-sm p-3 border">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th scope="col" className="ps-3">
                    Judul Event
                  </th>
                  <th scope="col">Lokasi</th>
                  <th scope="col">Tanggal Mulai</th>
                  <th scope="col" className="pe-3">
                    Status DB
                  </th>
                </tr>
              </thead>
              <tbody>
                {myEvents.map((e) => (
                  <tr key={e.id}>
                    <td className="fw-bold text-dark ps-3">{e.title}</td>
                    <td>📍 {e.location}</td>
                    <td>
                      📅{" "}
                      {new Date(e.start_date).toLocaleDateString("id-ID", {
                        dateStyle: "medium",
                      })}
                    </td>
                    <td className="pe-3">
                      <span
                        className={`badge px-3 py-2 rounded-pill ${e.status === "published" ? "bg-success" : "bg-warning text-dark"}`}
                      >
                        {e.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default MyEvents;
