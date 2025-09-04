const jwt = require('jsonwebtoken');

// Generate access token
const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '15m' }
  );
};

// Generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
};

// Verify access token
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw error;
  }
};

// Verify refresh token
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw error;
  }
};

// Generate token pair (access + refresh)
const generateTokenPair = (userId) => {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);
  
  return {
    accessToken,
    refreshToken
  };
};

// Set refresh token in user's refreshTokens array
const setRefreshToken = async (user, refreshToken) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  user.refreshTokens.push({
    token: refreshToken,
    expiresAt
  });

  // Keep only the last 5 refresh tokens
  if (user.refreshTokens.length > 5) {
    user.refreshTokens = user.refreshTokens.slice(-5);
  }

  await user.save();
};

// Remove refresh token from user's refreshTokens array
const removeRefreshToken = async (user, refreshToken) => {
  user.refreshTokens = user.refreshTokens.filter(
    rt => rt.token !== refreshToken
  );
  await user.save();
};

// Clean expired refresh tokens
const cleanExpiredTokens = async (user) => {
  const now = new Date();
  user.refreshTokens = user.refreshTokens.filter(
    rt => rt.expiresAt > now
  );
  await user.save();
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
  setRefreshToken,
  removeRefreshToken,
  cleanExpiredTokens
};







