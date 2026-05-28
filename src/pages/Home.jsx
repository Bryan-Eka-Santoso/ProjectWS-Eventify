import React, { useEffect } from "react";

function Home() {
  useEffect(() => {
    document.title = "Beranda | Eventify";
  }, []);
  return <div>Beranda</div>;
}

export default Home;
