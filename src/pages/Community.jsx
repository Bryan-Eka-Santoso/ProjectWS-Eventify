import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import socketService from "../services/socketService";
import { AUTH_USER } from "../config/auth";

const SERVER_URL = "http://localhost:5000";
const API_URL = `${SERVER_URL}/api/community`;
const EVENT_API_URL = `${SERVER_URL}/api/events/published`;

const initialCreateForm = {
  name: "",
  description: "",
  profile_image_file: null,
  category_ids: [],
};

const initialMediaForm = {
  file: null,
  body: "",
  preview: "",
};

function Community() {
  const currentUser = AUTH_USER;

  const [chatRooms, setChatRooms] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [memberCount, setMemberCount] = useState(0);
  const [unreadCounts, setUnreadCounts] = useState({});

  const [isMember, setIsMember] = useState(false);
  const [currentMemberRole, setCurrentMemberRole] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortBy, setSortBy] = useState("newest");

  const [messageInput, setMessageInput] = useState("");
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingRoomDetail, setLoadingRoomDetail] = useState(false);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [mediaUploading, setMediaUploading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEventPickerModal, setShowEventPickerModal] = useState(false);
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);
  const [showEventShareModal, setShowEventShareModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);

  const [createForm, setCreateForm] = useState(initialCreateForm);
  const [imagePreview, setImagePreview] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventShareMessage, setEventShareMessage] = useState("");
  const [mediaForm, setMediaForm] = useState(initialMediaForm);

  const [toast, setToast] = useState("");

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const currentUserName = currentUser?.name || "User";

  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToast(""), 2400);
  }, []);

  const imageSrc = useCallback((url) => {
    if (!url) return "https://via.placeholder.com/120x120?text=Group";
    if (url.startsWith("http")) return url;
    return `${SERVER_URL}${url}`;
  }, []);

  const getInitials = useCallback((name = "?") => {
    return String(name)
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "?";
  }, []);

  const formatTime = useCallback((dateValue) => {
    if (!dateValue) return "Baru saja";
    return new Date(dateValue).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);


  const formatEventDate = useCallback((dateValue) => {
    if (!dateValue) return "Tanggal belum tersedia";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return String(dateValue);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, []);

  const getEventId = useCallback((event) => {
    return event?.id || event?.event_id || event?.eventId;
  }, []);

  const getEventTitle = useCallback((event) => {
    return event?.title || event?.name || event?.event_name || event?.eventName || `Event #${getEventId(event) || "?"}`;
  }, [getEventId]);

  const getEventLocation = useCallback((event) => {
    return event?.location || event?.venue || event?.place || event?.address || "Lokasi belum tersedia";
  }, []);

  const getEventDate = useCallback((event) => {
    return event?.event_date || event?.date || event?.start_date || event?.start_time || event?.created_at;
  }, []);

  const getEventPrice = useCallback((event) => {
    const value = event?.price || event?.ticket_price || event?.start_price || event?.min_price;
    if (value === undefined || value === null || value === "") return "Harga belum tersedia";
    if (typeof value === "number") return `Rp${value.toLocaleString("id-ID")}`;
    return String(value);
  }, []);

  const getEventImage = useCallback((event) => {
    const url =
      event?.main_image_url ||
      event?.image_url ||
      event?.poster_url ||
      event?.poster ||
      event?.image ||
      event?.thumbnail;

    if (!url) return "https://via.placeholder.com/600x400?text=No+Poster";
    if (url.startsWith("http")) return url;
    if (url.startsWith("/uploads/")) return `${SERVER_URL}${url}`;

    return `${SERVER_URL}/uploads/${url}`;
  }, []);

  const roomCategories = useCallback((room) => {
    return room?.Categories || room?.categories || [];
  }, []);

  const selectedRoomCategories = useMemo(() => {
    return roomCategories(selectedRoom);
  }, [selectedRoom, roomCategories]);

  const canManageGroup = useMemo(() => {
    return currentMemberRole === "owner" || currentMemberRole === "admin";
  }, [currentMemberRole]);

  const sharedEvents = useMemo(() => {
    return messages.filter((message) => message.message_type === "recommendation");
  }, [messages]);

  const fetchUnreadCounts = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/unread-counts`, {
        params: { user_id: currentUser.id },
      });

      const counts = {};
      response.data.data.forEach((item) => {
        counts[item.chat_room_id] = item.unread_count;
      });

      setUnreadCounts(counts);
    } catch (error) {
      console.error("Error fetching unread counts:", error);
    }
  }, [currentUser.id]);

  const fetchChatRooms = useCallback(async () => {
    try {
      setLoadingRooms(true);

      const params = {
        page: 1,
        limit: 50,
        sortBy,
      };

      if (searchInput.trim()) params.search = searchInput.trim();
      if (selectedCategories.length > 0) {
        params.categoryIds = selectedCategories.join(",");
      }

      const response = await axios.get(API_URL, { params });
      setChatRooms(response.data.data || []);
      fetchUnreadCounts();
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
      showToast(error.response?.data?.message || "Gagal mengambil data community");
    } finally {
      setLoadingRooms(false);
    }
  }, [searchInput, selectedCategories, sortBy, fetchUnreadCounts, showToast]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(response.data.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    }
  }, []);


  const fetchEvents = useCallback(async () => {
    try {
      setLoadingEvents(true);

      const response = await axios.get(EVENT_API_URL);

      const payload = response.data;

      const list = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.data?.data)
          ? payload.data.data
          : Array.isArray(payload?.data?.rows)
            ? payload.data.rows
            : Array.isArray(payload?.events)
              ? payload.events
              : Array.isArray(payload)
                ? payload
                : [];

      setEvents(list);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
      showToast(error.response?.data?.message || "Gagal mengambil data event");
    } finally {
      setLoadingEvents(false);
    }
  }, [showToast]);

  const fetchRoomMembers = useCallback(async (roomId) => {
    const response = await axios.get(`${API_URL}/${roomId}/members`, {
      params: { page: 1, limit: 100 },
    });
    setMembers(response.data.data || []);
  }, []);

  const fetchMemberCount = useCallback(async (roomId) => {
    const response = await axios.get(`${API_URL}/${roomId}/member-count`);
    setMemberCount(response.data.data?.total_members || 0);
  }, []);

  const fetchMessages = useCallback(async (roomId) => {
    const response = await axios.get(`${API_URL}/${roomId}/messages`, {
      params: { page: 1, limit: 80 },
    });
    setMessages(response.data.data || []);
  }, []);

  const fetchPinnedMessages = useCallback(async (roomId) => {
    const response = await axios.get(`${API_URL}/${roomId}/pinned-messages`, {
      params: { user_id: currentUser.id },
    });
    setPinnedMessages(response.data.data || []);
  }, [currentUser.id]);

  const markAllAsRead = useCallback(async (roomId) => {
    try {
      await axios.post(`${API_URL}/${roomId}/read-all`, {
        user_id: currentUser.id,
      });
      fetchUnreadCounts();
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [currentUser.id, fetchUnreadCounts]);

  const loadSelectedRoomData = useCallback(async (room, memberStatus) => {
    if (!room) return;

    try {
      setLoadingRoomDetail(true);

      await Promise.all([
        fetchRoomMembers(room.id),
        fetchMemberCount(room.id),
      ]);

      if (memberStatus) {
        await Promise.all([
          fetchMessages(room.id),
          fetchPinnedMessages(room.id),
        ]);
        markAllAsRead(room.id);
      } else {
        setMessages([]);
        setPinnedMessages([]);
      }
    } catch (error) {
      console.error("Error loading room data:", error);
      showToast(error.response?.data?.message || "Gagal memuat detail community");
    } finally {
      setLoadingRoomDetail(false);
    }
  }, [fetchMemberCount, fetchMessages, fetchPinnedMessages, fetchRoomMembers, markAllAsRead, showToast]);

  const handleSelectRoom = async (room) => {
    try {
      if (selectedRoom && selectedRoom.id !== room.id && isMember) {
        socketService.leaveRoom(selectedRoom.id, currentUserName);
      }

      setSelectedRoom(room);
      setMessages([]);
      setPinnedMessages([]);
      setMembers([]);
      setMemberCount(0);
      setTypingUsers([]);
      setMessageInput("");

      const membershipResponse = await axios.get(`${API_URL}/check-membership`, {
        params: {
          chat_room_id: room.id,
          user_id: currentUser.id,
        },
      });

      const memberStatus = !!membershipResponse.data.isMember;
      const role = membershipResponse.data.data?.role || null;

      setIsMember(memberStatus);
      setCurrentMemberRole(role);

      await loadSelectedRoomData(room, memberStatus);

      if (memberStatus) {
        socketService.joinRoom(room.id, currentUser.id, currentUserName);
      }
    } catch (error) {
      console.error("Error selecting room:", error);
      showToast(error.response?.data?.message || "Gagal membuka community");
    }
  };

  const handleJoinRoom = async () => {
    if (!selectedRoom) return;

    try {
      await axios.post(`${API_URL}/join`, {
        chat_room_id: selectedRoom.id,
        user_id: currentUser.id,
      });

      setIsMember(true);
      setCurrentMemberRole("member");
      socketService.joinRoom(selectedRoom.id, currentUser.id, currentUserName);
      await loadSelectedRoomData(selectedRoom, true);
      fetchUnreadCounts();
      showToast("Berhasil join community");
    } catch (error) {
      console.error("Error joining room:", error);
      showToast(error.response?.data?.message || "Gagal join community");
    }
  };

  const handleLeaveRoom = async () => {
    if (!selectedRoom) return;

    const confirmLeave = window.confirm(`Keluar dari ${selectedRoom.name}?`);
    if (!confirmLeave) return;

    try {
      await axios.post(`${API_URL}/leave`, {
        chat_room_id: selectedRoom.id,
        user_id: currentUser.id,
      });

      socketService.leaveRoom(selectedRoom.id, currentUserName);
      setIsMember(false);
      setCurrentMemberRole(null);
      setMessages([]);
      setPinnedMessages([]);
      fetchUnreadCounts();
      showToast("Berhasil keluar dari community");
    } catch (error) {
      console.error("Error leaving room:", error);
      showToast(error.response?.data?.message || "Gagal keluar community");
    }
  };

  const handleSendMessage = () => {
    if (!selectedRoom || !isMember) return;

    const body = messageInput.trim();
    if (!body) return;

    socketService.sendMessage(selectedRoom.id, currentUser.id, "text", body);
    socketService.userStopTyping(selectedRoom.id, currentUserName);
    setMessageInput("");
    setIsTyping(false);
  };

  const handleMessageInputChange = (event) => {
    setMessageInput(event.target.value);

    if (!selectedRoom || !isMember) return;

    if (!isTyping) {
      socketService.userTyping(selectedRoom.id, currentUserName);
      setIsTyping(true);
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketService.userStopTyping(selectedRoom.id, currentUserName);
      setIsTyping(false);
    }, 1200);
  };

  const handleCreateRoom = async (event) => {
    event.preventDefault();

    if (!createForm.name.trim()) {
      showToast("Nama community wajib diisi");
      return;
    }

    if (!createForm.profile_image_file) {
      showToast("Foto group wajib diupload");
      return;
    }

    try {
      setCreatingRoom(true);

      const formData = new FormData();
      formData.append("name", createForm.name.trim());
      formData.append("description", createForm.description.trim());
      formData.append("creator_id", currentUser.id);
      formData.append("category_ids", JSON.stringify(createForm.category_ids));
      formData.append("profile_image", createForm.profile_image_file);

      const response = await axios.post(API_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newRoom = response.data.data;
      setChatRooms((prev) => [newRoom, ...prev]);
      setShowCreateModal(false);
      setCreateForm(initialCreateForm);
      setImagePreview(null);
      showToast("Community berhasil dibuat");
      handleSelectRoom(newRoom);
    } catch (error) {
      console.error("Error creating room:", error);
      showToast(error.response?.data?.message || "Gagal membuat community");
    } finally {
      setCreatingRoom(false);
    }
  };

  const openAttachmentMenu = () => {
    if (!selectedRoom || !isMember) return;
    setShowAttachmentMenu((prev) => !prev);
  };

  const openEventPicker = async () => {
    if (!selectedRoom || !isMember) return;
    setShowAttachmentMenu(false);
    setShowEventPickerModal(true);
    await fetchEvents();
  };

  const openMediaPicker = () => {
    if (!selectedRoom || !isMember) return;
    setShowAttachmentMenu(false);
    setMediaForm(initialMediaForm);
    setShowMediaModal(true);
  };

  const openEventDetail = (event) => {
    setSelectedEvent(event);
    setShowEventDetailModal(true);
  };

  const openEventShare = (event) => {
    setSelectedEvent(event);
    setEventShareMessage(`Aku share event ${getEventTitle(event)}. Mungkin cocok untuk group ini.`);
    setShowEventPickerModal(false);
    setShowEventShareModal(true);
  };

  const handleShareSelectedEvent = async (event) => {
    event.preventDefault();

    if (!selectedRoom || !isMember || !selectedEvent) return;

    const recommendedEventId = getEventId(selectedEvent);
    if (!recommendedEventId) {
      showToast("Event ID tidak ditemukan");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/${selectedRoom.id}/messages/share-event`, {
        sender_id: currentUser.id,
        recommended_event_id: Number(recommendedEventId),
        body: eventShareMessage.trim() || `Membagikan event ${getEventTitle(selectedEvent)}`,
      });

      setMessages((prev) => [...prev, response.data.data]);
      setEventShareMessage("");
      setSelectedEvent(null);
      setShowEventShareModal(false);
      showToast("Event berhasil dibagikan ke chat");
    } catch (error) {
      console.error("Error sharing event:", error);
      showToast(error.response?.data?.message || "Gagal membagikan event");
    }
  };

  const handleMediaFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (mediaForm.preview) URL.revokeObjectURL(mediaForm.preview);

    setMediaForm((prev) => ({
      ...prev,
      file,
      preview: URL.createObjectURL(file),
    }));
  };

  const closeMediaModal = () => {
    if (mediaForm.preview) URL.revokeObjectURL(mediaForm.preview);
    setMediaForm(initialMediaForm);
    setShowMediaModal(false);
  };

  const handleMediaSubmit = async (event) => {
    event.preventDefault();

    if (!selectedRoom || !isMember) return;
    if (!mediaForm.file) {
      showToast("Pilih foto atau video terlebih dahulu");
      return;
    }

    try {
      setMediaUploading(true);

      const messageType = mediaForm.file.type.startsWith("video") ? "video" : "image";
      const formData = new FormData();
      formData.append("sender_id", currentUser.id);
      formData.append("message_type", messageType);
      formData.append("body", mediaForm.body.trim());
      formData.append("media", mediaForm.file);

      const response = await axios.post(`${API_URL}/${selectedRoom.id}/messages/media`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessages((prev) => [...prev, response.data.data]);
      closeMediaModal();
      showToast("Media berhasil dikirim");
    } catch (error) {
      console.error("Error uploading media:", error);
      showToast(error.response?.data?.message || "Gagal upload media");
    } finally {
      setMediaUploading(false);
    }
  };

  const handleDeleteMessage = async (message) => {
    if (!message?.id) return;

    const confirmDelete = window.confirm("Hapus pesan ini?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_URL}/messages/${message.id}`, {
        data: { user_id: currentUser.id },
      });

      setMessages((prev) => prev.filter((item) => item.id !== message.id));
      setPinnedMessages((prev) => prev.filter((item) => item.id !== message.id));
      showToast("Pesan berhasil dihapus");
    } catch (error) {
      console.error("Error deleting message:", error);
      showToast(error.response?.data?.message || "Gagal menghapus pesan");
    }
  };

  const handlePinMessage = async (message) => {
    if (!message?.id) return;

    try {
      await axios.post(`${API_URL}/messages/${message.id}/pin`, {
        user_id: currentUser.id,
      });

      await fetchPinnedMessages(selectedRoom.id);
      showToast("Pesan berhasil dipin");
    } catch (error) {
      console.error("Error pinning message:", error);
      showToast(error.response?.data?.message || "Gagal pin pesan");
    }
  };

  const handleUnpinMessage = async (message) => {
    if (!message?.id) return;

    try {
      await axios.delete(`${API_URL}/messages/${message.id}/pin`, {
        data: { user_id: currentUser.id },
      });

      await fetchPinnedMessages(selectedRoom.id);
      showToast("Pesan berhasil dilepas dari pinned");
    } catch (error) {
      console.error("Error unpinning message:", error);
      showToast(error.response?.data?.message || "Gagal unpin pesan");
    }
  };

  const handleUpdateMemberRole = async (member, role) => {
    if (!selectedRoom) return;

    try {
      await axios.put(`${API_URL}/${selectedRoom.id}/members/${member.user_id}/role`, {
        requester_id: currentUser.id,
        role,
      });

      await fetchRoomMembers(selectedRoom.id);
      showToast("Role member berhasil diubah");
    } catch (error) {
      console.error("Error updating member role:", error);
      showToast(error.response?.data?.message || "Gagal mengubah role member");
    }
  };

  const handleKickMember = async (member) => {
    if (!selectedRoom) return;

    const memberName = member.User?.name || `User #${member.user_id}`;
    const confirmKick = window.confirm(`Kick ${memberName} dari group?`);
    if (!confirmKick) return;

    try {
      await axios.delete(`${API_URL}/${selectedRoom.id}/members/${member.user_id}`, {
        data: { requester_id: currentUser.id },
      });

      await Promise.all([
        fetchRoomMembers(selectedRoom.id),
        fetchMemberCount(selectedRoom.id),
      ]);
      showToast("Member berhasil dikeluarkan");
    } catch (error) {
      console.error("Error kicking member:", error);
      showToast(error.response?.data?.message || "Gagal kick member");
    }
  };

  const toggleCreateCategory = (categoryId) => {
    setCreateForm((prev) => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter((id) => id !== categoryId)
        : [...prev.category_ids, categoryId],
    }));
  };

  const toggleFilterCategory = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const resetFilters = () => {
    setSearchInput("");
    setSelectedCategories([]);
    setSortBy("newest");
  };

  useEffect(() => {
    document.title = "Community | Eventix";

    // Dipanggil secara async/deferred supaya tidak kena warning eslint:
    // react-hooks/set-state-in-effect
    const timer = setTimeout(() => {
      fetchCategories();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchCategories]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchChatRooms();
    }, 400);

    return () => clearTimeout(debounce);
  }, [fetchChatRooms]);

  useEffect(() => {
    socketService.connect();

    return () => {
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!selectedRoom) return;

    const handleNewMessage = (data) => {
      if (Number(data.chat_room_id) !== Number(selectedRoom.id)) return;

      setMessages((prev) => {
        if (prev.some((message) => String(message.id) === String(data.id))) return prev;
        return [...prev, data];
      });
    };

    const handleUserTyping = (data) => {
      if (!data?.username || data.username === currentUserName) return;
      setTypingUsers((prev) => {
        if (prev.includes(data.username)) return prev;
        return [...prev, data.username];
      });
    };

    const handleUserStopTyping = (data) => {
      if (!data?.username) return;
      setTypingUsers((prev) => prev.filter((name) => name !== data.username));
    };

    const handleSocketError = (error) => {
      showToast(error?.message || "Socket error");
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.onUserTyping(handleUserTyping);
    socketService.onUserStopTyping(handleUserStopTyping);
    socketService.onError(handleSocketError);

    return () => {
      socketService.removeListener("new_message", handleNewMessage);
      socketService.removeListener("user_typing", handleUserTyping);
      socketService.removeListener("user_stop_typing", handleUserStopTyping);
      socketService.removeListener("error", handleSocketError);
    };
  }, [selectedRoom, currentUserName, showToast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  useEffect(() => {
    return () => {
      clearTimeout(typingTimeoutRef.current);
      clearTimeout(toastTimeoutRef.current);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      if (mediaForm.preview) URL.revokeObjectURL(mediaForm.preview);
    };
  }, [imagePreview, mediaForm.preview]);

  const renderMessageContent = (message) => {
    if (message.message_type === "image") {
      return (
        <div className="community-media-message">
          {message.body && <p>{message.body}</p>}
          <img src={imageSrc(message.media_url)} alt="chat media" />
        </div>
      );
    }

    if (message.message_type === "video") {
      return (
        <div className="community-media-message">
          {message.body && <p>{message.body}</p>}
          <video src={imageSrc(message.media_url)} controls />
        </div>
      );
    }

    if (message.message_type === "recommendation") {
      const event = message.event || message.Event || message.RecommendedEvent;

      return (
        <div>
          <p>{message.body || "Membagikan event"}</p>
          <div className="community-event-card-mini">
            <strong>{event?.title || event?.name || `Event #${message.recommended_event_id}`}</strong>
            <span>{event?.location || "Detail event mengikuti data backend event."}</span>
            <button
              type="button"
              className="community-btn community-btn-primary community-btn-small"
              onClick={() => {
                if (event) openEventDetail(event);
                else showToast(`Buka detail Event ID ${message.recommended_event_id}`);
              }}
            >
              View Event
            </button>
          </div>
        </div>
      );
    }

    return <p>{message.body}</p>;
  };

  const renderMemberItem = (member, compact = false) => {
    const user = member.User || {};
    const userName = user.name || `User #${member.user_id}`;
    const isTargetOwner = member.role === "owner";
    const isSelf = Number(member.user_id) === Number(currentUser.id);
    const canOwnerChangeRole = currentMemberRole === "owner" && !isTargetOwner && !isSelf;
    const canKick = !isSelf && (
      (currentMemberRole === "owner" && !isTargetOwner) ||
      (currentMemberRole === "admin" && member.role === "member")
    );

    return (
      <div className="community-member-item" key={member.id || member.user_id}>
        <div className="community-avatar community-avatar-small">
          {user.avatar ? <img src={imageSrc(user.avatar)} alt={userName} /> : getInitials(userName)}
        </div>

        <div className="community-member-info">
          <strong>{userName}</strong>
          <span>{user.email || "No email"}</span>
        </div>

        <span className={`community-role community-role-${member.role}`}>{member.role}</span>

        {!compact && (canOwnerChangeRole || canKick) && (
          <div className="community-member-actions">
            {canOwnerChangeRole && (
              <select
                value={member.role}
                onChange={(event) => handleUpdateMemberRole(member, event.target.value)}
              >
                <option value="member">member</option>
                <option value="admin">admin</option>
              </select>
            )}
            {canKick && (
              <button
                type="button"
                className="community-icon-danger"
                onClick={() => handleKickMember(member)}
              >
                Kick
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Navbar />

      <main className="community-page">
        <section className="community-shell">
          <aside className="community-sidebar community-panel">
            <div className="community-sidebar-header">
              <div>
                <p className="community-eyebrow">Eventix</p>
                <h2>Community</h2>
              </div>
              <button
                type="button"
                className="community-btn community-btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                + Create
              </button>
            </div>

            <div className="community-search-box">
              <input
                type="text"
                placeholder="Search community..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>

            <div className="community-filter-block">
              <label>Sort</label>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="newest">Newest</option>
                <option value="trending">Trending</option>
                <option value="recently-active">Recently active</option>
                <option value="least-members">Least members</option>
              </select>
            </div>

            <div className="community-category-chips">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category.id}
                  className={selectedCategories.includes(category.id) ? "active" : ""}
                  onClick={() => toggleFilterCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {(searchInput || selectedCategories.length > 0 || sortBy !== "newest") && (
              <button type="button" className="community-reset-filter" onClick={resetFilters}>
                Reset filter
              </button>
            )}

            <div className="community-room-list-title">
              <span>Groups</span>
              <small>{chatRooms.length}</small>
            </div>

            <div className="community-room-list">
              {loadingRooms ? (
                <div className="community-empty-small">Loading groups...</div>
              ) : chatRooms.length === 0 ? (
                <div className="community-empty-small">Tidak ada community yang cocok.</div>
              ) : (
                chatRooms.map((room) => {
                  const unread = unreadCounts[room.id] || 0;
                  const categoriesText = roomCategories(room).map((item) => item.name).join(", ");

                  return (
                    <button
                      type="button"
                      key={room.id}
                      className={`community-room-card ${selectedRoom?.id === room.id ? "active" : ""}`}
                      onClick={() => handleSelectRoom(room)}
                    >
                      <div className="community-room-avatar">
                        <img src={imageSrc(room.profile_image_url)} alt={room.name} />
                      </div>
                      <div className="community-room-card-content">
                        <strong>{room.name}</strong>
                        <span>{room.description || "No description"}</span>
                        <small>{categoriesText || "General"}</small>
                      </div>
                      {unread > 0 && <b className="community-unread-badge">{unread}</b>}
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          <section className="community-chat community-panel">
            {!selectedRoom ? (
              <div className="community-empty-state">
                <div className="community-empty-icon">💬</div>
                <h2>Pilih community</h2>
                <p>Pilih salah satu group di sidebar untuk melihat detail, member, dan chat.</p>
              </div>
            ) : (
              <>
                <div className="community-chat-header">
                  <div className="community-chat-title">
                    <div className="community-avatar">
                      <img src={imageSrc(selectedRoom.profile_image_url)} alt={selectedRoom.name} />
                    </div>
                    <div>
                      <h2>{selectedRoom.name}</h2>
                      <p>{memberCount || selectedRoom.ChatRoomMembers?.length || 0} members · {isMember ? `You are ${currentMemberRole}` : "Not joined yet"}</p>
                    </div>
                  </div>

                  <div className="community-chat-actions">
                    <button type="button" className="community-btn community-btn-outline" onClick={() => setShowDetailModal(true)}>
                      Detail
                    </button>
                  </div>
                </div>

                {loadingRoomDetail ? (
                  <div className="community-empty-state compact">Loading room detail...</div>
                ) : isMember ? (
                  <>
                    <div className="community-message-list">
                      {messages.length === 0 ? (
                        <div className="community-empty-chat">
                          <h3>Belum ada message</h3>
                          <p>Jadilah orang pertama yang memulai diskusi.</p>
                        </div>
                      ) : (
                        messages.map((message, index) => {
                          const isMe = Number(message.sender_id) === Number(currentUser.id);
                          const senderName = isMe ? "You" : message.Sender?.name || message.username || `User #${message.sender_id}`;
                          const canDelete = isMe || canManageGroup;

                          return (
                            <div className={`community-message ${isMe ? "me" : ""}`} key={message.id || index}>
                              <div className="community-avatar community-avatar-small">
                                {getInitials(senderName)}
                              </div>
                              <div className="community-message-bubble">
                                <div className="community-message-top">
                                  <strong>{senderName}</strong>
                                  <span>{formatTime(message.created_at)}</span>
                                </div>
                                <div className="community-message-content">
                                  {renderMessageContent(message)}
                                </div>
                                {message.id && (canDelete || canManageGroup) && (
                                  <div className="community-message-actions">
                                    {canManageGroup && (
                                      <button type="button" onClick={() => handlePinMessage(message)}>Pin</button>
                                    )}
                                    {canDelete && (
                                      <button type="button" onClick={() => handleDeleteMessage(message)}>Delete</button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}

                      {typingUsers.length > 0 && (
                        <div className="community-typing">
                          {typingUsers.join(", ")} sedang mengetik...
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    <div className="community-chat-input">
                      <div className="community-plus-wrapper">
                        <button type="button" className="community-btn community-btn-outline community-plus-button" onClick={openAttachmentMenu}>
                          +
                        </button>

                        {showAttachmentMenu && (
                          <div className="community-attachment-menu">
                            <button type="button" onClick={openEventPicker}>
                              <strong>Share Event</strong>
                              <span>Pilih event dari daftar lalu bagikan ke chat</span>
                            </button>
                            <button type="button" onClick={openMediaPicker}>
                              <strong>Upload Media</strong>
                              <span>Kirim foto atau video dari laptop</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <input
                        type="text"
                        placeholder="Write a message..."
                        value={messageInput}
                        onChange={handleMessageInputChange}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") handleSendMessage();
                        }}
                      />
                      <button type="button" className="community-btn community-btn-primary" onClick={handleSendMessage}>
                        Send
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="community-join-view">
                    <div className="community-join-hero">
                      <img src={imageSrc(selectedRoom.profile_image_url)} alt={selectedRoom.name} />
                      <h2>{selectedRoom.name}</h2>
                      <p>{selectedRoom.description || "Community ini belum memiliki deskripsi."}</p>
                      <div className="community-join-meta">
                        <span>{memberCount || 0} members</span>
                        {selectedRoomCategories.map((category) => (
                          <span key={category.id}>{category.name}</span>
                        ))}
                      </div>
                      <button type="button" className="community-btn community-btn-primary" onClick={handleJoinRoom}>
                        Join Community
                      </button>
                    </div>

                    <div className="community-locked-preview">
                      <h3>Preview discussion</h3>
                      <div>Member sedang berdiskusi tentang event, ticket, venue, dan pengalaman mereka.</div>
                      <div>Join community untuk membaca full chat dan ikut mengirim message.</div>
                      <div>Event tidak selalu wajib di-highlight; member dapat share event jika relevan.</div>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          <aside className="community-detail community-panel">
            {!selectedRoom ? (
              <div className="community-empty-small center">Detail group akan muncul di sini.</div>
            ) : (
              <>
                <div className="community-detail-cover">
                  <img src={imageSrc(selectedRoom.profile_image_url)} alt={selectedRoom.name} />
                </div>

                <div className="community-detail-title">
                  <h2>{selectedRoom.name}</h2>
                  <p>{selectedRoom.description || "Community ini belum memiliki bio."}</p>
                </div>

                <div className="community-detail-actions">
                  {isMember ? (
                    <button type="button" className="community-btn community-btn-danger" onClick={handleLeaveRoom}>
                      Leave
                    </button>
                  ) : (
                    <button type="button" className="community-btn community-btn-primary" onClick={handleJoinRoom}>
                      Join
                    </button>
                  )}
                  <button type="button" className="community-btn community-btn-outline" onClick={() => setShowMembersModal(true)}>
                    Members
                  </button>
                </div>

                <div className="community-detail-section">
                  <h3>Info</h3>
                  <div className="community-info-grid">
                    <span>Members</span><strong>{memberCount || 0}</strong>
                    <span>Your Role</span><strong>{isMember ? currentMemberRole : "Guest"}</strong>
                    <span>Creator ID</span><strong>{selectedRoom.creator_id}</strong>
                  </div>
                </div>

                <div className="community-detail-section">
                  <h3>Categories</h3>
                  <div className="community-category-chips static">
                    {selectedRoomCategories.length > 0 ? (
                      selectedRoomCategories.map((category) => <span key={category.id}>{category.name}</span>)
                    ) : (
                      <span>General</span>
                    )}
                  </div>
                </div>

                <div className="community-detail-section">
                  <div className="community-section-title-row">
                    <h3>Members</h3>
                    {members.length > 0 && (
                      <button type="button" className="community-link-button compact" onClick={() => setShowMembersModal(true)}>
                        View all
                      </button>
                    )}
                  </div>

                  {members.length === 0 ? (
                    <p className="community-muted">Belum ada data member.</p>
                  ) : (
                    <div className="community-detail-members-scroll">
                      {members.map((member) => renderMemberItem(member, true))}
                    </div>
                  )}
                </div>

                <div className="community-detail-section">
                  <h3>Pinned Messages</h3>
                  {isMember && pinnedMessages.length > 0 ? (
                    pinnedMessages.map((message) => (
                      <div className="community-pinned-card" key={message.id}>
                        <strong>{message.Sender?.name || `User #${message.sender_id}`}</strong>
                        <p>{message.body || "Pinned message"}</p>
                        {canManageGroup && (
                          <button type="button" onClick={() => handleUnpinMessage(message)}>Unpin</button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="community-muted">Tidak ada pinned message.</p>
                  )}
                </div>

                <div className="community-detail-section">
                  <h3>Shared Events</h3>
                  {sharedEvents.length > 0 ? (
                    sharedEvents.slice(-3).map((message) => (
                      <div className="community-shared-event" key={message.id || `${message.recommended_event_id}-${message.created_at}`}>
                        Event #{message.recommended_event_id}
                      </div>
                    ))
                  ) : (
                    <p className="community-muted">Belum ada event yang dibagikan.</p>
                  )}
                </div>
              </>
            )}
          </aside>
        </section>
      </main>

      <Footer />

      {showCreateModal && (
        <div className="community-modal-overlay">
          <form className="community-modal" onSubmit={handleCreateRoom}>
            <div className="community-modal-header">
              <h2>Create Community</h2>
              <button type="button" onClick={() => setShowCreateModal(false)}>×</button>
            </div>

            <label>Community Name</label>
            <input
              type="text"
              value={createForm.name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Contoh: Festival Squad Indonesia"
            />

            <label>Description</label>
            <textarea
              rows="4"
              value={createForm.description}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Jelaskan tujuan community..."
            />

            <label>Group Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setCreateForm((prev) => ({ ...prev, profile_image_file: file || null }));
                if (imagePreview) URL.revokeObjectURL(imagePreview);
                setImagePreview(file ? URL.createObjectURL(file) : null);
              }}
            />
            {imagePreview && <img className="community-image-preview" src={imagePreview} alt="Preview" />}

            <label>Categories</label>
            <div className="community-category-chips modal-chips">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category.id}
                  className={createForm.category_ids.includes(category.id) ? "active" : ""}
                  onClick={() => toggleCreateCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>

            <div className="community-modal-actions">
              <button type="button" className="community-btn community-btn-outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button type="submit" className="community-btn community-btn-primary" disabled={creatingRoom}>
                {creatingRoom ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showEventPickerModal && selectedRoom && (
        <div className="community-modal-overlay">
          <div className="community-modal community-modal-wide">
            <div className="community-modal-header">
              <h2>Pilih Event untuk Dibagikan</h2>
              <button type="button" onClick={() => setShowEventPickerModal(false)}>×</button>
            </div>

            <p className="community-muted">
              Pilih salah satu event, lihat detailnya bila perlu, lalu tekan Bagikan untuk menambahkan pesan sebelum dikirim ke chat.
            </p>

            {loadingEvents ? (
              <div className="community-empty-small">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="community-empty-small">
                Event belum tersedia atau endpoint
              </div>
            ) : (
              <div className="community-event-grid">
                {events.map((event) => (
                  <div className="community-event-card" key={getEventId(event) || getEventTitle(event)}>
                    <img src={getEventImage(event)} alt={getEventTitle(event)} />
                    <div className="community-event-card-body">
                      <h3>{getEventTitle(event)}</h3>
                      <p>{formatEventDate(getEventDate(event))}</p>
                      <p>{getEventLocation(event)}</p>
                      <strong>{getEventPrice(event)}</strong>
                    </div>
                    <div className="community-event-card-actions">
                      <button type="button" className="community-btn community-btn-outline" onClick={() => openEventDetail(event)}>
                        Detail
                      </button>
                      <button type="button" className="community-btn community-btn-primary" onClick={() => openEventShare(event)}>
                        Bagikan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showEventDetailModal && selectedEvent && (
        <div className="community-modal-overlay">
          <div className="community-modal">
            <div className="community-modal-header">
              <h2>Detail Event</h2>
              <button type="button" onClick={() => setShowEventDetailModal(false)}>×</button>
            </div>

            <div className="community-event-detail">
              <img src={getEventImage(selectedEvent)} alt={getEventTitle(selectedEvent)} />
              <h3>{getEventTitle(selectedEvent)}</h3>
              <p><b>Tanggal:</b> {formatEventDate(getEventDate(selectedEvent))}</p>
              <p><b>Lokasi:</b> {getEventLocation(selectedEvent)}</p>
              <p><b>Harga:</b> {getEventPrice(selectedEvent)}</p>
              <p>{selectedEvent.description || selectedEvent.detail || "Deskripsi event belum tersedia."}</p>
            </div>

            <div className="community-modal-actions">
              <button type="button" className="community-btn community-btn-outline" onClick={() => setShowEventDetailModal(false)}>
                Tutup
              </button>
              <button type="button" className="community-btn community-btn-primary" onClick={() => { setShowEventDetailModal(false); openEventShare(selectedEvent); }}>
                Bagikan Event
              </button>
            </div>
          </div>
        </div>
      )}

      {showEventShareModal && selectedEvent && (
        <div className="community-modal-overlay">
          <form className="community-modal" onSubmit={handleShareSelectedEvent}>
            <div className="community-modal-header">
              <h2>Bagikan Event</h2>
              <button type="button" onClick={() => setShowEventShareModal(false)}>×</button>
            </div>

            <div className="community-selected-event-box">
              <img src={getEventImage(selectedEvent)} alt={getEventTitle(selectedEvent)} />
              <div>
                <h3>{getEventTitle(selectedEvent)}</h3>
                <p>{formatEventDate(getEventDate(selectedEvent))} · {getEventLocation(selectedEvent)}</p>
                <strong>{getEventPrice(selectedEvent)}</strong>
              </div>
            </div>

            <label>Pesan tambahan</label>
            <textarea
              rows="4"
              value={eventShareMessage}
              onChange={(event) => setEventShareMessage(event.target.value)}
              placeholder="Tulis pesan sebelum membagikan event..."
            />

            <div className="community-modal-actions">
              <button type="button" className="community-btn community-btn-outline" onClick={() => setShowEventShareModal(false)}>
                Cancel
              </button>
              <button type="submit" className="community-btn community-btn-primary">
                Kirim ke Chat
              </button>
            </div>
          </form>
        </div>
      )}

      {showMediaModal && selectedRoom && (
        <div className="community-modal-overlay">
          <form className="community-modal" onSubmit={handleMediaSubmit}>
            <div className="community-modal-header">
              <h2>Kirim Media</h2>
              <button type="button" onClick={closeMediaModal}>×</button>
            </div>

            <label>Pilih foto / video</label>
            <input type="file" accept="image/*,video/*" onChange={handleMediaFileChange} />

            {mediaForm.file && (
              <div className="community-media-preview">
                <strong>{mediaForm.file.name}</strong>
                {mediaForm.file.type.startsWith("video") ? (
                  <video src={mediaForm.preview} controls />
                ) : (
                  <img src={mediaForm.preview} alt="preview media" />
                )}
              </div>
            )}

            <label>Pesan tambahan</label>
            <textarea
              rows="3"
              value={mediaForm.body}
              onChange={(event) => setMediaForm((prev) => ({ ...prev, body: event.target.value }))}
              placeholder="Tulis caption untuk media ini..."
            />

            <div className="community-modal-actions">
              <button type="button" className="community-btn community-btn-outline" onClick={closeMediaModal}>
                Cancel
              </button>
              <button type="submit" className="community-btn community-btn-primary" disabled={mediaUploading}>
                {mediaUploading ? "Uploading..." : "Kirim Media"}
              </button>
            </div>
          </form>
        </div>
      )}

      {showDetailModal && selectedRoom && (
        <div className="community-modal-overlay">
          <div className="community-modal">
            <div className="community-modal-header">
              <h2>Group Detail</h2>
              <button type="button" onClick={() => setShowDetailModal(false)}>×</button>
            </div>

            <div className="community-detail-modal-head">
              <img src={imageSrc(selectedRoom.profile_image_url)} alt={selectedRoom.name} />
              <div>
                <h3>{selectedRoom.name}</h3>
                <p>{selectedRoom.description || "No description"}</p>
              </div>
            </div>

            <div className="community-info-grid modal-grid">
              <span>Members</span><strong>{memberCount}</strong>
              <span>Your Role</span><strong>{isMember ? currentMemberRole : "Guest"}</strong>
              <span>Creator ID</span><strong>{selectedRoom.creator_id}</strong>
              <span>Created At</span><strong>{new Date(selectedRoom.created_at).toLocaleDateString("id-ID")}</strong>
            </div>

            <button type="button" className="community-btn community-btn-primary full" onClick={() => { setShowDetailModal(false); setShowMembersModal(true); }}>
              View Members
            </button>
          </div>
        </div>
      )}

      {showMembersModal && selectedRoom && (
        <div className="community-modal-overlay">
          <div className="community-modal community-modal-wide">
            <div className="community-modal-header">
              <h2>Members - {selectedRoom.name}</h2>
              <button type="button" onClick={() => setShowMembersModal(false)}>×</button>
            </div>

            <div className="community-members-modal-list">
              {members.length === 0 ? (
                <p className="community-muted">Belum ada data member.</p>
              ) : (
                members.map((member) => renderMemberItem(member))
              )}
            </div>
          </div>
        </div>
      )}

      {toast && <div className="community-toast">{toast}</div>}

      <style>{communityStyles}</style>
    </>
  );
}

const communityStyles = `
.community-page {
  min-height: 80vh;
  background: #f4f6fb;
  padding: 28px 20px;
}

.community-shell {
  max-width: 1440px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr) 340px;
  gap: 20px;

  /* supaya sidebar, chat, dan detail punya batas tinggi */
  height: calc(100vh - 170px);
  min-height: 680px;
}

.community-panel {
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 12px 35px rgba(15, 23, 42, 0.08);
  overflow: hidden;
}

.community-sidebar,
.community-detail {
  padding: 22px;

  /* panel tidak memanjang terus, bagian dalam yang scroll */
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.community-sidebar {
  display: flex;
  flex-direction: column;
}

.community-detail {
  overflow-y: auto;
}

.community-sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.community-eyebrow {
  font-size: 12px;
  color: #7c3aed;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.community-sidebar-header h2,
.community-chat-title h2,
.community-detail-title h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

.community-search-box input,
.community-filter-block select,
.community-modal input,
.community-modal textarea,
.community-member-actions select {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 14px;
  padding: 12px 14px;
  outline: none;
  font-size: 14px;
  background: #fff;
}

.community-search-box input:focus,
.community-filter-block select:focus,
.community-modal input:focus,
.community-modal textarea:focus {
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
}

.community-filter-block {
  margin: 14px 0;
}

.community-filter-block label,
.community-modal label {
  display: block;
  color: #374151;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 7px;
}

.community-category-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.community-category-chips button,
.community-category-chips span {
  border: 0;
  border-radius: 999px;
  padding: 8px 12px;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.community-category-chips button.active,
.community-category-chips span,
.community-category-chips.static span {
  background: #ede9fe;
  color: #6d28d9;
}

.community-reset-filter,
.community-link-button {
  border: 0;
  background: transparent;
  color: #6d28d9;
  font-weight: 700;
  cursor: pointer;
  font-size: 13px;
  margin-bottom: 12px;
}

.community-room-list-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 18px 0 12px;
  color: #6b7280;
  text-transform: uppercase;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .5px;
}

.community-room-list {
  display: flex;
  flex-direction: column;
  gap: 10px;

  /* SCROLL UNTUK LIST GROUP */
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 6px;
}

.community-room-list::-webkit-scrollbar,
.community-message-list::-webkit-scrollbar,
.community-detail-members-scroll::-webkit-scrollbar,
.community-members-modal-list::-webkit-scrollbar {
  width: 7px;
}

.community-room-list::-webkit-scrollbar-thumb,
.community-message-list::-webkit-scrollbar-thumb,
.community-detail-members-scroll::-webkit-scrollbar-thumb,
.community-members-modal-list::-webkit-scrollbar-thumb {
  background: #c4b5fd;
  border-radius: 999px;
}

.community-room-list::-webkit-scrollbar-track,
.community-message-list::-webkit-scrollbar-track,
.community-detail-members-scroll::-webkit-scrollbar-track,
.community-members-modal-list::-webkit-scrollbar-track {
  background: transparent;
}

.community-room-card {
  width: 100%;
  border: 1px solid #e5e7eb;
  background: #fff;
  padding: 12px;
  border-radius: 18px;
  display: flex;
  gap: 12px;
  align-items: center;
  cursor: pointer;
  text-align: left;
  transition: .2s;
}

.community-room-card:hover,
.community-room-card.active {
  background: #f5f3ff;
  border-color: #c4b5fd;
}

.community-room-avatar,
.community-avatar {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: linear-gradient(135deg, #7c3aed, #ec4899);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 800;
  overflow: hidden;
  flex-shrink: 0;
}

.community-avatar-small {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  font-size: 12px;
}

.community-room-avatar img,
.community-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.community-room-card-content {
  min-width: 0;
  flex: 1;
}

.community-room-card-content strong,
.community-room-card-content span,
.community-room-card-content small {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.community-room-card-content strong {
  color: #111827;
  font-size: 14px;
  margin-bottom: 3px;
}

.community-room-card-content span,
.community-room-card-content small {
  color: #6b7280;
  font-size: 12px;
}

.community-unread-badge {
  min-width: 24px;
  height: 24px;
  border-radius: 999px;
  background: #ef4444;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}

.community-chat {
  display: flex;
  flex-direction: column;

  /* batas tinggi panel chat */
  height: 100%;
  min-height: 0;
}

.community-chat-header {
  height: 88px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 22px;
  border-bottom: 1px solid #e5e7eb;
}

.community-chat-title {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.community-chat-title p,
.community-detail-title p {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.5;
}

.community-chat-actions,
.community-detail-actions,
.community-modal-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.community-btn {
  border: 0;
  border-radius: 14px;
  padding: 11px 15px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: .2s;
}

.community-btn:disabled {
  opacity: .6;
  cursor: not-allowed;
}

.community-btn-primary {
  background: #6d28d9;
  color: white;
}

.community-btn-primary:hover {
  background: #5b21b6;
}

.community-btn-secondary {
  background: #ede9fe;
  color: #6d28d9;
}

.community-btn-outline {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.community-btn-danger {
  background: #fee2e2;
  color: #b91c1c;
}

.community-btn-small {
  padding: 8px 11px;
  font-size: 12px;
}

.community-btn.full {
  width: 100%;
  margin-top: 16px;
}

.community-message-list {
  flex: 1;
  min-height: 0;
  background: #fafafa;
  padding: 24px;

  /* SCROLL UNTUK ISI CHAT */
  overflow-y: auto;
}

.community-message {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 18px;
  max-width: 78%;
}

.community-message.me {
  margin-left: auto;
  flex-direction: row-reverse;
}

.community-message-bubble {
  background: white;
  padding: 13px 15px;
  border-radius: 18px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
  min-width: 160px;
}

.community-message.me .community-message-bubble {
  background: #6d28d9;
  color: white;
}

.community-message-top {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  margin-bottom: 6px;
}

.community-message-top strong {
  font-size: 13px;
  color: #4b5563;
}

.community-message.me .community-message-top strong,
.community-message.me .community-message-top span {
  color: #ede9fe;
}

.community-message-top span {
  font-size: 11px;
  color: #9ca3af;
}

.community-message-content p {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}

.community-message-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.community-message-actions button,
.community-pinned-card button {
  border: 0;
  background: transparent;
  color: inherit;
  opacity: .8;
  font-size: 11px;
  cursor: pointer;
  text-decoration: underline;
}

.community-media-message img,
.community-media-message video {
  display: block;
  max-width: 260px;
  border-radius: 14px;
  margin-top: 8px;
}

.community-event-card-mini {
  margin-top: 10px;
  border: 1px solid #ddd6fe;
  background: #f5f3ff;
  color: #374151;
  border-radius: 16px;
  padding: 13px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.community-event-card-mini strong {
  color: #6d28d9;
}

.community-event-card-mini span {
  color: #6b7280;
  font-size: 13px;
}

.community-chat-input {
  height: 84px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e5e7eb;
}

.community-chat-input input {
  flex: 1;
  border: 1px solid #d1d5db;
  border-radius: 999px;
  padding: 13px 16px;
  outline: none;
}

.community-typing {
  font-size: 13px;
  color: #6b7280;
  font-style: italic;
}

.community-empty-state,
.community-join-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  text-align: center;
}

.community-empty-state.compact {
  min-height: 300px;
}

.community-empty-icon {
  font-size: 50px;
  margin-bottom: 14px;
}

.community-empty-state h2,
.community-join-hero h2 {
  margin-bottom: 8px;
  color: #111827;
}

.community-empty-state p,
.community-join-hero p,
.community-empty-chat p,
.community-muted {
  color: #6b7280;
  font-size: 13px;
  line-height: 1.6;
}

.community-empty-small {
  color: #6b7280;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  border-radius: 16px;
  padding: 18px;
  text-align: center;
  font-size: 13px;
}

.community-empty-small.center {
  margin-top: 20px;
}

.community-empty-chat {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
}

.community-join-hero {
  max-width: 620px;
  padding: 32px;
  border-radius: 28px;
  background: linear-gradient(135deg, #312e81, #6d28d9, #db2777);
  color: white;
}

.community-join-hero img {
  width: 96px;
  height: 96px;
  border-radius: 28px;
  object-fit: cover;
  border: 4px solid rgba(255,255,255,.55);
  margin-bottom: 16px;
}

.community-join-hero h2,
.community-join-hero p {
  color: white;
}

.community-join-meta {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 18px 0;
}

.community-join-meta span {
  background: rgba(255,255,255,.18);
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 700;
}

.community-locked-preview {
  max-width: 620px;
  width: 100%;
  margin-top: 18px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  padding: 18px;
  text-align: left;
}

.community-locked-preview h3 {
  margin-bottom: 12px;
}

.community-locked-preview div:not(:first-child) {
  background: white;
  border-radius: 14px;
  padding: 12px;
  margin-top: 10px;
  color: #6b7280;
  filter: blur(1.4px);
}

.community-detail-cover {
  height: 130px;
  border-radius: 22px;
  overflow: hidden;
  background: #ede9fe;
}

.community-detail-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.community-detail-title {
  margin: 18px 0;
}

.community-detail-actions {
  margin-bottom: 20px;
}

.community-detail-actions .community-btn {
  flex: 1;
}

.community-detail-section {
  border-top: 1px solid #e5e7eb;
  padding-top: 18px;
  margin-top: 18px;
}

.community-detail-section h3 {
  font-size: 15px;
  margin-bottom: 12px;
  color: #111827;
}

.community-section-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.community-section-title-row h3 {
  margin-bottom: 0;
}

.community-link-button.compact {
  margin-bottom: 0;
}

.community-detail-members-scroll {
  /* SCROLL UNTUK LIST MEMBER DI DETAIL PANEL */
  max-height: 260px;
  overflow-y: auto;
  padding-right: 6px;
}

.community-info-grid {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px 12px;
  font-size: 13px;
}

.community-info-grid span {
  color: #6b7280;
}

.community-info-grid strong {
  color: #111827;
}

.community-member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 13px;
}

.community-member-info {
  flex: 1;
  min-width: 0;
}

.community-member-info strong,
.community-member-info span {
  display: block;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.community-member-info strong {
  font-size: 14px;
  color: #111827;
}

.community-member-info span {
  font-size: 12px;
  color: #6b7280;
}

.community-role {
  border-radius: 999px;
  padding: 6px 9px;
  font-size: 11px;
  font-weight: 800;
}

.community-role-owner {
  background: #fef3c7;
  color: #92400e;
}

.community-role-admin {
  background: #dbeafe;
  color: #1d4ed8;
}

.community-role-member {
  background: #f3f4f6;
  color: #4b5563;
}

.community-member-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.community-member-actions select {
  padding: 7px 9px;
  border-radius: 10px;
  font-size: 12px;
}

.community-icon-danger {
  border: 0;
  background: #fee2e2;
  color: #b91c1c;
  border-radius: 10px;
  padding: 7px 9px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.community-pinned-card,
.community-shared-event {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #713f12;
  border-radius: 16px;
  padding: 12px;
  margin-bottom: 10px;
  font-size: 13px;
}

.community-pinned-card p {
  margin: 5px 0;
  line-height: 1.5;
}

.community-shared-event {
  background: #f5f3ff;
  border-color: #ddd6fe;
  color: #6d28d9;
  font-weight: 700;
}

.community-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, .58);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.community-modal {
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  background: white;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, .28);
}

.community-modal-wide {
  max-width: 760px;
}

.community-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 18px;
}

.community-modal-header h2 {
  font-size: 20px;
  margin: 0;
}

.community-modal-header button {
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 0;
  background: #f3f4f6;
  font-size: 22px;
  cursor: pointer;
}

.community-modal input,
.community-modal textarea {
  margin-bottom: 14px;
}

.community-modal-actions {
  justify-content: flex-end;
  margin-top: 18px;
}

.community-image-preview {
  display: block;
  width: 110px;
  height: 110px;
  border-radius: 24px;
  object-fit: cover;
  margin-bottom: 14px;
}

.modal-chips {
  margin-top: 4px;
}

.community-detail-modal-head {
  display: flex;
  gap: 14px;
  align-items: center;
  margin-bottom: 18px;
}

.community-detail-modal-head img {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  object-fit: cover;
}

.community-detail-modal-head h3 {
  margin: 0 0 5px;
}

.community-detail-modal-head p {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.5;
}

.modal-grid {
  background: #f9fafb;
  border-radius: 16px;
  padding: 14px;
}

.community-members-modal-list {
  display: flex;
  flex-direction: column;
  gap: 8px;

  /* kalau member di modal banyak, modal tidak jadi terlalu panjang */
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 6px;
}

.community-toast {
  position: fixed;
  right: 22px;
  bottom: 22px;
  background: #111827;
  color: white;
  border-radius: 16px;
  padding: 13px 18px;
  font-size: 14px;
  z-index: 10000;
  box-shadow: 0 12px 30px rgba(15, 23, 42, .2);
}


.community-plus-wrapper {
  position: relative;
  flex-shrink: 0;
}

.community-plus-button {
  width: 44px;
  height: 44px;
  border-radius: 999px;
  padding: 0;
  font-size: 22px;
  line-height: 1;
}

.community-attachment-menu {
  position: absolute;
  left: 0;
  bottom: 56px;
  width: 250px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, .18);
  padding: 8px;
  z-index: 30;
}

.community-attachment-menu button {
  width: 100%;
  border: 0;
  background: transparent;
  border-radius: 14px;
  padding: 12px;
  text-align: left;
  cursor: pointer;
}

.community-attachment-menu button:hover {
  background: #f5f3ff;
}

.community-attachment-menu strong,
.community-attachment-menu span {
  display: block;
}

.community-attachment-menu strong {
  color: #111827;
  font-size: 13px;
  margin-bottom: 3px;
}

.community-attachment-menu span {
  color: #6b7280;
  font-size: 12px;
  line-height: 1.4;
}

.community-event-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.community-event-card {
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  overflow: hidden;
  background: #fff;
  display: flex;
  flex-direction: column;
}

.community-event-card img {
  width: 100%;
  height: 140px;
  object-fit: cover;
  background: #ede9fe;
}

.community-event-card-body {
  padding: 14px;
  flex: 1;
}

.community-event-card-body h3 {
  margin: 0 0 8px;
  color: #111827;
  font-size: 16px;
}

.community-event-card-body p {
  margin: 4px 0;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.45;
}

.community-event-card-body strong {
  display: block;
  margin-top: 8px;
  color: #6d28d9;
  font-size: 14px;
}

.community-event-card-actions {
  display: flex;
  gap: 8px;
  padding: 0 14px 14px;
}

.community-event-card-actions .community-btn {
  flex: 1;
}

.community-event-detail img {
  width: 100%;
  height: 220px;
  object-fit: cover;
  border-radius: 18px;
  margin-bottom: 16px;
  background: #ede9fe;
}

.community-event-detail h3 {
  margin: 0 0 10px;
  color: #111827;
}

.community-event-detail p {
  color: #4b5563;
  font-size: 14px;
  line-height: 1.6;
  margin: 6px 0;
}

.community-selected-event-box {
  display: flex;
  gap: 14px;
  padding: 14px;
  border: 1px solid #ddd6fe;
  background: #f5f3ff;
  border-radius: 18px;
  margin-bottom: 16px;
}

.community-selected-event-box img {
  width: 86px;
  height: 86px;
  object-fit: cover;
  border-radius: 16px;
  background: #ede9fe;
  flex-shrink: 0;
}

.community-selected-event-box h3 {
  margin: 0 0 6px;
  font-size: 16px;
  color: #111827;
}

.community-selected-event-box p {
  margin: 0 0 6px;
  color: #6b7280;
  font-size: 13px;
}

.community-selected-event-box strong {
  color: #6d28d9;
  font-size: 14px;
}

.community-media-preview {
  margin-bottom: 14px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  background: #f9fafb;
}

.community-media-preview strong {
  display: block;
  color: #374151;
  font-size: 13px;
  margin-bottom: 10px;
  word-break: break-all;
}

.community-media-preview img,
.community-media-preview video {
  display: block;
  max-width: 100%;
  max-height: 260px;
  border-radius: 14px;
  object-fit: contain;
  background: #111827;
}

@media (max-width: 1200px) {
  .community-shell {
    grid-template-columns: 300px 1fr;
    height: auto;
  }

  .community-sidebar,
  .community-chat {
    height: 720px;
  }

  .community-detail {
    grid-column: 1 / -1;
    max-height: 620px;
  }
}

@media (max-width: 900px) {
  .community-shell {
    grid-template-columns: 1fr;
    height: auto;
  }

  .community-sidebar,
  .community-chat {
    height: 680px;
  }

  .community-detail {
    max-height: 680px;
  }

  .community-chat-header {
    height: auto;
    align-items: flex-start;
    flex-direction: column;
  }

  .community-chat-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .community-chat-actions .community-btn {
    flex: 1;
  }

  .community-message {
    max-width: 94%;
  }

  .community-event-grid {
    grid-template-columns: 1fr;
  }

  .community-selected-event-box {
    flex-direction: column;
  }

  .community-selected-event-box img {
    width: 100%;
    height: 180px;
  }
}
`;

export default Community;
