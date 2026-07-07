import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";

import Home from "../pages/Home";

import Events from "../pages/Events/Events";
import CreateEvent from "../pages/Events/CreateEvent";
import MyEvents from "../pages/Events/MyEvents";
import EditEvent from "../pages/Events/EditEvent";
import EventDetail from "../pages/Events/EventDetail";
import SavedEvents from "../pages/Events/SavedEvents";
import VoucherShop from "../pages/Events/VoucherShop";
import MyTickets from "../pages/Events/MyTickets";
import ValidateTicket from "../pages/Events/ValidateTicket";
import EventChangeRefund from "../pages/Events/EventChangeRefund";

import ExploreExternal from "../pages/Events/ExploreExternal";
import DetailExternal from "../pages/Events/DetailExternal";

import Community from "../pages/Community";

import HomeAdmin from "../pages/admin/HomeAdmin";
import CancellationRequests from "../pages/admin/CancellationRequests";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/events" element={<Events />} />
      <Route path="/events/create" element={<CreateEvent />} />
      <Route path="/events/my-events" element={<MyEvents />} />
      <Route path="/events/vouchers" element={<VoucherShop />} />
      <Route path="/events/my-tickets" element={<MyTickets />} />
      <Route path="/events/external" element={<ExploreExternal />} />
      <Route path="/events/external/:id" element={<DetailExternal />} />
      <Route path="/events/saved" element={<SavedEvents />} />

      <Route
        path="/events/cancellation-requests"
        element={<Navigate to="/admin/cancellation-requests" replace />}
      />

      <Route path="/events/:id/edit" element={<EditEvent />} />
      <Route path="/events/:id/validate-ticket" element={<ValidateTicket />} />
      <Route path="/events/:id/change/:eventChangeId" element={<EventChangeRefund />}/>
      <Route path="/events/:id" element={<EventDetail />} />

      <Route path="/community" element={<Community />} />

      <Route path="/admin/home" element={<HomeAdmin />} />
      <Route
        path="/admin/cancellation-requests"
        element={<CancellationRequests />}
      />
    </Routes>
  );
}

export default AppRoutes;  