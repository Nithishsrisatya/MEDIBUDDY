const User = require('../models/user.model');
const Appointment = require('../models/appointment.model');

class PatientService {
    // Get patient records for a doctor
    static async getDoctorPatients(doctorId) {
        try {
            // Find distinct patients from completed appointments
            const patientIds = await Appointment.distinct('patient', {
                doctor: doctorId,
                status: 'completed'
            });

            const patients = await User.find({
                _id: { $in: patientIds }
            }).select('name email');

            return patients;
        } catch (error) {
            throw new Error(`Error fetching doctor patients: ${error.message}`);
        }
    }

    // Get patient by ID
    static async getPatientById(patientId) {
        try {
            const patient = await User.findOne({
                _id: patientId,
                role: 'patient'
            }).select('-password');

            if (!patient) {
                throw new Error('Patient not found');
            }

            return patient;
        } catch (error) {
            throw new Error(`Error fetching patient: ${error.message}`);
        }
    }

    // Get patient's appointment history
    static async getPatientAppointmentHistory(patientId) {
        try {
            const appointments = await Appointment.find({
                patient: patientId
            })
            .populate('doctor', 'name specialization')
            .sort({ dateTime: -1 });

            return appointments;
        } catch (error) {
            throw new Error(`Error fetching patient appointment history: ${error.message}`);
        }
    }

    // Get patient's upcoming appointments
    static async getPatientUpcomingAppointments(patientId) {
        try {
            const now = new Date();

            const appointments = await Appointment.find({
                patient: patientId,
                dateTime: { $gte: now },
                status: 'scheduled'
            })
            .populate('doctor', 'name specialization')
            .sort('dateTime');

            return appointments;
        } catch (error) {
            throw new Error(`Error fetching patient upcoming appointments: ${error.message}`);
        }
    }

    // Search patients (for admin or doctor)
    static async searchPatients(searchTerm = '', limit = 10) {
        try {
            let query = { role: 'patient' };

            if (searchTerm) {
                query.$or = [
                    { name: new RegExp(searchTerm, 'i') },
                    { email: new RegExp(searchTerm, 'i') }
                ];
            }

            const patients = await User.find(query)
                .select('name email')
                .limit(limit)
                .sort('name');

            return patients;
        } catch (error) {
            throw new Error(`Error searching patients: ${error.message}`);
        }
    }
}

module.exports = PatientService;
