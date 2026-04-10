const db = require('../config/db');

const createUser = async ({ name, email, password, role }) => {
  const [result] = await db.execute(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, password, role]
  );
  return { id: result.insertId, name, email, role };
};

const findByEmail = async (email) => {
  const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
};

const findById = async (id) => {
  const [rows] = await db.execute('SELECT id, name, email, role FROM users WHERE id = ?', [id]);
  return rows[0];
};

const getAllPatients = async () => {
  const [rows] = await db.execute('SELECT id, name, email, role FROM users WHERE role = ?', ['patient']);
  return rows;
};

const updateUser = async (id, { name, email, password }) => {
  const query = password
    ? 'UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?'
    : 'UPDATE users SET name = ?, email = ? WHERE id = ?';
  const params = password ? [name, email, password, id] : [name, email, id];
  await db.execute(query, params);
  return findById(id);
};

const deleteUser = async (id) => {
  await db.execute('DELETE FROM users WHERE id = ?', [id]);
};

module.exports = {
  createUser,
  findByEmail,
  findById,
  getAllPatients,
  updateUser,
  deleteUser
};
