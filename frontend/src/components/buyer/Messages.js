import React, { useEffect, useLayoutEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { Send, CheckCheck, Check, Search, Pencil } from "lucide-react";
import { parseFetchResponse, authHeaders } from "../../utils/fetchHelper";

const SOCKET_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [editingMessage, setEditingMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadMap, setUnreadMap] = useState({});

  const scrollRef = useRef(null);
  const socketRef = useRef(null);

  const userId = sessionStorage.getItem("userId") || localStorage.getItem("userId");
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  const API = (process.env.REACT_APP_API_URL || "http://localhost:5000") + "/api/messages";

  const avatar = (pic, name) =>
    pic
      ? pic.startsWith("http") ? pic : `${process.env.REACT_APP_API_URL}/${pic}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=random`;

  const scrollBottom = () => scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  useLayoutEffect(() => scrollBottom(), [messages]);

  // Load conversations from API (DB isOnline is accurate)
  const loadConversations = async () => {
    if (!userId || !token) return;
    try {
      const res = await fetch(`${API}/conversations/${userId}`, {
        headers: authHeaders(token),
      });
      const data = await parseFetchResponse(res);
      if (!res.ok) {
        throw new Error(data?.message || data || "Failed to load conversations");
      }
      if (Array.isArray(data)) {
        setConversations(data);
        const map = {};
        data.forEach((c) => { if (c.unreadCount) map[c.partnerId] = c.unreadCount; });
        setUnreadMap(map);
      }
    } catch (e) { console.error("Load conversations failed:", e?.message || e); }
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  // ------------------ Socket.IO ------------------
  useEffect(() => {
    if (!userId) return;
    socketRef.current = io(SOCKET_URL, { transports: ["websocket"] });
    const socket = socketRef.current;

    socket.emit("user-online", userId);

    socket.on("presence-update", ({ userId: uid, status }) => {
      setConversations(prev =>
        prev.map(c => (c.partnerId === uid ? { ...c, isOnline: status === "online" } : c))
      );
    });

    socket.on("receive-message", msg => {
      if (selectedConversation?.partnerId === msg.senderId) {
        setMessages(m => [...m, msg]);
      } else {
        setUnreadMap(prev => ({ ...prev, [msg.senderId]: (prev[msg.senderId] || 0) + 1 }));
      }
      loadConversations();
    });

    const handleUnload = () => socket.disconnect();
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [userId]);

  const openConversation = async (c) => {
    setSelectedConversation(c);
    setEditingMessage(null);
    setMessageInput("");
    try {
      const res = await fetch(`${API}/${userId}/${c.partnerId}`, {
        headers: authHeaders(token),
      });
      const data = await parseFetchResponse(res);
      if (!res.ok) {
        throw new Error(data?.message || data || "Failed to open conversation");
      }
      setMessages(Array.isArray(data) ? data : []);
      setUnreadMap(prev => ({ ...prev, [c.partnerId]: 0 }));
    } catch (e) { console.error("Open conversation failed:", e?.message || e); }
  };

  const send = async () => {
    if (!messageInput.trim() || !selectedConversation) return;
    const isEdit = !!editingMessage;
    const url = isEdit ? `${API}/edit/${editingMessage._id}` : `${API}/send`;
    const payload = {
      senderId: userId,
      senderRole: "buyer",
      receiverId: selectedConversation.partnerId,
      receiverRole: "farmer",
      content: messageInput,
    };
    try {
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: authHeaders(token, "application/json"),
        body: JSON.stringify(payload),
      });
      const result = await parseFetchResponse(res);
      if (!res.ok) {
        throw new Error(result?.message || result || "Failed to send message");
      }
      if (isEdit) {
        setMessages(m => m.map(x => x._id === result._id ? result : x));
        setEditingMessage(null);
      } else {
        setMessages(m => [...m, result]);
        socketRef.current.emit("send-message", result);
      }
      setMessageInput("");
      loadConversations();
    } catch (e) { console.error("Send message failed:", e); }
  };

  const isOwn = (m) => (m.senderId?._id || m.senderId)?.toString() === userId;
  const isOnline = (partnerId) => conversations.find(c => c.partnerId === partnerId)?.isOnline;

  return (
    <div style={{ display: "flex", height: "calc(100vh - 80px)", background: "#e5ddd5" }}>
      {/* Sidebar */}
      <div style={{ width: 360, background: "#fff", borderRight: "1px solid #ddd", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: 14, borderBottom: "1px solid #eee", display: "flex", gap: 10 }}>
          <Search size={18} />
          <input
            placeholder="Search or start new chat"
            style={{ border: "none", outline: "none", flex: 1 }}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {conversations.filter(c => c.partnerName?.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(c => (
              <div key={c.partnerId} onClick={() => openConversation(c)} style={{ display: "flex", gap: 12, padding: 12, cursor: "pointer", background: selectedConversation?.partnerId === c.partnerId ? "#f0f2f5" : "#fff", position: "relative" }}>
                <div style={{ position: "relative" }}>
                  <img src={avatar(c.partnerProfilePic, c.partnerName)} alt={c.partnerName ? `${c.partnerName} avatar` : "Chat user avatar"} style={{ width: 48, height: 48, borderRadius: "50%" }} />
                  <div style={{ position: "absolute", right: 2, bottom: 2, width: 12, height: 12, borderRadius: "50%", background: isOnline(c.partnerId) ? "#25d366" : "#bbb", border: "2px solid white" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{c.partnerName}</div>
                  <div style={{ fontSize: 13, color: isOnline(c.partnerId) ? "#25d366" : "#667781", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.lastMessage}</div>
                </div>
                {unreadMap[c.partnerId] > 0 && <div style={{ position: "absolute", right: 10, top: 15, background: "#25d366", color: "#fff", borderRadius: "50%", width: 18, height: 18, display: "grid", placeItems: "center", fontSize: 10, fontWeight: 600 }}>{unreadMap[c.partnerId]}</div>}
              </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {!selectedConversation ? <div style={{ flex: 1, display: "grid", placeItems: "center", color: "#667781" }}>Select a chat</div> :
          <>
            <div style={{ background: "#f0f2f5", padding: 12, display: "flex", gap: 12, alignItems: "center", borderBottom: "1px solid #ddd" }}>
              <img src={avatar(selectedConversation.partnerProfilePic, selectedConversation.partnerName)} alt={selectedConversation.partnerName ? `${selectedConversation.partnerName} avatar` : "Selected chat avatar"} style={{ width: 42, height: 42, borderRadius: "50%" }} />
              <div>
                <div style={{ fontWeight: 600 }}>{selectedConversation.partnerName}</div>
                <div style={{ fontSize: 12, color: isOnline(selectedConversation.partnerId) ? "#25d366" : "#667781" }}>{isOnline(selectedConversation.partnerId) ? "online" : "offline"}</div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              {messages.map(m => {
                const own = isOwn(m);
                return <div key={m._id} style={{ display: "flex", justifyContent: own ? "flex-end" : "flex-start", marginBottom: 6 }}>
                  <div style={{ background: own ? "#d9fdd3" : "#fff", padding: "8px 12px", borderRadius: 10, maxWidth: "65%", boxShadow: "0 1px 0 rgba(0,0,0,.05)", whiteSpace: "pre-wrap", wordWrap: "break-word", position: "relative" }}>
                    {m.content}
                    <div style={{ fontSize: 10, textAlign: "right", marginTop: 2, color: "#667781", display: "flex", justifyContent: "flex-end", gap: 3 }}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {own && (m.status === "read" ? <CheckCheck size={12} /> : <Check size={12} />)}
                    </div>
                    {own && <Pencil size={12} style={{ cursor: "pointer", opacity: 0.5, position: "absolute", top: 4, right: 4 }} onClick={() => { setEditingMessage(m); setMessageInput(m.content); }} />}
                  </div>
                </div>;
              })}
              <div ref={scrollRef} />
            </div>

            <div style={{ padding: 10, background: "#f0f2f5", display: "flex", gap: 10 }}>
              <textarea
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                placeholder="Type a message"
                style={{ flex: 1, borderRadius: 20, border: "none", padding: "10px 16px", resize: "none", maxHeight: 100, minHeight: 40 }}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              />
              <button onClick={send} style={{ background: "#25d366", border: "none", borderRadius: "50%", width: 42, height: 42, display: "grid", placeItems: "center", color: "#fff" }}><Send size={18} /></button>
            </div>
          </>
        }
      </div>
    </div>
  );
};

export default Messages;