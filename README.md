# ⚡ NexTalk — Social Communication Platform

> Instagram-like follow system + real-time chat + WebRTC voice & video calling  
> 100% free stack — MongoDB Atlas Free + Node.js + Vanilla JS

---

## ✨ Features

| Feature | Status |
|---|---|
| 👤 Register / Login with @username | ✅ |
| 🔍 Search users by username | ✅ |
| ➕ Follow / Unfollow | ✅ |
| 🔒 Private account + request system | ✅ |
| 💬 Real-time chat (WebSocket) | ✅ |
| 📎 Image / Video / File sharing | ✅ |
| 📞 Voice Call (WebRTC) | ✅ |
| 📹 Video Call (WebRTC) | ✅ |
| 🔔 Live notifications | ✅ |
| 🚫 Block / Unblock users | ✅ |
| 🗑️ Delete account | ✅ |
| 🟢 Online / Offline status | ✅ |
| ✓✓ Read receipts | ✅ |
| 📱 Fully responsive (phone/tablet/desktop) | ✅ |

---

## 📁 Project Structure

```
nextalk/
├── backend/
│   ├── server.js              ← Express + Socket.io entry
│   ├── package.json
│   ├── .env.example           ← Copy to .env
│   ├── config/
│   │   └── database.js        ← MongoDB connection
│   ├── models/
│   │   ├── User.js            ← User, followers, block system
│   │   ├── Message.js         ← Messages (text/image/video/file)
│   │   └── Conversation.js    ← Conversation threads
│   ├── routes/
│   │   ├── authRoutes.js      ← Register, Login, Delete
│   │   ├── userRoutes.js      ← Search, Follow, Block
│   │   └── messageRoutes.js   ← Messages + File upload
│   ├── middleware/
│   │   └── authMiddleware.js  ← JWT verify
│   └── socket/
│       └── socketManager.js   ← Real-time events + WebRTC signaling
│
└── frontend/
    └── index.html             ← Complete app (CSS + JS all-in-one)
```

---

## 🚀 Setup — 5 Steps

### Step 1 — Install Node.js

Download from **https://nodejs.org** (choose LTS version — free)  
After install, verify:
```bash
node --version   # should show v18 or higher
npm --version
```

---

### Step 2 — Setup MongoDB (FREE — pick one option)

**Option A: Local MongoDB** (install on your computer)
```bash
# Windows: download from https://www.mongodb.com/try/download/community
# Mac:
brew tap mongodb/brew && brew install mongodb-community && brew services start mongodb-community
# Ubuntu/Linux:
sudo apt-get install -y mongodb && sudo systemctl start mongodb
```

**Option B: MongoDB Atlas** (cloud, no install needed — recommended)
1. Go to **https://cloud.mongodb.com** → Create free account
2. Create a free **M0 cluster**
3. Go to **Database Access** → Add a database user (save username/password)
4. Go to **Network Access** → Add IP Address → Allow from anywhere (`0.0.0.0/0`)
5. Click **Connect** → **Compass** → Copy the connection string
6. Replace `<password>` in the string with your actual password

---

### Step 3 — Backend Setup

```bash
cd nextalk/backend

# Install all packages (free, from npm)
npm install

# Create your .env file
cp .env.example .env
```

Now open `.env` and set your MongoDB URL:
```env
# If using local MongoDB:
MONGO_URI=mongodb://localhost:27017/nextalk

# If using Atlas (paste your connection string):
MONGO_URI=mongodb+srv://youruser:yourpass@cluster.abc123.mongodb.net/nextalk

# Leave everything else as-is for local dev
JWT_SECRET=nextalk_secret_change_in_production_2024
PORT=5000
FRONTEND_URL=*
```

---

### Step 4 — Start the Backend

```bash
# In the backend folder:
npm run dev
```

You should see:
```
✅ MongoDB Connected: localhost
🚀 NexTalk running on http://localhost:5000
📡 WebSocket ready
```

Keep this terminal running.

---

### Step 5 — Open the Frontend

**Option A: VS Code Live Server** (easiest)
1. Install the "Live Server" extension in VS Code
2. Right-click `frontend/index.html` → **Open with Live Server**
3. App opens at `http://127.0.0.1:5500`

**Option B: Python HTTP server**
```bash
cd nextalk/frontend
python3 -m http.server 3000
# Open: http://localhost:3000
```

**Option C: Node http-server**
```bash
npm install -g http-server   # install once
cd nextalk/frontend
http-server -p 3000
# Open: http://localhost:3000
```

---

### Step 6 — Test Everything

1. Open the app in **two browser tabs** (or two different browsers)
2. Create **two different accounts** in each tab
3. In tab 1: search for the tab 2 username → click Follow
4. In tab 2: go to Requests tab → Accept the request
5. Now both can message, voice call, and video call each other!

---

## 📡 API Reference

### Auth (`/api/auth`)
| Method | Endpoint | What it does |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get my profile |
| PUT | `/api/auth/update-profile` | Edit profile |
| DELETE | `/api/auth/delete-account` | Delete account |

### Users (`/api/users`) — needs JWT token
| Method | Endpoint | What it does |
|---|---|---|
| GET | `/api/users/search?q=name` | Search users |
| GET | `/api/users/:username` | View profile |
| POST | `/api/users/:id/follow` | Follow / send request |
| POST | `/api/users/:id/unfollow` | Unfollow |
| POST | `/api/users/:id/accept-request` | Accept follow request |
| POST | `/api/users/:id/reject-request` | Reject follow request |
| POST | `/api/users/:id/block` | Block user |
| POST | `/api/users/:id/unblock` | Unblock user |
| GET | `/api/users/me/pending-requests` | My incoming requests |
| GET | `/api/users/me/following` | Who I follow |
| GET | `/api/users/me/followers` | My followers |

### Messages (`/api/messages`) — needs JWT token
| Method | Endpoint | What it does |
|---|---|---|
| GET | `/api/messages/conversations` | All conversations |
| GET | `/api/messages/:userId` | Chat with user |
| POST | `/api/messages/:userId` | Send text message |
| POST | `/api/messages/:userId/upload` | Send file/image/video |
| DELETE | `/api/messages/:id` | Delete message |

---

## 🔌 Socket.io Events

### Client → Server
```javascript
sendMessage      { receiverId, content, type }
typing           { receiverId }
stopTyping       { receiverId }
markRead         { senderId }
callUser         { targetId, callType, offer }
callAccepted     { callerId, answer }
callRejected     { callerId }
iceCandidate     { targetId, candidate }
endCall          { targetId }
notifyFollow     { targetId }
notifyAccept     { toId }
```

### Server → Client
```javascript
newMessage       { message }
messageSent      { message }
typing           { senderId }
stopTyping       { senderId }
messagesRead     { byUserId }
presence         { userId, isOnline, lastSeen }
followRequest    { from }
followAccepted   { by }
incomingCall     { callerId, callerName, callType, offer }
callAnswered     { answer }
callRejected     {}
callEnded        {}
iceCandidate     { candidate, from }
```

---

## 🌐 Deploy for Free

### Backend → Railway (free tier)
1. Push your code to GitHub
2. Go to **https://railway.app** → New Project → Deploy from GitHub
3. Select the `backend` folder as root
4. Add environment variables (same as `.env`)
5. Get your Railway URL (e.g. `https://nextalk-backend.up.railway.app`)

### Frontend → Vercel (free)
1. Go to **https://vercel.com** → New Project
2. Upload the `frontend` folder
3. Before deploying, update the `CFG` object at the bottom of `index.html`:
```javascript
const CFG = {
  SERVER: 'https://nextalk-backend.up.railway.app',
  API:    'https://nextalk-backend.up.railway.app/api',
};
```

---

## 🔧 Troubleshooting

| Problem | Fix |
|---|---|
| `MongoDB connection failed` | Check MONGO_URI in .env, make sure MongoDB is running |
| `CORS error` in browser | Set `FRONTEND_URL=*` in .env, restart server |
| `Camera/Mic not working` | Use localhost (not file://) and allow browser permissions |
| `Messages not real-time` | Check Socket.io connection in browser console |
| `File upload fails` | Check the `uploads/` folder exists in backend dir |
| Port 5000 already in use | Change `PORT=5001` in .env |

---

## 🛡️ Security

- Passwords hashed with **bcrypt** (12 rounds)
- Auth via **JWT tokens** (7 day expiry)
- Blocked users cannot see/message each other
- Private accounts require follow approval before messaging
- Server-side file type validation
- Input validation on all routes

---

## 📦 Packages Used (all free)

| Package | Use |
|---|---|
| express | HTTP server |
| mongoose | MongoDB ORM |
| socket.io | WebSocket real-time |
| jsonwebtoken | JWT auth |
| bcryptjs | Password hashing |
| cors | Cross-origin requests |
| multer | File uploads |
| express-validator | Input validation |
| dotenv | Environment variables |
| nodemon | Dev auto-restart |

All installed with one command: `npm install`

---

**Made with ❤️ — NexTalk**
