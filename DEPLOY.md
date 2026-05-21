# 🚀 NexTalk — Deploy Guide (Backend: Render | Frontend: Vercel)

---

## Step 0 — Pre-setup (karo pehle)

### A. MongoDB Atlas (free database)
1. **cloud.mongodb.com** par jao → Sign up (free)
2. "Build a Database" → **M0 Free** tier chuno
3. Username + Password set karo (yaad rakhna!)
4. "Add IP Address" → **0.0.0.0/0** (allow all — production ke liye)
5. "Connect" → "Drivers" → Copy the connection string:
   ```
   mongodb+srv://youruser:yourpass@cluster.mongodb.net/nextalk
   ```
   *(apna username/password replace karo)*

---

## Step 1 — Backend Deploy (Render.com)

### 1.1 GitHub par push karo
```bash
# GitHub par ek nayi repo banao: "nextalk-backend"
cd nextalk-fixed/backend
git init
git add .
git commit -m "NexTalk backend v2"
git remote add origin https://github.com/YOUR_USERNAME/nextalk-backend.git
git push -u origin main
```

### 1.2 Render par deploy karo
1. **render.com** → Sign up (GitHub se)
2. "New +" → **Web Service**
3. GitHub repo connect karo (`nextalk-backend`)
4. Settings:
   - **Name**: `nextalk-backend` (ya jo chahte ho)
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. **Environment Variables** add karo (ye ZAROOR karo):
   | Key | Value |
   |-----|-------|
   | `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/nextalk` |
   | `JWT_SECRET` | (koi bhi lamba random string, e.g. `abc123xyz789qwe`) |
   | `JWT_EXPIRES_IN` | `7d` |
   | `FRONTEND_URL` | `*` *(pehle * rakhdo, baad mein Vercel URL daalo)* |

6. "Create Web Service" click karo
7. ⏳ 3-5 min wait karo jab tak deploy ho
8. Render tumhe ek URL dega jaise:
   ```
   https://nextalk-backend.onrender.com
   ```
   **Ye URL COPY kar lo** — frontend mein daalna hai!

> ⚠️ Free tier par backend 15 min inactivity ke baad "sleep" ho jaata hai.
> Pehli request slow hogi (~30 sec). Paid tier par ye nahi hota.

---

## Step 2 — Frontend mein Render URL daalo

`frontend/index.html` open karo aur ye line dhundho:

```js
const RENDER_URL = 'REPLACE_WITH_YOUR_RENDER_URL';
```

Replace karo apne Render URL se:
```js
const RENDER_URL = 'https://nextalk-backend.onrender.com';
```

**Save karo.**

---

## Step 3 — Frontend Deploy (Vercel)

### 3.1 GitHub par push karo
```bash
# GitHub par ek nayi repo banao: "nextalk-frontend"
cd nextalk-fixed/frontend
git init
git add .
git commit -m "NexTalk frontend v2"
git remote add origin https://github.com/YOUR_USERNAME/nextalk-frontend.git
git push -u origin main
```

### 3.2 Vercel par deploy karo
1. **vercel.com** → Sign up (GitHub se)
2. "Add New Project"
3. GitHub repo import karo (`nextalk-frontend`)
4. Settings:
   - **Framework Preset**: Other
   - **Root Directory**: `./` (default)
   - **Build Command**: *(khaali chhodo)*
   - **Output Directory**: `./`
5. "Deploy" click karo!
6. ✅ Vercel ek URL dega jaise:
   ```
   https://nextalk-frontend.vercel.app
   ```

---

## Step 4 — CORS fix (last step)

Render Dashboard par jao → nextalk-backend → **Environment**

`FRONTEND_URL` ko update karo:
```
https://nextalk-frontend.vercel.app
```

"Save Changes" → backend auto-redeploy hoga.

---

## Step 5 — Test karo!

1. `https://nextalk-frontend.vercel.app` kholo
2. Register karo ek account
3. Doosre browser mein doosra account banao
4. Search karo → Follow karo → Chat karo!

---

## 🔧 Local Development

```bash
# Backend
cd backend
cp .env.example .env
# .env mein MONGO_URI bharo (Atlas ya localhost)
npm install
npm run dev        # http://localhost:5000

# Frontend
# Sirf index.html browser mein open karo (ya VS Code Live Server use karo)
# CFG auto-detect karega localhost:5000
```

---

## ❓ Common Issues

| Problem | Fix |
|---------|-----|
| Backend ne start nahi kiya | MONGO_URI check karo env mein |
| "CORS error" frontend mein | FRONTEND_URL env var Render mein set karo |
| Profile pic upload fail | Render free tier mein files restart par delete hote hain — ye expected hai |
| Socket disconnect | Render free tier sleep mode — pehli request slow hogi |
| "Cannot connect" | Backend URL `index.html` mein sahi set hai? |

---

## 📁 Project Structure

```
nextalk-fixed/
├── backend/
│   ├── config/database.js
│   ├── middleware/authMiddleware.js
│   ├── models/User.js          ← fixed: avatar field
│   ├── routes/
│   │   ├── authRoutes.js       ← fixed: /upload-avatar route
│   │   ├── userRoutes.js       ← fixed: avatar in responses
│   │   └── messageRoutes.js    ← fixed: socket emit on file upload
│   ├── socket/socketManager.js
│   ├── server.js               ← fixed: CORS, io on app
│   ├── render.yaml             ← new: Render config
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── index.html              ← fixed: all bugs + UI improvements
    └── vercel.json             ← new: Vercel config
```
