if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
const { app, server } = require("./app");

const port = process.env.PORT;

async function start() {
  // Listen the server
  server.listen(port, () => {
    console.log("Server listening on `localhost:" + port + "`.");
  });
}

start();
