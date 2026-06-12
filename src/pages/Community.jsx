import  { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axios from "axios";
import socketService from "../services/socketService";

// Taruh URL di luar komponen agar tidak memicu re-render
const API_URL = "http://localhost:5000/api/community";

function Community() {
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // ========== SEARCH & FILTER STATE ==========
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortBy, setSortBy] = useState("newest");

    // Mock categories (idealnya ambil dari API)
  const CATEGORIES = [
    { id: 1, name: "Technology" },
    { id: 2, name: "Sports" },
    { id: 3, name: "Music" },
    { id: 4, name: "Art" },
  ];

  const [currentUser] = useState({
    id: 1, // TODO: Get from auth/context
    username: "User1", // TODO: Get from auth/context
  });
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ==========================================
  // 1. FETCH CHAT ROOMS & CONNECT SOCKET (ESLint Fixed)
  // ==========================================
  
  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        setLoading(true);
        
        // Susun query params secara dinamis untuk dikirim ke Backend
        const params = {
          page: 1,
          limit: 20,
          search: searchInput,
          sort: sortBy,
          // Kirim array kategori sebagai string yang dipisah koma (misal: "1,3")
          categories: selectedCategories.join(",") 
        };

        const response = await axios.get(API_URL, { params });
        setChatRooms(response.data.data);
      } catch (error) {
        console.error("Error fetching chat rooms:", error);
      } finally {
        setLoading(false);
      }
    };

    // Mekanisme DEBOUNCE: Beri jeda 500ms setelah user selesai mengetik baru tembak API
    const delayDebounceFn = setTimeout(() => {
      fetchChatRooms();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchInput, selectedCategories, sortBy]); // Triggers otomatis saat filter berubah!

  // Tambahkan useEffect terpisah khusus untuk connect socket sekali saja di awal
  useEffect(() => {
    socketService.connect();
    return () => {
      socketService.disconnect();
    };
  }, []);

  

  // ==========================================
  // 2. LISTEN TO SOCKET EVENTS (Phantom Room Fixed)
  // ==========================================
  useEffect(() => {
    // Jangan pasang pendengar jika user belum memilih ruangan
    if (!selectedRoom) return;

    const handleNewMessage = (data) => {
      console.log("📬 New message:", data);
      // Validasi: Pastikan pesan yang masuk memang untuk ruangan ini
      if (data.chat_room_id === selectedRoom.id) {
        setMessages((prev) => [...prev, data]);
      }
    };

    const handleUserTyping = (data) => {
      if (data.chat_room_id === selectedRoom.id) {
        setTypingUsers((prev) => {
          if (!prev.includes(data.username)) return [...prev, data.username];
          return prev;
        });
      }
    };

    const handleUserStopTyping = (data) => {
      if (data.chat_room_id === selectedRoom.id) {
        setTypingUsers((prev) => prev.filter((user) => user !== data.username));
      }
    };

    // Daftarkan listener
    socketService.onNewMessage(handleNewMessage);
    socketService.onUserTyping(handleUserTyping);
    socketService.onUserStopTyping(handleUserStopTyping);

    // Cleanup: Matikan listener hanya untuk event spesifik ini saat pindah ruangan
    return () => {
      socketService.removeListener("new_message", handleNewMessage);
      socketService.removeListener("user_typing", handleUserTyping);
      socketService.removeListener("user_stop_typing", handleUserStopTyping);
    };
  }, [selectedRoom]); // Akan dijalankan ulang setiap kali selectedRoom berubah

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]); // Akan otomatis memicu scroll setiap kali isi array 'messages' bertambah

  // ==========================================
  // 3. SELECT ROOM (Leave Old Room Fixed)
  // ==========================================
  const handleSelectRoom = async (room) => {
    try {
      // PERBAIKAN: Keluar dari ruangan sebelumnya sebelum masuk ruangan baru
      if (selectedRoom && selectedRoom.id !== room.id) {
        socketService.leaveRoom(selectedRoom.id, currentUser.username);
      }

      setSelectedRoom(room);
      setMessages([]); // Kosongkan chat sejenak untuk menghindari bug visual
      setTypingUsers([]); // Bersihkan status typing

      const response = await axios.get(`${API_URL}/check-membership`, {
        params: { chat_room_id: room.id, user_id: currentUser.id },
      });

      setIsMember(response.data.isMember);

      if (response.data.isMember) {
        const messagesResponse = await axios.get(`${API_URL}/${room.id}/messages/latest`);
        setMessages(messagesResponse.data.data);
        socketService.joinRoom(room.id, currentUser.id, currentUser.username);
      }
    } catch (error) {
      console.error("Error selecting room:", error);
    }
  };

   // ==========================================
  // 4. HANDLE SEARCH/FILTER
  // ==========================================
  const handleCategoryChange = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setSelectedCategories([]);
    setSortBy("newest");
  };

  // ==========================================
  // 5. JOIN, LEAVE, AND SEND MESSAGE
  // ==========================================
  const handleJoinRoom = async () => {
    try {
      await axios.post(`${API_URL}/join`, {
        chat_room_id: selectedRoom.id,
        user_id: currentUser.id,
      });

      setIsMember(true);
      const response = await axios.get(`${API_URL}/${selectedRoom.id}/messages/latest`);
      setMessages(response.data.data);
      socketService.joinRoom(selectedRoom.id, currentUser.id, currentUser.username);
    } catch (error) {
      console.error("Error joining room:", error);
      alert("Gagal bergabung dengan ruangan");
    }
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedRoom) return;

    socketService.sendMessage(selectedRoom.id, currentUser.id, "text", messageInput);
    setMessageInput("");
    socketService.userStopTyping(selectedRoom.id, currentUser.username);
    setIsTyping(false);
  };

  const handleMessageInputChange = (e) => {
    setMessageInput(e.target.value);

    if (!isTyping) {
      socketService.userTyping(selectedRoom.id, currentUser.username);
      setIsTyping(true);
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketService.userStopTyping(selectedRoom.id, currentUser.username);
      setIsTyping(false);
    }, 2000);
  };

  const handleLeaveRoom = async () => {
    try {
      await axios.post(`${API_URL}/leave`, {
        chat_room_id: selectedRoom.id,
        user_id: currentUser.id,
      });

      socketService.leaveRoom(selectedRoom.id, currentUser.username);
      setSelectedRoom(null);
      setMessages([]);
      setIsMember(false);
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  };

  useEffect(() => {
    document.title = "Community | Eventify";
  }, []);

  return (
    <>
      <Navbar />
      <div className="container" style={{ minHeight: "70vh", marginTop: "2rem", marginBottom: "2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "2rem" }}>
          
          {/* ========== LEFT: SIDEBAR ========== */}
          <div style={{ borderRight: "1px solid #ddd", paddingRight: "1rem" }}>
            <h4 className="fw-semibold mb-3">🔍 Temukan Ruangan</h4>

            {/* SEARCH INPUT */}
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: "0.9rem" }}>
                Cari Ruangan
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Cari nama atau deskripsi..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={{ fontSize: "0.9rem" }}
              />
            </div>

            {/* SORT DROPDOWN */}
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: "0.9rem" }}>
                Urutkan
              </label>
              <select
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ fontSize: "0.9rem" }}
              >
                <option value="newest">📅 Terbaru</option>
                <option value="trending">🔥 Trending (Paling Anggota)</option>
                <option value="recently-active">💬 Aktif Terbaru</option>
                <option value="least-members">❄️ Paling Sepi</option>
              </select>
            </div>

            {/* CATEGORY FILTER */}
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: "0.9rem" }}>
                Kategori
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {CATEGORIES.map((category) => (
                  <div key={category.id} className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`category-${category.id}`}
                      checked={selectedCategories.includes(category.id)}
                      onChange={() => handleCategoryChange(category.id)}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`category-${category.id}`}
                      style={{ fontSize: "0.9rem", marginBottom: 0 }}
                    >
                      {category.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* RESET BUTTON */}
            {(searchInput || selectedCategories.length > 0 || sortBy !== "newest") && (
              <button
                className="btn btn-outline-secondary btn-sm w-100 mb-3"
                onClick={handleResetFilters}
              >
                🔄 Reset Filter
              </button>
            )}

            <hr />

            {/* ROOM LIST */}
            <h5 className="fw-semibold mb-3">
              Ruangan ({chatRooms.length})
            </h5>
            {loading ? (
              <p style={{ textAlign: "center", color: "#999" }}>⏳ Memuat...</p>
            ) : chatRooms.length === 0 ? (
              <p style={{ textAlign: "center", color: "#999", fontSize: "0.9rem" }}>
                Tidak ada ruangan yang cocok
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {chatRooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => handleSelectRoom(room)}
                    style={{
                      padding: "0.75rem",
                      border: selectedRoom?.id === room.id ? "2px solid #0066cc" : "1px solid #ddd",
                      borderRadius: "8px",
                      cursor: "pointer",
                      backgroundColor: selectedRoom?.id === room.id ? "#f0f4ff" : "white",
                      transition: "all 0.2s",
                    }}
                  >
                    <h6 className="mb-1" style={{ fontSize: "0.95rem" }}>
                      {room.name}
                    </h6>
                    <small style={{ color: "#666", display: "block", marginBottom: "0.25rem" }}>
                      {room.description?.substring(0, 40) || "Tidak ada deskripsi"}
                    </small>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ========== RIGHT: CHAT AREA ========== */}
          <div>
            {selectedRoom ? (
              <div style={{ display: "flex", flexDirection: "column", height: "600px" }}>
                <div style={{ marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "2px solid #ddd" }}>
                  <h4 className="mb-0 fw-semibold">{selectedRoom.name}</h4>
                  <small style={{ color: "#666" }}>
                    {selectedRoom.description || "Tidak ada deskripsi"}
                  </small>
                </div>

                {/* Messages */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    marginBottom: "1rem",
                    padding: "1rem",
                    backgroundColor: "#f9f9f9",
                    borderRadius: "8px",
                  }}
                >
                  {isMember ? (
                    <>
                      {messages.map((msg, index) => {
                        const isMe = msg.sender_id === currentUser.id;
                        return (
                          <div
                            key={msg.id || index}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: isMe ? "flex-end" : "flex-start", // Kanan jika saya, Kiri jika orang lain
                              marginBottom: "1rem",
                            }}
                          >
                            <div
                              style={{
                                padding: "0.75rem",
                                backgroundColor: isMe ? "#e3f2fd" : "white", // Biru muda vs Putih
                                borderRadius: "8px",
                                border: "1px solid #ddd",
                                maxWidth: "70%", // Agar tidak melebar penuh ke samping
                              }}
                            >
                              <strong style={{ fontSize: "0.85rem", color: isMe ? "#0066cc" : "#333" }}>
                                {isMe ? "Anda" : msg.username}
                              </strong>
                              <br />
                              {msg.message_type === "text" && <p className="mb-1" style={{ wordBreak: "break-word" }}>{msg.body}</p>}
                              {msg.message_type === "image" && <img src={msg.media_url} alt="img" style={{ maxWidth: "200px", borderRadius: "4px" }} />}
                              {msg.message_type === "recommendation" && <p>📌 Event Recommendation: {msg.recommended_event_id}</p>}
                              <small style={{ color: "#999", display: "block", textAlign: "right", fontSize: "0.75rem" }}>
                                {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Baru saja"}
                              </small>
                            </div>
                          </div>
                        );
                      })}

                      {/* Typing Indicator */}
                      {typingUsers.length > 0 && (
                        <p style={{ fontStyle: "italic", color: "#999" }}>
                          ✍️ {typingUsers.join(", ")} sedang mengetik...
                        </p>
                      )}
                      <div ref={messagesEndRef} />
                    </>
                  ) : (
                    <p style={{ textAlign: "center", color: "#999", marginTop: "2rem" }}>
                      Bergabunglah untuk melihat pesan
                    </p>
                  )}
                </div>

                {/* Input Area */}
                {isMember ? (
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <input
                      type="text"
                      value={messageInput}
                      onChange={handleMessageInputChange}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Ketik pesan..."
                      style={{
                        flex: 1,
                        padding: "0.75rem",
                        border: "1px solid #ddd",
                        borderRadius: "8px",
                      }}
                    />
                    <button onClick={handleSendMessage} className="btn btn-primary">
                      Kirim
                    </button>
                    <button onClick={handleLeaveRoom} className="btn btn-danger">
                      Keluar
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={handleJoinRoom}
                      className="btn btn-success"
                      style={{ flex: 1 }}
                    >
                      Bergabung dengan Ruangan
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", marginTop: "3rem", color: "#999" }}>
                <p>👈 Pilih ruangan untuk memulai chat</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Community;