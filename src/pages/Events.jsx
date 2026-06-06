import React, { useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Events() {
  useEffect(() => {
    document.title = "Events | Eventify";
  }, []);
  return (
    <>
      <Navbar />

      <div className="container">
        <div style={{ margin: "2rem 0" }}>
          <h4 className="fw-semibold">Events</h4>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default Events;
