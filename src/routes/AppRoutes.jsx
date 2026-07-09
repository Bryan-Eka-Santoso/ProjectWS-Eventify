import { Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import Home from "../pages/Home";

import ProtectedRoute from "./ProtectedRoute";
import OrganizerRoute from "./OrganizerRoute";
import AdminRoute from "./AdminRoute";

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
import MyProfile from "../pages/MyProfile";
import PointHistory from "../pages/PointHistory";
import Connections from "../pages/Connections";

import Feed from "../pages/Feed/Feed";
import CreatePost from "../pages/Feed/CreatePost";
import PostDetail from "../pages/Feed/PostDetail";
import EditPost from "../pages/Feed/EditPost";

import TransactionHistory from "../pages/Transactions/TransactionHistory";
import TransactionDetail from "../pages/Transactions/TransactionDetail";
import EventParticipants from "../pages/Events/EventParticipants";

import HomeAdmin from "../pages/admin/HomeAdmin";
import CancellationRequests from "../pages/admin/CancellationRequests";
import Categories from "../pages/admin/Categories";
import Discounts from "../pages/admin/Discounts";
import AdminEvents from "../pages/admin/Events";
import ChatRooms from "../pages/admin/ChatRooms";
import AdminUsers from "../pages/admin/Users";
import AdminTransactions from "../pages/admin/Transactions";
import AdminPosts from "../pages/admin/Posts";

function AppRoutes() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/events" element={<Events />} />
      <Route path="/" element={<Home />} />

      {/* USER & ORGANIZER */}
      <Route element={<ProtectedRoute />}>
        <Route path="/events/:id" element={<EventDetail />} />

        <Route path="/events/external" element={<ExploreExternal />} />

        <Route path="/events/external/:id" element={<DetailExternal />} />

        <Route path="/events/saved" element={<SavedEvents />} />

        <Route path="/events/vouchers" element={<VoucherShop />} />

        <Route path="/events/my-tickets" element={<MyTickets />} />

        <Route path="/community" element={<Community />} />

        <Route path="/profile" element={<MyProfile />} />

        <Route path="/profile/points" element={<PointHistory />} />

        <Route path="/profile/followers" element={<Connections />} />

        <Route path="/profile/following" element={<Connections />} />

        <Route path="/feed" element={<Feed />} />

        <Route path="/feed/create" element={<CreatePost />} />

        <Route path="/feed/:id" element={<PostDetail />} />

        <Route path="/feed/:id/edit" element={<EditPost />} />

        <Route path="/transactions" element={<TransactionHistory />} />

        <Route path="/transactions/:id" element={<TransactionDetail />} />
        <Route
          path="/events/:id/change/:eventChangeId"
          element={<EventChangeRefund />}
        />
      </Route>

      {/* ORGANIZER ONLY */}
      <Route element={<OrganizerRoute />}>
        <Route path="/events/create" element={<CreateEvent />} />
        <Route path="/events/my-events" element={<MyEvents />} />

        <Route path="/events/:id/edit" element={<EditEvent />} />

        <Route
          path="/events/:id/validate-ticket"
          element={<ValidateTicket />}
        />

        <Route
          path="/events/:id/participants"
          element={<EventParticipants />}
        />

      </Route>

      {/* ADMIN */}
      <Route element={<AdminRoute />}>
        <Route path="/admin/home" element={<HomeAdmin />} />

        <Route
          path="/admin/cancellation-requests"
          element={<CancellationRequests />}
        />

        <Route path="/admin/categories" element={<Categories />} />

        <Route path="/admin/discounts" element={<Discounts />} />

        <Route path="/admin/events" element={<AdminEvents />} />

        <Route path="/admin/chat-rooms" element={<ChatRooms />} />

        <Route path="/admin/users" element={<AdminUsers />} />

        <Route path="/admin/transactions" element={<AdminTransactions />} />

        <Route path="/admin/posts" element={<AdminPosts />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
