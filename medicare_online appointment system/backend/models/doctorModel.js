const db = require('../config/db');

const createDoctor = async ({ user_id, name, specialization, availability, contact, approved = 0 }) => {
  const [result] = await db.execute(
    'INSERT INTO doctors (user_id, name, specialization, availability, contact, approved) VALUES (?, ?, ?, ?, ?, ?)',
    [user_id, name, specialization, availability, contact, approved]
  );
  return { id: result.insertId, user_id, name, specialization, availability, contact, approved };
};

const findAllDoctors = async () => {
  const [rows] = await db.execute('SELECT * FROM doctors');
  return rows;
};

const getApprovedDoctors = async () => {
  const [rows] = await db.execute('SELECT * FROM doctors WHERE approved = 1');
  return rows;
};

const findDoctorById = async (id) => {
  const [rows] = await db.execute('SELECT * FROM doctors WHERE id = ?', [id]);
  return rows[0];
};

const findDoctorByUserId = async (user_id) => {
  const [rows] = await db.execute('SELECT * FROM doctors WHERE user_id = ?', [user_id]);
  return rows[0];
};

const updateDoctor = async (id, { name, specialization, availability, contact, approved }) => {
  await db.execute(
    'UPDATE doctors SET name = ?, specialization = ?, availability = ?, contact = ?, approved = ? WHERE id = ?',
    [name, specialization, availability, contact, approved, id]
  );
  return findDoctorById(id);
};

const updateAvailability = async (id, availability) => {
  await db.execute('UPDATE doctors SET availability = ? WHERE id = ?', [availability, id]);
  return findDoctorById(id);
};

const deleteDoctor = async (id) => {
  await db.execute('DELETE FROM doctors WHERE id = ?', [id]);
};

module.exports = {
  createDoctor,
  findAllDoctors,
  getApprovedDoctors,
  findDoctorById,
  findDoctorByUserId,
  updateDoctor,
  updateAvailability,
  deleteDoctor
};
