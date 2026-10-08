const app = require('../back-end/src/server');
const { connectDatabase } = require('../back-end/src/config/database');

let initialized = false;

module.exports = async (req, res) => {
  if (!initialized) {
    await connectDatabase();
    initialized = true;
  }
  return app(req, res);
};
