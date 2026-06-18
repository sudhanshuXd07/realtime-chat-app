import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../api/axios";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "https://realtime-chat-app-1-p6hq.onrender.com";
const socket = io(SOCKET_URL);

const fallbackAvatar = (seed = "U") => {
  const label = seed.trim().slice(0, 2).toUpperCase().replace(/[<>&"]/g, "") || "U";
  const colors = [
    ["#7B4B28", "#E8DFD0"],
    ["#2563EB", "#DBEAFE"],
    ["#059669", "#D1FAE5"],
    ["#DC2626", "#FEE2E2"],
    ["#9333EA", "#F3E8FF"],
  ];
  const index = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
  const [bg, fg] = colors[index];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="36" fill="${bg}"/><circle cx="34" cy="30" r="38" fill="${fg}" opacity=".24"/><circle cx="98" cy="104" r="46" fill="#111827" opacity=".2"/><text x="64" y="76" text-anchor="middle" font-family="Arial, sans-serif" font-size="38" font-weight="700" fill="${fg}">${label}</text></svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

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

  useEffect(() => {
    if (!user || !activeChat) return;

    API.get(`/messages/${user.id}/${activeChat._id}`)
      .then((res) => setMessages(res.data))
      .catch((err) => console.error("History fetch failed:", err));
  }, [activeChat, user]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!user) return;

    API.get("/users", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setContacts(res.data))
      .catch((err) => console.error("Error fetching users:", err));
  }, [user]);

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
    socket.on("receive_message", (msg) => setMessages((prev) => [...prev, msg]));

    socket.on("chat_started", (data) => {
      setRoomId(data.roomId);

      const partner = data.users.find((id) => id !== parsedUser.id);

      setPartnerId(partner);
      setActiveChat({ _id: partner, username: "Random User" });
      setRandomMode(true);
      setMessages([]);
    });

    socket.on("partner_skipped", () => {
      alert("Partner skipped");
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
      alert("Friend added");
    } catch (err) {
      console.error(err);
    }
  };

  const getUserDetails = (id) => {
    if (id === user?.id) return user;
    return contacts.find((contact) => contact._id === id || contact.id === id);
  };

  const getDisplayName = (id) => {
    if (id === user?.id) return "You";
    return getUserDetails(id)?.username || id?.slice(0, 12) || "User";
  };

  const getAvatar = (id, name) => {
    const details = getUserDetails(id);
    return details?.avatar || fallbackAvatar(name || details?.username || id);
  };

  const handleAvatarChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    try {
      const data = new FormData();
      data.append("avatar", selectedFile);

      const res = await API.patch("/users/me/avatar", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setUser(res.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.user));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || "Could not update profile picture");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-black via-black-light to-brown-deeper p-4 text-cream font-poppins sm:p-6 lg:p-8">
      <div className="mx-auto flex h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-2xl border border-brown/25 bg-black-soft/90 shadow-card backdrop-blur sm:h-[calc(100vh-3rem)] lg:h-[calc(100vh-4rem)]">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-brown/25 bg-black/55 md:flex lg:w-80">
          <div className="border-b border-brown/25 p-5">
            <div className="flex items-center gap-3">
              <img
                src={user?.avatar || fallbackAvatar(user?.username)}
                alt={user?.username || "Profile"}
                className="h-12 w-12 shrink-0 rounded-full border border-brown/30 object-cover shadow-md"
              />
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-cream">{user?.username}</h2>
                <p className="mt-1 flex items-center gap-2 text-xs text-brown-light">
                  <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.55)]" />
                  Online
                </p>
              </div>
            </div>
            <label className="mt-4 inline-flex cursor-pointer rounded-lg border border-brown/30 px-3 py-2 text-xs font-medium text-cream-muted transition hover:bg-black-muted hover:text-cream">
              Change photo
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-wide text-cream-dim">People</h3>
              <span className="rounded-full bg-black-muted px-2 py-1 text-[11px] text-cream-muted">
                {onlineUsers.length} online
              </span>
            </div>

            <ul className="space-y-2">
              {onlineUsers.map((u) => (
                <li
                  key={u}
                  onClick={() => setActiveChat({ _id: u, username: getDisplayName(u) })}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-all ${
                    activeChat?._id === u
                      ? "bg-brown text-cream shadow-md"
                      : "text-cream-muted hover:bg-black-muted hover:text-cream"
                  }`}
                >
                  <img
                    src={getAvatar(u, getDisplayName(u))}
                    alt={getDisplayName(u)}
                    className="h-9 w-9 shrink-0 rounded-full border border-brown/25 object-cover"
                  />
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {getDisplayName(u)}
                    </span>
                    <span className="text-[11px] text-cream-dim">
                      {u === user?.id ? "Your account" : "Available"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-brown/25 p-4">
            <button
              onClick={() => {
                localStorage.clear();
                navigate("/");
              }}
              className="w-full rounded-xl bg-brown px-4 py-3 font-medium text-cream shadow-md transition hover:bg-brown-light hover:shadow-glow"
            >
              Logout
            </button>
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-20 flex-col gap-3 border-b border-brown/25 bg-black-soft px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="mb-1 text-xs uppercase tracking-wide text-cream-dim">
                {randomMode ? "Random chat" : "Direct message"}
              </p>
              <div className="flex items-center gap-3">
                {activeChat && (
                  <img
                    src={getAvatar(activeChat._id, activeChat.username)}
                    alt={activeChat.username}
                    className="h-10 w-10 shrink-0 rounded-full border border-brown/25 object-cover"
                  />
                )}
                <h2 className="truncate text-xl font-semibold text-cream">
                  {activeChat ? activeChat.username : "Select a user"}
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleFindRandom}
                className="rounded-lg bg-brown-light px-4 py-2 text-sm font-medium text-cream shadow-sm transition hover:bg-brown"
              >
                Random
              </button>

              {randomMode && (
                <>
                  <button
                    onClick={handleSkip}
                    className="rounded-lg bg-cream px-4 py-2 text-sm font-medium text-brown-dark transition hover:bg-cream-dark"
                  >
                    Next
                  </button>
                  <button
                    onClick={handleAddFriend}
                    className="rounded-lg bg-brown px-4 py-2 text-sm font-medium text-cream transition hover:bg-brown-light"
                  >
                    Add
                  </button>
                  <button
                    onClick={handleEndChat}
                    className="rounded-lg bg-black-muted px-4 py-2 text-sm font-medium text-cream transition hover:bg-brown-deeper"
                  >
                    End
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="border-b border-brown/25 bg-black/45 px-4 py-3 md:hidden">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-cream-dim">People</span>
              <span className="text-xs text-cream-muted">{onlineUsers.length} online</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {onlineUsers.map((u) => (
                <button
                  key={u}
                  onClick={() => setActiveChat({ _id: u, username: getDisplayName(u) })}
                  className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                    activeChat?._id === u
                      ? "border-brown bg-brown text-cream"
                      : "border-brown/25 bg-black-muted text-cream-muted"
                  }`}
                >
                  <img
                    src={getAvatar(u, getDisplayName(u))}
                    alt={getDisplayName(u)}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                  {getDisplayName(u)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-black-light via-black-soft to-black px-4 py-5 sm:px-6">
            {messages.length === 0 && (
              <div className="flex h-full items-center justify-center text-center">
                <div className="max-w-sm rounded-2xl border border-brown/20 bg-black/35 p-6 shadow-card">
                  <h3 className="text-lg font-semibold text-cream">
                    {activeChat ? "Start the conversation" : "Choose someone to chat with"}
                  </h3>
                  <p className="mt-2 text-sm text-cream-dim">
                    {activeChat
                      ? "Send a message when you are ready."
                      : "Pick a person from the sidebar or try a random chat."}
                  </p>
                </div>
              </div>
            )}

            {messages.map((m, i) => {
              const mine = m.sender === user?.id;
              const senderName = getDisplayName(m.sender);

              return (
                <div
                  key={i}
                  className={`mb-3 flex items-end gap-2 ${mine ? "justify-end" : "justify-start"}`}
                >
                  {!mine && (
                    <img
                      src={getAvatar(m.sender, senderName)}
                      alt={senderName}
                      className="h-8 w-8 shrink-0 rounded-full border border-brown/20 object-cover"
                    />
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-md transition sm:max-w-[70%] ${
                      mine
                        ? "rounded-br-sm bg-gradient-to-r from-brown to-brown-dark text-cream"
                        : "rounded-bl-sm border border-brown/20 bg-black-muted text-cream"
                    }`}
                  >
                    <p className="break-words leading-relaxed">{m.text}</p>
                    <span className="mt-1 block text-right text-[10px] opacity-70">
                      {m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : ""}
                    </span>
                  </div>
                  {mine && (
                    <img
                      src={getAvatar(user?.id, user?.username)}
                      alt={user?.username || "You"}
                      className="h-8 w-8 shrink-0 rounded-full border border-brown/20 object-cover"
                    />
                  )}
                </div>
              );
            })}

            {isPartnerTyping && (
              <div className="text-sm italic text-cream-dim animate-pulse">typing...</div>
            )}
          </div>

          {activeChat && (
            <div className="border-t border-brown/25 bg-black-soft p-4 sm:p-5">
              <div className="flex flex-col gap-3 rounded-2xl border border-brown/20 bg-black/45 p-3 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={message}
                  placeholder="Type a message..."
                  onChange={(e) => {
                    setMessage(e.target.value);
                    if (!randomMode) notifyTyping(activeChat._id);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="min-h-12 flex-1 rounded-xl border border-brown/20 bg-cream-dark px-4 text-black outline-none placeholder:text-cream-dim focus:ring-2 focus:ring-brown"
                />

                <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                  <label className="cursor-pointer rounded-xl border border-brown/30 px-3 py-2 text-sm text-cream-muted transition hover:bg-black-muted hover:text-cream">
                    Attach
                    <input
                      type="file"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>

                  {file && (
                    <span className="max-w-36 truncate rounded-full bg-black-muted px-3 py-2 text-xs text-cream-dim">
                      {file.name}
                    </span>
                  )}

                  <button
                    onClick={sendMessage}
                    className="min-h-11 rounded-xl bg-brown px-5 font-medium text-cream shadow-md transition hover:bg-brown-light hover:shadow-glow"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Chat;
