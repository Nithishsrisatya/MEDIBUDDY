const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    dateTime: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
        default: 'scheduled'
    },
    type: {
        type: String,
        enum: ['in-person', 'video-consultation'],
        required: true
    },
    symptoms: {
        type: String,
        required: true
    },
    diagnosis: {
        type: String
    },
    prescription: {
        type: String
    },
    notes: {
        type: String
    },
    followUp: {
        type: Date
    },
    duration: {
        type: Number,
        default: 30, // duration in minutes
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'refunded'],
        default: 'pending'
    },
    paymentAmount: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

// Index for efficient querying
appointmentSchema.index({ patient: 1, dateTime: 1 });
appointmentSchema.index({ doctor: 1, dateTime: 1 });

// Virtual for checking if appointment is past
appointmentSchema.virtual('isPast').get(function() {
    return this.dateTime < new Date();
});

// Method to check if appointment can be cancelled
appointmentSchema.methods.canBeCancelled = function() {
    const now = new Date();
    const appointmentTime = new Date(this.dateTime);
    const hoursDifference = (appointmentTime - now) / (1000 * 60 * 60);
    
    return hoursDifference >= 24 && this.status === 'scheduled';
};

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment; 