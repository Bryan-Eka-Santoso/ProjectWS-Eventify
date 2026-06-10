import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar";

function Events() {
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const role = "organizer"; // Hardcoded role

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const res = await axios.get("http://localhost:5000/api/events/published");
    setEvents(res.data);
  };

  // Filter pencarian di sisi client
  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between mb-4">
          <input
            type="text"
            className="form-control w-50"
            placeholder="Cari event seru di sini..."
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="gap-2 d-flex">
            {role !== "user" && (
              <>
                <Link
                  to="/events/my-events"
                  className="btn btn-outline-primary"
                >
                  My Events
                </Link>
                <Link to="/events/create" className="btn btn-primary">
                  + Create Event
                </Link>
              </>
            )}
          </div>
        </div>

        <h4 className="fw-bold text-primary mb-3">Featured Events</h4>
        <div className="row">
          {filteredEvents.map((e) => (
            <div className="col-md-3 mb-4" key={e.id}>
              <div className="card h-100 shadow-sm border-0">
                <div className="bg-primary text-white p-4 text-center">
                  Banner Placeholder
                </div>
                <div className="card-body">
                  <h6 className="fw-bold">{e.title}</h6>
                  <p className="small text-muted">{e.location}</p>
                  <button className="btn btn-primary btn-sm w-100">
                    Beli Tiket
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
export default Events;
