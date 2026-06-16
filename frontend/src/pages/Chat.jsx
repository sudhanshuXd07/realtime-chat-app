import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../api/axios";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://realtime-chat-app-1-p6hq.onrender.com";
const socket = io(SOCKET_URL);

function Chat() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [file, setFile] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [randomMode, setRandomMode] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [partnerId, setPartnerId] = useState(null);

  // Load chat history
  useEffect(() => {
    if (!user || !activeChat) return;
    API.get(`/messages/${user.id}/${activeChat._id}`)
      .then((res) => setMessages(res.data))
      .catch((err) => console.error("History fetch failed:", err));
  }, [activeChat, user]);

  // Fetch contacts
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (user) {
      API.get("/users", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          // #region agent log
          fetch('http://127.0.0.1:7553/ingest/a0c42aab-7475-43a0-8a56-ebfbce0f7080',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8315b0'},body:JSON.stringify({sessionId:'8315b0',location:'Chat.jsx:fetchContacts',message:'contacts loaded',data:{count:res.data?.length},timestamp:Date.now(),hypothesisId:'A',runId:'post-fix'})}).catch(()=>{});
          // #endregion
          setContacts(res.data);
        })
        .catch((err) => console.error("Error fetching users:", err));
    }
  }, [user]);

  // Socket setup
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      navigate("/");
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);
    socket.emit("join", parsedUser.id);

    // #region agent log
    const onConnect = () => fetch('http://127.0.0.1:7553/ingest/a0c42aab-7475-43a0-8a56-ebfbce0f7080',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8315b0'},body:JSON.stringify({sessionId:'8315b0',location:'Chat.jsx:socket',message:'socket connected',data:{socketId:socket.id},timestamp:Date.now(),hypothesisId:'D',runId:'post-fix'})}).catch(()=>{});
    const onConnectError = (err) => fetch('http://127.0.0.1:7553/ingest/a0c42aab-7475-43a0-8a56-ebfbce0f7080',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'8315b0'},body:JSON.stringify({sessionId:'8315b0',location:'Chat.jsx:socket',message:'socket connect error',data:{error:err?.message},timestamp:Date.now(),hypothesisId:'D',runId:'post-fix'})}).catch(()=>{});
    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
    // #endregion

    socket.on("online_users", (users) => setOnlineUsers(users));
    socket.on("typing", ({ sender, isTyping }) => {
      if (sender !== parsedUser.id) setIsPartnerTyping(isTyping);
    });
    socket.on("receive_message", (msg) =>
      setMessages((prev) => [...prev, msg])
    );

    socket.on("chat_started", (data) => {
      setRoomId(data.roomId);

      const partner = data.users.find((id) => id !== parsedUser.id);

      setPartnerId(partner);
      setActiveChat({ _id: partner, username: "Random User" });
      setRandomMode(true);
      setMessages([]);
    });

    socket.on("partner_skipped", () => {
      alert("Partner skipped 😢");
      setMessages([]);
    });

    socket.on("chat_ended", () => {
      alert("Chat ended");
      setActiveChat(null);
      setRandomMode(false);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
      socket.off("online_users");
      socket.off("receive_message");
      socket.off("typing");
      socket.off("chat_started");
      socket.off("partner_skipped");
      socket.off("chat_ended");
    };
  }, [navigate]);

  const sendMessage = () => {
    if (!message.trim() || !user || !activeChat) return;

    if (randomMode) {
      socket.emit("sendMessage", {
        room: roomId,
        message: {
          sender: user.id,
          text: message,
          createdAt: new Date(),
        },
      });
    } else {
      socket.emit("send_message", {
        sender: user.id,
        receiver: activeChat._id,
        text: message,
      });
    }

    setMessages((prev) => [
      ...prev,
      {
        sender: user.id,
        text: message,
        createdAt: new Date(),
      },
    ]);

    setMessage("");
  };
  const notifyTyping = (receiverId) => {
    socket.emit("typing", { sender: user.id, receiver: receiverId, isTyping: true });
    if (typingTimeout) clearTimeout(typingTimeout);
    const t = setTimeout(() => {
      socket.emit("typing", { sender: user.id, receiver: receiverId, isTyping: false });
    }, 1000);
    setTypingTimeout(t);
  };

  const handleFindRandom = () => {
    socket.emit("find_random", user.id);
  };

  const handleSkip = () => {
    socket.emit("skip_user");
    socket.emit("find_random", user.id);
  };

  const handleEndChat = () => {
    socket.emit("end_chat");
    setActiveChat(null);
    setRandomMode(false);
  };

  const handleAddFriend = async () => {
    try {
      await API.post("/friends/add", {
        senderId: user.id,
        receiverId: partnerId,
      });
      alert("Friend added ✅");
    } catch (err) {
      console.error(err);
    }
  };

  return (
  <div className="h-screen w-full flex bg-gradient-to-br from-black via-black-light to-brown-deeper text-cream font-poppins">

    {/* Sidebar */}
    <div className="w-1/4 bg-black-soft border-r border-brown/30 flex flex-col shadow-card">

      {/* Profile */}
      <div className="flex items-center gap-3 p-4 border-b border-brown/30">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-brown to-brown-dark flex items-center justify-center text-lg font-bold text-cream shadow-md">
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-cream">{user?.username}</h2>
          <p className="text-xs text-brown-light">● Online</p>
        </div>
      </div>

      {/* Users */}
      <div className="flex-1 overflow-y-auto p-3">
        <h3 className="text-cream-dim text-xs mb-2 uppercase tracking-wide">People</h3>
        <ul>
          {onlineUsers.map((u) => (
            <li
              key={u}
              onClick={() => setActiveChat({ _id: u, username: u })}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer mb-2 transition-all ${
                activeChat?._id === u
                  ? "bg-brown text-cream shadow-md scale-[1.02]"
                  : "hover:bg-black-muted text-cream-muted"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-brown-dark flex items-center justify-center text-sm text-cream">
                {u[0]}
              </div>
              <span className="text-sm">
                {u === user?.id ? "You" : u.slice(0, 8)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Logout */}
      <div className="p-3 border-t border-brown/30">
        <button
          onClick={() => {
            localStorage.clear();
            navigate("/");
          }}
          className="w-full py-2 rounded-xl bg-brown hover:bg-brown-light text-cream transition shadow-md hover:shadow-glow"
        >
          Logout
        </button>
      </div>
    </div>

    {/* Chat Area */}
    <div className="flex-1 flex flex-col">

      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-brown/30 bg-black-soft">
        <h2 className="text-lg font-semibold text-cream">
          {activeChat ? activeChat.username : "Select a user"}
        </h2>

        <div className="flex gap-2">
          <button
            onClick={handleFindRandom}
            className="bg-brown-light hover:bg-brown text-cream px-3 py-1.5 rounded-lg shadow-sm transition text-sm font-medium"
          >
            Random
          </button>

          {randomMode && (
            <>
              <button
                onClick={handleSkip}
                className="bg-cream text-brown-dark hover:bg-cream-dark px-3 py-1.5 rounded-lg transition text-sm font-medium"
              >
                Next
              </button>
              <button
                onClick={handleAddFriend}
                className="bg-brown hover:bg-brown-light text-cream px-3 py-1.5 rounded-lg transition text-sm font-medium"
              >
                Add
              </button>
              <button
                onClick={handleEndChat}
                className="bg-brown-deeper hover:bg-black-muted text-cream px-3 py-1.5 rounded-lg transition text-sm font-medium"
              >
                End
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-black-light via-black-soft to-black">

        {messages.map((m, i) => {
          const mine = m.sender === user?.id;

          return (
            <div key={i} className={`flex mb-3 ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-md transition ${
                  mine
                    ? "bg-gradient-to-r from-brown to-brown-dark text-cream rounded-br-sm"
                    : "bg-black-muted text-cream border border-brown/20 rounded-bl-sm"
                }`}
              >
                <p>{m.text}</p>
                <span className="block text-[10px] opacity-70 mt-1 text-right">
                  {m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : ""}
                </span>
              </div>
            </div>
          );
        })}

        {isPartnerTyping && (
          <div className="text-sm text-cream-dim italic animate-pulse">
            typing...
          </div>
        )}
      </div>

      {/* Input */}
      {activeChat && (
        <div className="flex items-center gap-2 p-4 bg-black-soft border-t border-brown/30">
          <input
            type="text"
            value={message}
            placeholder="Type a message..."
            onChange={(e) => {
              setMessage(e.target.value);
              if (!randomMode) notifyTyping(activeChat._id);
            }}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 bg-cream-dark text-black placeholder:text-cream-dim p-3 rounded-xl outline-none focus:ring-2 focus:ring-brown border border-brown/20"
          />

          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-xs text-cream-dim file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-brown file:text-cream file:text-xs file:cursor-pointer"
          />

          <button
            onClick={sendMessage}
            className="bg-brown hover:bg-brown-light text-cream px-4 py-2 rounded-xl shadow-md hover:shadow-glow transition font-medium"
          >
            Send
          </button>
        </div>
      )}
    </div>
  </div>
);
}

export default Chat;
