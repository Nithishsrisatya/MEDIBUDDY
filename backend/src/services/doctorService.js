const User = require('../models/user.model');
const Appointment = require('../models/appointment.model');

class DoctorService {
    // Get all doctors with optional filtering
    static async getAllDoctors(filters = {}) {
        try {
            const { specialization, name } = filters;
            let query = { role: 'doctor' };

            if (specialization) {
                query.specialization = new RegExp(specialization, 'i');
            }

            if (name) {
                query.name = new RegExp(name, 'i');
            }

            const doctors = await User.find(query)
                .select('name specialization qualification experience availability')
                .sort('name');

            return doctors;
        } catch (error) {
            throw new Error(`Error fetching doctors: ${error.message}`);
        }
    }

    // Get doctor by ID
    static async getDoctorById(doctorId) {
        try {
            const doctor = await User.findOne({
                _id: doctorId,
                role: 'doctor'
            }).select('-password');

            if (!doctor) {
                throw new Error('Doctor not found');
            }

            return doctor;
        } catch (error) {
            throw new Error(`Error fetching doctor: ${error.message}`);
        }
    }

    // Update doctor availability
    static async updateDoctorAvailability(doctorId, availability) {
        try {
            if (!Array.isArray(availability)) {
                throw new Error('Availability must be an array');
            }

            // Validate each availability slot
            for (const slot of availability) {
                if (!slot.day || !slot.startTime || !slot.endTime) {
                    throw new Error('Each availability slot must have day, startTime, and endTime');
                }
            }

            const doctor = await User.findOneAndUpdate(
                {
                    _id: doctorId,
                    role: 'doctor'
                },
                { availability },
                { new: true }
            ).select('-password');

            if (!doctor) {
                throw new Error('Doctor not found');
            }

            return doctor;
        } catch (error) {
            throw new Error(`Error updating doctor availability: ${error.message}`);
        }
    }

    // Get doctor's statistics
    static async getDoctorStats(doctorId) {
        try {
            const doctor = await User.findOne({
                _id: doctorId,
                role: 'doctor'
            });

            if (!doctor) {
                throw new Error('Doctor not found');
            }

            // Get appointment statistics for current month
            const today = new Date();
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

            const stats = await Appointment.aggregate([
                {
                    $match: {
                        doctor: doctor._id,
                        dateTime: { $gte: startOfMonth }
                    }
                },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);

            return stats;
        } catch (error) {
            throw new Error(`Error fetching doctor statistics: ${error.message}`);
        }
    }

    // Get doctor's profile with stats
    static async getDoctorProfile(doctorId) {
        try {
            const doctor = await this.getDoctorById(doctorId);
            const stats = await this.getDoctorStats(doctorId);

            return {
                ...doctor.toObject(),
                stats
            };
        } catch (error) {
            throw new Error(`Error fetching doctor profile: ${error.message}`);
        }
    }

    // Search doctors
    static async searchDoctors(searchTerm = '', limit = 10) {
        try {
            let query = { role: 'doctor' };

            if (searchTerm) {
                query.$or = [
                    { name: new RegExp(searchTerm, 'i') },
                    { specialization: new RegExp(searchTerm, 'i') }
                ];
            }

            const doctors = await User.find(query)
                .select('name specialization qualification experience')
                .limit(limit)
                .sort('name');

            return doctors;
        } catch (error) {
            throw new Error(`Error searching doctors: ${error.message}`);
        }
    }

    // Set sample availability for all doctors
    static async setSampleAvailability(sampleAvailability) {
        try {
            const result = await User.updateMany(
                { role: 'doctor' },
                { $set: { availability: sampleAvailability } }
            );

            return result;
        } catch (error) {
            throw new Error(`Error setting sample availability: ${error.message}`);
        }
    }

    // Update doctor's online status
    static async updateDoctorOnlineStatus(doctorId, online) {
        try {
            const doctor = await User.findOneAndUpdate(
                {
                    _id: doctorId,
                    role: 'doctor'
                },
                { online },
                { new: true }
            ).select('-password');

            if (!doctor) {
                throw new Error('Doctor not found');
            }

            return doctor;
        } catch (error) {
            throw new Error(`Error updating doctor online status: ${error.message}`);
        }
    }
}

module.exports = DoctorService;
