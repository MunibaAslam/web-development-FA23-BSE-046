const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const doctorModel = require('../models/doctorModel');

const jwtSecret = process.env.JWT_SECRET || 'secret123';
const tokenExpiry = '8h';

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, specialization, availability, contact } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All required fields are required' });
    }

    const existingUser = await userModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userModel.createUser({ name, email, password: hashedPassword, role });

    if (role === 'doctor') {
      await doctorModel.createDoctor({ user_id: user.id, name, specialization, availability: availability || '', contact: contact || '', approved: 0 });
      return res.status(201).json({ message: 'Doctor registration submitted for approval' });
    }

    return res.status(201).json({ message: 'Registration successful', user });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password and role are required' });
    }

    const user = await userModel.findByEmail(email);
    if (!user || user.role !== role) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (role === 'doctor') {
      const doctor = await doctorModel.findDoctorByUserId(user.id);
      if (!doctor || doctor.approved !== 1) {
        return res.status(403).json({ message: 'Doctor not approved yet' });
      }
    }

    const payload = { id: user.id, role: user.role };
    const token = jwt.sign(payload, jwtSecret, { expiresIn: tokenExpiry });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = req.user;
    if (user.role === 'doctor') {
      const doctor = await doctorModel.findDoctorByUserId(user.id);
      return res.json({ user, doctor });
    }
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getProfile };
