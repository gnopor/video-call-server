class UsersDB {
  constructor() {
    this.users = [];
  }
  
  addUser(user) {
    user.dateAdd = new Date()
    this.users = [...this.users, user];
  }
  
  getUser(id) {
    return this.users.find((user) => user.id === id);
  }
  
  updateUser(id, update) {
    // const user = this.getUser(id)
    update.dateUpdate = new Date()
    update.id = id
    const index = this.users.findIndex((user) => user.id === id);
    this.users[index] = update;
    return update
  }
  
  getUserByPublicId(_id) {
    return this.users.find((user) => user._id === _id);
  }
  
  getUsersByRoom(room) {
    return this.users.filter((user) => user.room === room);
  }
  
  removeUser(id) {
    this.users = this.users.filter((user) => user.id !== id);
  }
  
  setTypingStatus(id, typingStatus) {
    const index = this.users.findIndex((user) => user.id === id);
    this.users[index].typingStatus = typingStatus;
  }
}

module.exports = () => {
  return new UsersDB();
};
