import { Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Home from "../pages/Home";

import AdminRoute from "./AdminRoute";
import UserRoute from "./UserRoute";

//Events
import Events from "../pages/Events/Events";
import CreateEvent from "../pages/Events/CreateEvent";
import MyEvents from "../pages/Events/MyEvents";
import EditEvent from "../pages/Events/EditEvent";
import EventDetail from "../pages/Events/EventDetail";
import SavedEvents from "../pages/Events/SavedEvents";

// --- 🌟 IMPORT 2 HALAMAN BARU UNTUK API LUAR DI SINI 🌟 ---
import ExploreExternal from "../pages/Events/ExploreExternal"; // sesuaikan path folder kamu gais
import DetailExternal from "../pages/Events/DetailExternal"; // sesuaikan path folder kamu gais

//Community
import Community from "../pages/Community";

import HomeAdmin from "../pages/admin/HomeAdmin";
import MyProfile from "../pages/MyProfile";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<UserRoute />}>
        <Route path="/" element={<Home />} />
        {/* Events */}
        <Route path="/events" element={<Events />} />
        <Route path="/events/create" element={<CreateEvent />} />
        <Route path="/events/my-events" element={<MyEvents />} />
        <Route path="/events/edit/:id" element={<EditEvent />} />
        <Route path="/events/:id" element={<EventDetail />} />

        {/* External Events */}
        <Route path="/events/external" element={<ExploreExternal />} />
        <Route path="/events/external/:id" element={<DetailExternal />} />

        {/* Community */}
        <Route path="/community" element={<Community />} />

        {/* Saved */}
        <Route path="/events/saved" element={<SavedEvents />} />

        {/* My Profile */}
        <Route path="/profile" element={<MyProfile />} />
      </Route>

      {/* Admin */}
      <Route element={<AdminRoute />}>
        <Route path="/admin/home" element={<HomeAdmin />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
