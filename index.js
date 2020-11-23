const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

const port = process.env.PORT || 5000;

// when there is a connection
io.on("connection", (socket) => {
  console.log(socket.id);

  // brodadcast to all others users that we are connected
  socket.broadcast.emit("add-users", {
    users: [socket.id],
  });

  // listen to make-offer and emmit offer-made to the selecter peer
  socket.on("make-offer", function (data) {
    socket.to(data.to).emit("offer-made", {
      offer: data.offer,
      socket: socket.id,
    });
  });

  // listen to make-answer and send answer back to the peer which create the offer
  socket.on("make-answer", function (data) {
    socket.to(data.to).emit("answer-made", {
      socket: socket.id,
      answer: data.answer,
    });
  });

  // disconnect user and tell other user to remove it
  socket.on("disconnect", () => {
    io.emit("remove-user", socket.id);
  });
});

async function start() {
  // Listen the server
  server.listen(port, () => {
    console.log("Server listening on `localhost:" + port + "`.");
  });
}

start();
