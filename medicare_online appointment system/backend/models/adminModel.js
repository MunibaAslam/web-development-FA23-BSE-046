const db = require('../config/db');

const findAdminByUsername = async (username) => {
  const [rows] = await db.execute('SELECT * FROM admin WHERE username = ?', [username]);
  return rows[0];
};

module.exports = { findAdminByUsername };
