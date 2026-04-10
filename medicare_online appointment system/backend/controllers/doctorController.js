const doctorModel = require('../models/doctorModel');
const appointmentModel = require('../models/appointmentModel');

const listDoctors = async (req, res, next) => {
  try {
    const specialization = req.query.specialization || '';
    const doctors = await doctorModel.getApprovedDoctors();
    const filtered = doctors.filter((doc) =>
      doc.specialization.toLowerCase().includes(specialization.toLowerCase())
    );
    res.json(filtered);
  } catch (error) {
    next(error);
  }
};

const getDoctorProfile = async (req, res, next) => {
  try {
    const doctor = await doctorModel.findDoctorByUserId(req.user.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });
    res.json(doctor);
  } catch (error) {
    next(error);
  }
};

const updateAvailability = async (req, res, next) => {
  try {
    const doctor = await doctorModel.findDoctorByUserId(req.user.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    const { availability } = req.body;
    const updated = await doctorModel.updateAvailability(doctor.id, availability || '');
    res.json({ message: 'Availability updated', doctor: updated });
  } catch (error) {
    next(error);
  }
};

const getAssignedAppointments = async (req, res, next) => {
  try {
    const doctor = await doctorModel.findDoctorByUserId(req.user.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    const appointments = await appointmentModel.findAppointmentsByDoctor(doctor.id);
    res.json(appointments);
  } catch (error) {
    next(error);
  }
};

const acceptRejectAppointment = async (req, res, next) => {
  try {
    const doctor = await doctorModel.findDoctorByUserId(req.user.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    const { id } = req.params;
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const appointment = await appointmentModel.findAppointmentById(id);
    if (!appointment || appointment.doctor_id !== doctor.id) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    const updated = await appointmentModel.updateAppointmentStatus(id, status);
    res.json({ message: 'Appointment updated', appointment: updated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listDoctors,
  getDoctorProfile,
  updateAvailability,
  getAssignedAppointments,
  acceptRejectAppointment
};
