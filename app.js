const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

const usersDB = require("./utils/users")();
const Message = require("./Models/Message")();

// when there is a connection
io.on("connection", (socket) => {
  // Create User
  socket.on("createUser", (user) => {
    //console.log("Create user", user);

    usersDB.addUser({
      ...user,
      id: socket.id,
    });
    console.log("soccet id", socket.id);
    return { id: socket.id };
  });

  // Join a Room
  socket.on("joinRoom", ({ name, room }) => {
    //console.log("Join Room", name, room);

    socket.join(room);
    io.to(room).emit("updateUsers", usersDB.getUsersByRoom(room));
    socket.emit("newMessage", new Message("admin", `Hello, ${name}`));
    socket.broadcast
      .to(room)
      .emit(
        "newMessage",
        new Message("admin", `User ${name} connected to chat`)
      );
  });

  // Create Message
  socket.on("createMessage", ({ id, msg }) => {
    // console.log("Create Message", msg);
    const user = usersDB.getUser(id);
    if (user) {
      io.to(user.room).emit("newMessage", new Message(user.name, msg, id));
    }
  });

  // Set Typing Status
  socket.on("setTypingStatus", ({ room, typingStatus, id }) => {
    //console.log("set TyPing Status", typingStatus, room);

    usersDB.setTypingStatus(id, typingStatus);
    io.to(room).emit("updateUsers", usersDB.getUsersByRoom(room));
  });

  // new Value
  socket.on("newValue", (qrcodeValue) => {
    console.log("newValue", qrcodeValue);
    io.emit("QRCodeResponse", {
      idPatient: "a determiner",
      idMedecin: qrcodeValue,
    });
  });

  // disconnect
  const exitEvents = ["leftChat", "disconnect"];

  exitEvents.forEach((event) => {
    socket.on(event, () => {
      const id = socket.id;
      const user = usersDB.getUser(id);
      if (!user) return;
      const { room, name } = user;
      usersDB.removeUser(id);
      socket.leave(room);
      io.to(room).emit("updateUsers", usersDB.getUsersByRoom(room));
      io.to(room).emit(
        "newMessage",
        new Message("admin", `User ${name} left chat`)
      );
    });
  });
});

module.exports = {
  app,
  server,
};
