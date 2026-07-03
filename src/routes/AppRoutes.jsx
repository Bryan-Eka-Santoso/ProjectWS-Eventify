import { Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";

import Home from "../pages/Home";
//Events
import Events from "../pages/Events/Events";
import CreateEvent from "../pages/Events/CreateEvent";
import MyEvents from "../pages/Events/MyEvents";
import EditEvent from "../pages/Events/EditEvent";
import EventDetail from "../pages/Events/EventDetail";
import SavedEvents from "../pages/Events/SavedEvents";
import VoucherShop from "../pages/Events/VoucherShop"; // 🔥 IMPORT BARU HALAMAN VOUCHER GESS!
import MyTickets from "../pages/Events/MyTickets"; // 🔥 IMPORT BARU HALAMAN MY TICKETS USER GESS!

// --- 🌟 IMPORT 2 HALAMAN BARU UNTUK API LUAR DI SINI 🌟 ---
import ExploreExternal from "../pages/Events/ExploreExternal";
import DetailExternal from "../pages/Events/DetailExternal";

//Community
import Community from "../pages/Community";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* --- Events Lokal --- */}
      <Route path="/events" element={<Events />} />
      <Route path="/events/create" element={<CreateEvent />} />
      <Route path="/events/my-events" element={<MyEvents />} />
      <Route path="/events/edit/:id" element={<EditEvent />} />
      <Route path="/events/:id" element={<EventDetail />} />

      {/* --- 🔥 RUTE BARU PENUKARAN VOUCHER DENGAN POIN USER --- */}
      <Route path="/events/vouchers" element={<VoucherShop />} />

      {/* --- 🔥 RUTE BARU UNTUK DAFTAR TIKET RESMI MILIK USER --- */}
      <Route path="/events/my-tickets" element={<MyTickets />} />

      {/* --- 🌟 2 RUTE BARU UNTUK INTEGRASI API LUAR 🌟 --- */}
      <Route path="/events/external" element={<ExploreExternal />} />
      <Route path="/events/external/:id" element={<DetailExternal />} />

      {/* --- Community --- */}
      <Route path="/community" element={<Community />} />

      {/* --- 🔖 RUTE BARU UNTUK HALAMAN SAVED EVENTS (Bookmark) --- */}
      <Route path="/events/saved" element={<SavedEvents />} />
    </Routes>
  );
}

export default AppRoutes;
