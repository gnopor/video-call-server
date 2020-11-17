// import {routerOptions} from "../client/.nuxt/router";

const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

const usersDB = require("./utils/users")();
const Message = require("./Models/Message")();

const sharedRooms = {
  doctorsPatients: "doctorsPatients",
  doctorsWeb: "doctorsWeb",
  patientsWeb: "patientsWeb",
};

// when there is a connection
io.on("connection", (socket) => {
  // Create User
  socket.on("createUser", (user) => {
    //console.log("Create user", user);

    usersDB.addUser({
      ...user,
      id: socket.id,
    });
    console.log("socket id", socket.id);
    console.log(user);
    return { id: socket.id };
  });

  socket.on("connectPractitioner", ({ practitionerId, roomId, patientId }) => {
    //1. get the socketIo id of the doctor
    const doctor = usersDB.getUserByPublicId(practitionerId);
    if (doctor) {
      // update patient (current requester)
      const patient = usersDB.getUserByPublicId(patientId);
      // patient.doctorsList.push(doctor)
      // patient.doctorCurrent = doctor
      // patient.doctorCurrent.dateConnection = new Date()
      //
      // usersDB.updateUser(patient.id, patient)
      //
      // // update doctor
      // doctor.patientsList.push(patient)
      // doctor.patientCurrent = patient
      // doctor.patientCurrent.dateConnection = new Date()
      //
      // // patient join roomId
      // // socket.join(roomId);
      // // 2. send a specific message
      // delete patient.doctorsList
      // delete patient.doctorCurrent
      io.to(doctor.id).emit("connectPractitioner", patient);
    }
  });

  socket.on("validatePractitioner", ({ practitionerId, patientId }) => {
    //1. get the socketIo id of the doctor
    const doctor = usersDB.getUserByPublicId(practitionerId);
    if (doctor) {
      // update patient (current requester)
      const patient = usersDB.getUserByPublicId(patientId);
      // patient.doctorsList.push(doctor)
      // patient.doctorCurrent = doctor
      // patient.doctorCurrent.dateConnection = new Date()
      //
      // usersDB.updateUser(patient.id, patient)
      //
      // // update doctor
      // doctor.patientsList.push(patient)
      // doctor.patientCurrent = patient
      // doctor.patientCurrent.dateConnection = new Date()
      //
      // // patient join roomId
      // // socket.join(roomId);
      // // 2. send a specific message
      // delete patient.doctorsList
      // delete patient.doctorCurrent

      io.to(doctor.id).emit("validatePractitioner", patient);
    }
    // io.emit("validatePractitioner", "to be defined");
  });

  socket.on("handShakePartners", ({ practitionerId, patientId }) => {
    //1. get the socketIo id of the doctor
    const doctor = usersDB.getUserByPublicId(practitionerId);
    if (doctor) {
      // update patient (current requester)
      const patient = usersDB.getUserByPublicId(patientId);
      patient.doctorsList.push(doctor);
      patient.doctorCurrent = doctor;
      patient.doctorCurrent.dateConnection = new Date();

      usersDB.updateUser(patient.id, patient);

      // update doctor
      doctor.patientsList.push(patient);
      doctor.patientCurrent = patient;
      doctor.patientCurrent.dateConnection = new Date();

      // patient join roomId
      // socket.join(roomId);
      // 2. send a specific message
      delete patient.doctorsList;
      delete patient.doctorCurrent;
      io.to(patient.id).emit("handShakePartners");
    }
  });

  // handle practitionner request
  socket.on("requestPatientConnection", ({ patientId, practitionerId }) => {
    console.log("handle practitioner request");
    io.emit("requestPatientConnection", { doctor: "to be defined" });
  });

  // confirm practionner request
  socket.on("confirmPractionner", ({ patientId, practitionerId }) => {
    console.log("confirm practitioner request");
    io.emit("confirmPractionner", { patientId });
  });

  // // handle new entry
  socket.on("emitSignal", (newEntry) => {
    const entry = newEntry;
    io.emit("setNewEntry", entry);
  });

  // // Join a Room
  socket.on("joinRoom", ({ name, room }) => {
    console.log("Join Room", name, room);

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
      io.to(id).emit("newMessage", new Message(user.name, msg, id));
      io.to(user.room).emit("newMessage", new Message(user.name, msg, id));
    }
  });

  // Set Typing Status
  socket.on("setTypingStatus", ({ room, typingStatus, id }) => {
    //console.log("set TyPing Status", typingStatus, room);

    usersDB.setTypingStatus(id, typingStatus);
    io.to(room).emit("updateUsers", usersDB.getUsersByRoom(room));
  });

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
