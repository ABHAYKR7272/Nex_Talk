const jwt  = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer '))
      return res.status(401).json({ success:false, message:'No token provided.' });

    const token   = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user    = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ success:false, message:'User not found.' });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ success:false, message:'Invalid or expired token.' });
  }
};

module.exports = { protect };
