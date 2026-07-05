let ioInstance = null;

const setIo = (io) => {
  ioInstance = io;
};

const getIo = () => {
  return ioInstance;
};

const emitToUser = (userId, eventName, payload) => {
  if (!ioInstance) {
    console.log("Socket.IO belum siap");
    return;
  }

  ioInstance.to(`user_${userId}`).emit(eventName, payload);
};

const emitToUsers = (userIds = [], eventName, payload) => {
  if (!ioInstance) {
    console.log("Socket.IO belum siap");
    return;
  }

  userIds.forEach((userId) => {
    ioInstance.to(`user_${userId}`).emit(eventName, payload);
  });
};

module.exports = {
  setIo,
  getIo,
  emitToUser,
  emitToUsers,
};