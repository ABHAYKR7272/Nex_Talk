const jwt          = require('jsonwebtoken');
const User         = require('../models/User');
const Message      = require('../models/Message');
const Conversation = require('../models/Conversation');

const online = new Map(); // userId → socketId

module.exports = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('No token'));
      const { id } = jwt.verify(token, process.env.JWT_SECRET);
      const user   = await User.findById(id).select('-password');
      if (!user)   return next(new Error('User not found'));
      socket.user  = user;
      next();
    } catch { next(new Error('Auth failed')); }
  });

  io.on('connection', async (socket) => {
    const uid = socket.user._id.toString();
    online.set(uid, socket.id);
    socket.join(uid);

    await User.findByIdAndUpdate(uid, { isOnline: true, socketId: socket.id });
    broadcastPresence(io, socket.user, true);

    socket.on('sendMessage', async ({ receiverId, content, type = 'text', fileUrl = '', fileSize = '', tempId = '' }) => {
      try {
        if (!content && !fileUrl) return;
        let conv = await Conversation.findOne({ participants: { $all: [uid, receiverId], $size: 2 } });
        if (!conv) conv = await Conversation.create({ participants: [uid, receiverId] });

        const msg = await Message.create({ conversationId: conv._id, sender: uid, type, content, fileUrl, fileSize });
        await Conversation.findByIdAndUpdate(conv._id, { lastMessage: msg._id, lastMessageAt: new Date() });

        const populated = await Message.findById(msg._id).populate('sender', 'username displayName');

        io.to(receiverId).emit('newMessage', { message: populated });
        socket.emit('messageSent', { message: populated, tempId: tempId || content });
      } catch (e) { socket.emit('err', { message: e.message }); }
    });

    // Unsend message
    socket.on('unsendMessage', async ({ messageId, receiverId }) => {
      try {
        const msg = await Message.findById(messageId);
        if (!msg) return;
        if (msg.sender.toString() !== uid) return socket.emit('err', { message: 'Not your message' });
        await Message.findByIdAndUpdate(messageId, { content: '', fileUrl: '', type: 'text', unsent: true });
        io.to(receiverId).emit('messageUnsent', { messageId });
        socket.emit('messageUnsent', { messageId });
      } catch (e) { socket.emit('err', { message: e.message }); }
    });

    socket.on('typing',     ({ receiverId }) => io.to(receiverId).emit('typing',     { senderId: uid }));
    socket.on('stopTyping', ({ receiverId }) => io.to(receiverId).emit('stopTyping', { senderId: uid }));

    socket.on('markRead', async ({ senderId }) => {
      try {
        const conv = await Conversation.findOne({ participants: { $all: [uid, senderId], $size: 2 } });
        if (!conv) return;
        await Message.updateMany({ conversationId: conv._id, sender: senderId, isRead: false }, { isRead: true });
        io.to(senderId).emit('messagesRead', { byUserId: uid });
      } catch {}
    });

    // ── WebRTC signaling ──────────────────────────────────────
    socket.on('callUser', ({ targetId, callType, offer, isRestart }) => {
      if (!targetId || !offer) return;
      console.log(`[CALL] ${uid} → ${targetId} (${callType}${isRestart?' restart':''})`);
      if (isRestart) {
        // ICE restart — send as iceRestart to existing call
        io.to(targetId).emit('iceRestart', { from: uid, offer });
      } else {
        io.to(targetId).emit('incomingCall', { callerId: uid, callerName: socket.user.displayName, callType, offer });
      }
    });

    socket.on('callAccepted', ({ callerId, answer }) => {
      if (!callerId || !answer) return;
      console.log(`[CALL] ${uid} accepted call from ${callerId}`);
      io.to(callerId).emit('callAnswered', { answer, acceptorId: uid });
    });

    socket.on('callRejected', ({ callerId }) => {
      if (!callerId) return;
      io.to(callerId).emit('callRejected', { by: uid });
    });

    socket.on('iceCandidate', ({ targetId, candidate }) => {
      if (!targetId || !candidate) return;
      io.to(targetId).emit('iceCandidate', { candidate, from: uid });
    });

    socket.on('endCall', ({ targetId }) => {
      if (!targetId) return;
      console.log(`[CALL] ${uid} ended call with ${targetId}`);
      io.to(targetId).emit('callEnded', { by: uid });
    });

    socket.on('notifyFollow',  ({ targetId }) => io.to(targetId).emit('followRequest',  { from: { _id: uid, username: socket.user.username, displayName: socket.user.displayName } }));
    socket.on('notifyAccept',  ({ toId }) => {
      const payload = { by: { _id: uid, username: socket.user.username, displayName: socket.user.displayName } };
      io.to(toId).emit('followAccepted', payload);
      io.to(toId).emit('requestAccepted', payload); // backward compat
    });

    socket.on('disconnect', async () => {
      online.delete(uid);
      await User.findByIdAndUpdate(uid, { isOnline: false, lastSeen: new Date(), socketId: '' });
      broadcastPresence(io, socket.user, false);
    });
  });
};

async function broadcastPresence(io, user, isOnline) {
  try {
    const u = await User.findById(user._id).select('followers');
    u?.followers.forEach(fid => {
      io.to(fid.toString()).emit('presence', { userId: user._id.toString(), isOnline, lastSeen: new Date() });
    });
  } catch {}
}
