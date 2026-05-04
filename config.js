module.exports = {
  PORT: process.env.PORT || 8080,
  JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production-please',
  JWT_EXPIRES_IN: '1d',
  JWT_REMEMBER_ME_EXPIRES_IN: '30d',
};
