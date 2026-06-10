import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";

function MyEvents() {
  const [myEvents, setMyEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    const res = await axios.get("http://localhost:5000/api/events/my-events");
    setMyEvents(res.data);
  };

  const updateStatus = async (id, status) => {
    await axios.patch(`http://localhost:5000/api/events/${id}/status`, {
      status,
    });
    fetchMyEvents();
  };

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="fw-bold">Manajemen Event Saya</h4>
          <Link to="/events" className="btn btn-secondary">
            Kembali
          </Link>
        </div>

        <table className="table table-hover bg-white shadow-sm rounded">
          <thead className="table-primary">
            <tr>
              <th>Judul Event</th>
              <th>Status</th>
              <th>Lokasi</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {myEvents.map((e) => (
              <tr key={e.id}>
                <td>{e.title}</td>
                <td>
                  <span className="badge bg-info">{e.status}</span>
                </td>
                <td>{e.location}</td>
                <td>
                  <div className="btn-group">
                    {e.status === "draft" && (
                      <button
                        onClick={() => updateStatus(e.id, "pending_approval")}
                        className="btn btn-sm btn-success"
                      >
                        Ajukan ✓
                      </button>
                    )}
                    <button
                      onClick={() => updateStatus(e.id, "canceled")}
                      className="btn btn-sm btn-danger"
                    >
                      Batal X
                    </button>
                    <Link
                      to={`/events/edit/${e.id}`}
                      className="btn btn-sm btn-warning"
                    >
                      Edit
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
export default MyEvents;
