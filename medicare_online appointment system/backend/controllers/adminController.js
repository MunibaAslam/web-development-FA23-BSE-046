const userModel = require('../models/userModel');
const doctorModel = require('../models/doctorModel');
const appointmentModel = require('../models/appointmentModel');
const adminModel = require('../models/adminModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET || 'secret123';
const tokenExpiry = '8h';

const verifyAdminPassword = async (password, storedPassword) => {
  if (!storedPassword) return false;
  try {
    return await bcrypt.compare(password, storedPassword);
  } catch (err) {
    return password === storedPassword;
  }
};

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }
    const admin = await adminModel.findAdminByUsername(username);
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });
    const match = await verifyAdminPassword(password, admin.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: admin.id, role: 'admin' }, jwtSecret, { expiresIn: tokenExpiry });
    res.json({ token, admin: { id: admin.id, username: admin.username } });
  } catch (error) {
    next(error);
  }
};

const dashboard = async (req, res, next) => {
  try {
    const doctors = await doctorModel.findAllDoctors();
    const patients = await userModel.getAllPatients();
    const appointments = await appointmentModel.getAllAppointments();
    res.json({ totalDoctors: doctors.length, totalPatients: patients.length, totalAppointments: appointments.length, doctors, patients, appointments });
  } catch (error) {
    next(error);
  }
};

const approveDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doctor = await doctorModel.findDoctorById(id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    const updated = await doctorModel.updateDoctor(id, { name: doctor.name, specialization: doctor.specialization, availability: doctor.availability, contact: doctor.contact, approved: 1 });
    res.json({ message: 'Doctor approved', doctor: updated });
  } catch (error) {
    next(error);
  }
};

const updateDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, specialization, availability, contact, approved } = req.body;
    const updated = await doctorModel.updateDoctor(id, { name, specialization, availability, contact, approved: approved ? 1 : 0 });
    res.json({ message: 'Doctor updated', doctor: updated });
  } catch (error) {
    next(error);
  }
};

const deleteDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    await doctorModel.deleteDoctor(id);
    res.json({ message: 'Doctor deleted' });
  } catch (error) {
    next(error);
  }
};

const removePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    await userModel.deleteUser(id);
    res.json({ message: 'Patient removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, dashboard, approveDoctor, updateDoctor, deleteDoctor, removePatient };
