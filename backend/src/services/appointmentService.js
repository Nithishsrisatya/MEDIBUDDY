const Appointment = require('../models/appointment.model');
const User = require('../models/user.model');

class AppointmentService {
    // Fetch doctor's upcoming appointments
    static async getDoctorUpcomingAppointments(doctorId) {
        try {
            const now = new Date();

            const appointments = await Appointment.find({
                doctor: doctorId,
                dateTime: { $gte: now },
                status: 'scheduled'
            })
            .populate('patient', 'name email')
            .sort('dateTime');

            return appointments;
        } catch (error) {
            throw new Error(`Error fetching doctor's upcoming appointments: ${error.message}`);
        }
    }

    // Update appointment status
    static async updateAppointmentStatus(appointmentId, status, userId, userRole) {
        try {
            const appointment = await Appointment.findById(appointmentId);

            if (!appointment) {
                throw new Error('Appointment not found');
            }

            // Check if user has permission to update
            if (
                userRole !== 'admin' &&
                appointment.doctor.toString() !== userId.toString() &&
                appointment.patient.toString() !== userId.toString()
            ) {
                throw new Error('Not authorized to update this appointment');
            }

            // Validate status change
            if (status === 'cancelled' && !appointment.canBeCancelled()) {
                throw new Error('Cannot cancel appointment less than 24 hours before scheduled time');
            }

            appointment.status = status;
            await appointment.save();

            return appointment;
        } catch (error) {
            throw new Error(`Error updating appointment status: ${error.message}`);
        }
    }

    // Get user's appointments (for both doctors and patients)
    static async getUserAppointments(userId, userRole) {
        try {
            const appointments = await Appointment.find({
                [userRole === 'doctor' ? 'doctor' : 'patient']: userId
            })
            .populate('doctor', 'name specialization')
            .populate('patient', 'name')
            .sort({ dateTime: -1 });

            return appointments;
        } catch (error) {
            throw new Error(`Error fetching user appointments: ${error.message}`);
        }
    }

    // Get doctor's availability
    static async getDoctorAvailability(doctorId) {
        try {
            const doctor = await User.findOne({
                _id: doctorId,
                role: 'doctor'
            });

            if (!doctor) {
                throw new Error('Doctor not found');
            }

            // Get booked appointments for next 7 days
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 7);

            const bookedSlots = await Appointment.find({
                doctor: doctorId,
                dateTime: { $gte: startDate, $lte: endDate },
                status: 'scheduled'
            }).select('dateTime duration');

            return {
                availability: doctor.availability,
                bookedSlots
            };
        } catch (error) {
            throw new Error(`Error fetching doctor availability: ${error.message}`);
        }
    }

    // Create new appointment
    static async createAppointment(appointmentData, patientId) {
        try {
            const doctor = await User.findOne({ _id: appointmentData.doctor, role: 'doctor' });
            if (!doctor) {
                throw new Error('Doctor not found');
            }

            // Check for existing appointments at the same time
            const existingAppointment = await Appointment.findOne({
                doctor: appointmentData.doctor,
                dateTime: appointmentData.dateTime,
                status: 'scheduled'
            });

            if (existingAppointment) {
                throw new Error('This time slot is already booked');
            }

            const appointment = new Appointment({
                ...appointmentData,
                patient: patientId
            });

            await appointment.save();
            return appointment;
        } catch (error) {
            throw new Error(`Error creating appointment: ${error.message}`);
        }
    }
}

module.exports = AppointmentService;
