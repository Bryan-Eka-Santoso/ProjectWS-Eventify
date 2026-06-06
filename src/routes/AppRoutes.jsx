import { Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";

import Home from "../pages/Home";
import Events from "../pages/Events";
import Community from "../pages/Community";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/events" element={<Events />} />
      <Route path="/community" element={<Community />} />
    </Routes>
  );
}

export default AppRoutes;
