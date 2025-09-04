// Simple admin authentication middleware
// In production, this should be replaced with proper JWT tokens or session management

const adminAuth = (req, res, next) => {
  // For now, we'll use a simple header-based auth
  // In production, implement proper JWT or session-based auth
  
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const providedPassword = req.headers['x-admin-password'];
  
  if (providedPassword === adminPassword) {
    next();
  } else {
    res.status(401).json({ 
      success: false, 
      error: 'Unauthorized access. Admin authentication required.' 
    });
  }
};

module.exports = adminAuth;
