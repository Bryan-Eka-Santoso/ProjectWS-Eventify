import React, { useEffect } from "react";
import Navbar from "../../components/admin/Navbar";
import Footer from "../../components/admin/Footer";

function HomeAdmin() {
  useEffect(() => {
    document.title = "Home (Admin) | Eventify";
  }, []);
  return (
    <>
      <Navbar />

      <div className="container">
        <div style={{ margin: "2rem 0" }}>
          <h4 className="fw-semibold">Home (Admin)</h4>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default HomeAdmin;
