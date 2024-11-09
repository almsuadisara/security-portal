const jwt = require('jsonwebtoken');

// Middleware للتحقق من التوكن وصلاحيته
const authMiddleware = (req, res, next) => {
  // جلب التوكن من الهيدر في الطلب
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: Token is required.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'انتهت صلاحية الجلسة قم بتسجب الدخول مرة أخرى' });
    }

    req.user = decoded;
    next();
  });
};

module.exports = authMiddleware;
