import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../api/axios";

const socket = io("https://realtime-chat-app-1-p6hq.onrender.com"); // backend URL

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
        .then((res) => setContacts(res.data))
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
  <div className="h-screen w-full flex bg-gradient-to-br from-[#0f0a1f] via-[#1a0f2e] to-[#0b0615] text-white font-sans">

    {/* Sidebar */}
    <div className="w-1/4 bg-white/5 backdrop-blur-lg border-r border-purple-900 flex flex-col shadow-2xl">

      {/* Profile */}
      <div className="flex items-center gap-3 p-4 border-b border-purple-800">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 flex items-center justify-center text-lg font-bold shadow-lg">
          {user?.username?.[0]?.toUpperCase()}
        </div>
        <div>
          <h2 className="text-lg font-semibold">{user?.username}</h2>
          <p className="text-xs text-green-400">● Online</p>
        </div>
      </div>

      {/* Users */}
      <div className="flex-1 overflow-y-auto p-3">
        <h3 className="text-purple-400 text-xs mb-2 uppercase tracking-wide">People</h3>
        <ul>
          {onlineUsers.map((u) => (
            <li
              key={u}
              onClick={() => setActiveChat({ _id: u, username: u })}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer mb-2 transition-all ${
                activeChat?._id === u
                  ? "bg-purple-600 shadow-lg scale-[1.02]"
                  : "hover:bg-purple-800/40"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-sm">
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
      <div className="p-3 border-t border-purple-800">
        <button
          onClick={() => {
            localStorage.clear();
            navigate("/");
          }}
          className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-800 hover:scale-105 transition shadow-lg"
        >
          Logout
        </button>
      </div>
    </div>

    {/* Chat Area */}
    <div className="flex-1 flex flex-col">

      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-purple-800 bg-white/5 backdrop-blur-md">
        <h2 className="text-lg font-semibold text-purple-300">
          {activeChat ? activeChat.username : "Select a user"}
        </h2>

        <div className="flex gap-2">
          <button
            onClick={handleFindRandom}
            className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded-lg shadow"
          >
            Random
          </button>

          {randomMode && (
            <>
              <button onClick={handleSkip} className="bg-yellow-500 px-3 py-1 rounded-lg">
                Next
              </button>
              <button onClick={handleAddFriend} className="bg-blue-500 px-3 py-1 rounded-lg">
                Add
              </button>
              <button onClick={handleEndChat} className="bg-red-500 px-3 py-1 rounded-lg">
                End
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-[#140a2a] via-[#1c0f3a] to-[#0c0618]">

        {messages.map((m, i) => {
          const mine = m.sender === user?.id;

          return (
            <div key={i} className={`flex mb-3 ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[70%] p-3 rounded-2xl text-sm shadow-lg transition ${
                  mine
                    ? "bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-br-sm"
                    : "bg-gray-800 text-gray-200 rounded-bl-sm"
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
          <div className="text-sm text-gray-400 italic animate-pulse">
            typing...
          </div>
        )}
      </div>

      {/* Input */}
      {activeChat && (
        <div className="flex items-center gap-2 p-4 bg-white/5 backdrop-blur-md border-t border-purple-800">
          <input
            type="text"
            value={message}
            placeholder="Type a message..."
            onChange={(e) => {
              setMessage(e.target.value);
              if (!randomMode) notifyTyping(activeChat._id);
            }}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 bg-gray-900/80 p-3 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
          />

          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-xs text-gray-400"
          />

          <button
            onClick={sendMessage}
            className="bg-gradient-to-r from-purple-600 to-purple-800 px-4 py-2 rounded-xl shadow hover:scale-105 transition"
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
