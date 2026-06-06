import React, { useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function Home() {
  useEffect(() => {
    document.title = "Home | Eventify";
  }, []);
  return (
    <>
      <Navbar />

      <div className="container">
        <div style={{ margin: "2rem 0" }}>
          <h4 className="fw-semibold">Home</h4>
        </div>
      </div>

      <Footer />
    </>
  );
}

export default Home;
