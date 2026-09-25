// Lets HTTP handlers push realtime events without importing Socket.IO setup.
let io = null;
export const setIo = (instance) => {
  io = instance;
};
export const userRoom = (userId) => `user:${userId}`;
export const coupleRoom = (coupleId) => `couple:${coupleId}`;
export const emitToUser = (userId, event, payload) => io?.to(userRoom(userId)).emit(event, payload);
