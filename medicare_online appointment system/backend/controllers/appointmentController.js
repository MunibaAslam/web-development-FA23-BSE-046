const appointmentModel = require('../models/appointmentModel');
const doctorModel = require('../models/doctorModel');

const createAppointment = async (req, res, next) => {
  try {
    const { doctor_id, date, time } = req.body;
    if (!doctor_id || !date || !time) {
      return res.status(400).json({ message: 'Doctor, date and time are required' });
    }

    const doctor = await doctorModel.findDoctorById(doctor_id);
    if (!doctor || doctor.approved !== 1) {
      return res.status(404).json({ message: 'Doctor not available' });
    }

    const conflict = await appointmentModel.hasConflict({ doctor_id, date, time });
    if (conflict) {
      return res.status(409).json({ message: 'Selected time slot is already booked' });
    }

    const appointment = await appointmentModel.createAppointment({
      patient_id: req.user.id,
      doctor_id,
      date,
      time,
      status: 'pending'
    });

    res.status(201).json({ message: 'Appointment booked successfully', appointment });
  } catch (error) {
    next(error);
  }
};

const listUserAppointments = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (req.user.role === 'patient') {
      if (req.user.id !== Number(userId)) {
        return res.status(403).json({ message: 'Cannot access other patient appointments' });
      }
      const appointments = await appointmentModel.findAppointmentsByUser(userId);
      return res.json(appointments);
    }

    if (req.user.role === 'doctor') {
      if (req.user.id !== Number(userId)) {
        return res.status(403).json({ message: 'Cannot access other doctor appointments' });
      }
      const doctor = await doctorModel.findDoctorByUserId(req.user.id);
      if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });
      const appointments = await appointmentModel.findAppointmentsByDoctor(doctor.id);
      return res.json(appointments);
    }

    if (req.user.role === 'admin') {
      const appointments = await appointmentModel.getAllAppointments();
      return res.json(appointments);
    }

    res.status(403).json({ message: 'Role not allowed' });
  } catch (error) {
    next(error);
  }
};

const updateAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, time, status } = req.body;
    const appointment = await appointmentModel.findAppointmentById(id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (req.user.role === 'patient' && appointment.patient_id !== req.user.id) {
      return res.status(403).json({ message: 'Cannot modify this appointment' });
    }

    if (req.user.role === 'doctor') {
      const doctor = await doctorModel.findDoctorByUserId(req.user.id);
      if (!doctor || doctor.id !== appointment.doctor_id) {
        return res.status(403).json({ message: 'Cannot modify this appointment' });
      }
    }

    if (date && time) {
      const conflict = await appointmentModel.hasConflict({ doctor_id: appointment.doctor_id, date, time });
      if (conflict && (date !== appointment.date || time !== appointment.time)) {
        return res.status(409).json({ message: 'Selected time slot is already booked' });
      }
    }

    const updated = await appointmentModel.updateAppointment(id, {
      date: date || appointment.date,
      time: time || appointment.time,
      status: status || appointment.status
    });
    res.json({ message: 'Appointment updated', appointment: updated });
  } catch (error) {
    next(error);
  }
};

const deleteAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointment = await appointmentModel.findAppointmentById(id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (req.user.role === 'patient' && appointment.patient_id !== req.user.id) {
      return res.status(403).json({ message: 'Cannot delete this appointment' });
    }

    if (req.user.role === 'doctor') {
      const doctor = await doctorModel.findDoctorByUserId(req.user.id);
      if (!doctor || doctor.id !== appointment.doctor_id) {
        return res.status(403).json({ message: 'Cannot delete this appointment' });
      }
    }

    await appointmentModel.deleteAppointment(id);
    res.json({ message: 'Appointment removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createAppointment, listUserAppointments, updateAppointment, deleteAppointment };
