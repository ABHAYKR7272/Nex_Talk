const express  = require('express');
const jwt      = require('jsonwebtoken');
const multer   = require('multer');
const path     = require('path');
const fs       = require('fs');
const { body, validationResult } = require('express-validator');
const User     = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const genToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// ── Multer for avatar uploads ─────────────────────────────
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/avatars');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    cb(null, 'avatar-' + req.user._id + '-' + Date.now() + ext);
  },
});
const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const ok = /\.(jpe?g|png|gif|webp)$/i.test(file.originalname);
    ok ? cb(null, true) : cb(new Error('Only image files are allowed'));
  },
});

// ── POST /api/auth/register ───────────────────────────────
router.post('/register', [
  body('username').trim().isLength({ min:3, max:20 }).matches(/^[a-z0-9._]+$/).withMessage('Username: 3-20 chars, only letters/numbers/._'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min:6 }).withMessage('Password must be 6+ characters'),
  body('displayName').trim().notEmpty().withMessage('Display name required'),
], async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ success:false, message: errs.array()[0].msg });
  try {
    const { username, email, password, displayName } = req.body;
    const exists = await User.findOne({ $or:[{ email: email.toLowerCase() },{ username: username.toLowerCase() }] });
    if (exists) return res.status(409).json({ success:false, message: (exists.email===email.toLowerCase() ? 'Email' : 'Username') + ' already taken.' });
    const user  = await User.create({ username: username.toLowerCase(), email: email.toLowerCase(), password, displayName });
    const token = genToken(user._id);
    res.status(201).json({ success:true, token, user: user.toPublicJSON() });
  } catch(e) { res.status(500).json({ success:false, message: e.message }); }
});

// ── POST /api/auth/login ──────────────────────────────────
router.post('/login', [
  body('login').trim().notEmpty().withMessage('Username or email required'),
  body('password').notEmpty().withMessage('Password required'),
], async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ success:false, message: errs.array()[0].msg });
  try {
    const { login, password } = req.body;
    const user = await User.findOne({ $or:[{ email: login.toLowerCase() },{ username: login.toLowerCase() }] });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success:false, message: 'Wrong username/email or password.' });
    const token = genToken(user._id);
    res.json({ success:true, token, user: user.toPublicJSON() });
  } catch(e) { res.status(500).json({ success:false, message: e.message }); }
});

// ── GET /api/auth/me ──────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('pendingRequests', 'username displayName');
    res.json({ success:true, user: {
      ...user.toPublicJSON(),
      followers: user.followers.length,
      following: user.following.length,
    }});
  } catch(e) { res.status(500).json({ success:false, message: e.message }); }
});

// ── PUT /api/auth/update-profile ──────────────────────────
router.put('/update-profile', protect, async (req, res) => {
  try {
    const { displayName, bio, isPrivate } = req.body;
    if (!displayName?.trim()) return res.status(400).json({ success:false, message:'Display name required' });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { displayName: displayName.trim(), bio: (bio||'').trim(), isPrivate: !!isPrivate },
      { new:true, runValidators:true }
    );
    res.json({ success:true, user: user.toPublicJSON() });
  } catch(e) { res.status(500).json({ success:false, message: e.message }); }
});

// ── POST /api/auth/upload-avatar ──────────────────────────
// FIX: This route was missing — profile photo upload now works
router.post('/upload-avatar', protect, avatarUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success:false, message:'No file uploaded' });

    // Delete old avatar file if it exists locally
    const existing = await User.findById(req.user._id).select('profilePic');
    if (existing?.profilePic && existing.profilePic.startsWith('avatars/')) {
      const oldPath = path.join(__dirname, '../uploads', existing.profilePic);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    // Store relative path: "avatars/avatar-xxx.jpg"
    const relPath = 'avatars/' + req.file.filename;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic: relPath },
      { new: true }
    );

    res.json({ success:true, user: user.toPublicJSON() });
  } catch(e) { res.status(500).json({ success:false, message: e.message }); }
});

// ── DELETE /api/auth/delete-account ──────────────────────
router.delete('/delete-account', protect, async (req, res) => {
  try {
    const uid = req.user._id;
    await User.updateMany(
      { $or:[{ followers:uid },{ following:uid },{ pendingRequests:uid },{ sentRequests:uid }] },
      { $pull:{ followers:uid, following:uid, pendingRequests:uid, sentRequests:uid } }
    );
    await User.findByIdAndDelete(uid);
    res.json({ success:true, message:'Account deleted.' });
  } catch(e) { res.status(500).json({ success:false, message: e.message }); }
});

module.exports = router;
