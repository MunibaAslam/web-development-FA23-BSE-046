const db = require('../config/db');

const createAppointment = async ({ patient_id, doctor_id, date, time, status = 'pending' }) => {
  const [result] = await db.execute(
    'INSERT INTO appointments (patient_id, doctor_id, date, time, status) VALUES (?, ?, ?, ?, ?)',
    [patient_id, doctor_id, date, time, status]
  );
  return { id: result.insertId, patient_id, doctor_id, date, time, status };
};

const findAppointmentsByUser = async (userId) => {
  const [rows] = await db.execute(
    `SELECT a.*, d.name AS doctor_name, d.specialization, u.name AS patient_name, u.email AS patient_email
     FROM appointments a
     JOIN doctors d ON a.doctor_id = d.id
     JOIN users u ON a.patient_id = u.id
     WHERE a.patient_id = ?
     ORDER BY a.date DESC, a.time DESC`,
    [userId]
  );
  return rows;
};

const findAppointmentsByDoctor = async (doctorId) => {
  const [rows] = await db.execute(
    `SELECT a.*, u.name AS patient_name, u.email AS patient_email, d.name AS doctor_name
     FROM appointments a
     JOIN users u ON a.patient_id = u.id
     JOIN doctors d ON a.doctor_id = d.id
     WHERE a.doctor_id = ?
     ORDER BY a.date DESC, a.time DESC`,
    [doctorId]
  );
  return rows;
};

const findAppointmentById = async (id) => {
  const [rows] = await db.execute('SELECT * FROM appointments WHERE id = ?', [id]);
  return rows[0];
};

const updateAppointment = async (id, { date, time, status }) => {
  await db.execute('UPDATE appointments SET date = ?, time = ?, status = ? WHERE id = ?', [date, time, status, id]);
  return findAppointmentById(id);
};

const updateAppointmentStatus = async (id, status) => {
  await db.execute('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
  return findAppointmentById(id);
};

const deleteAppointment = async (id) => {
  await db.execute('DELETE FROM appointments WHERE id = ?', [id]);
};

const hasConflict = async ({ doctor_id, date, time }) => {
  const [rows] = await db.execute(
    'SELECT id FROM appointments WHERE doctor_id = ? AND date = ? AND time = ? AND status != ?',
    [doctor_id, date, time, 'cancelled']
  );
  return rows.length > 0;
};

const getAllAppointments = async () => {
  const [rows] = await db.execute(
    `SELECT a.*, u.name AS patient_name, d.name AS doctor_name, d.specialization
     FROM appointments a
     JOIN users u ON a.patient_id = u.id
     JOIN doctors d ON a.doctor_id = d.id
     ORDER BY a.date DESC, a.time DESC`
  );
  return rows;
};

module.exports = {
  createAppointment,
  findAppointmentsByUser,
  findAppointmentsByDoctor,
  findAppointmentById,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  hasConflict,
  getAllAppointments
};
