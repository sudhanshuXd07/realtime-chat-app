let waitingUsers = [];
let onlineUsers = {};

export const socketHandler = (io) => {

  io.on("connection", (socket) => {

    console.log("User connected", socket.id);

    socket.on("join", (userId) => {
      onlineUsers[userId] = socket.id;
    });

    socket.on("findRandom", (userId) => {

      if(waitingUsers.length > 0){

        const partner = waitingUsers.pop();

        const room = socket.id + partner.socketId;

        socket.join(room);
        partner.socket.join(room);

        io.to(room).emit("chatStart",{
          room,
          users:[userId, partner.userId]
        });

      } else {

        waitingUsers.push({
          userId,
          socketId: socket.id,
          socket
        });

      }

    });

    socket.on("sendMessage",({room,message})=>{
      io.to(room).emit("receiveMessage",message);
    });

    socket.on("disconnect",()=>{
      console.log("User disconnected");
    });

  });

};