const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['patient', 'doctor', 'admin'],
        default: 'patient'
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String
    },
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other']
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    profilePicture: {
        type: String
    },
    medicalHistory: {
        type: String
    },
    // Additional fields for doctors
    specialization: {
        type: String,
        required: function() { return this.role === 'doctor'; }
    },
    qualification: {
        type: String,
        required: function() { return this.role === 'doctor'; }
    },
    experience: {
        type: Number,
        required: function() { return this.role === 'doctor'; }
    },
    clinicName: {
        type: String,
        required: function() { return this.role === 'doctor'; }
    },
    consultationFee: {
        type: Number,
        required: function() { return this.role === 'doctor'; }
    },
    availability: [{
        day: {
            type: String,
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            required: true
        },
        startTime: {
            type: String,
            required: true
        },
        endTime: {
            type: String,
            required: true
        }
    }],
    location: {
        type: {
            city: String,
            state: String,
            country: String,
            pincode: String
        },
        required: false
    },
    languages: {
        type: [String],
        default: [],
        required: function() { return this.role === 'doctor'; }
    },
    rating: {
        type: Number,
        default: 0
    },
    reviews: [{
        patientId: mongoose.Schema.Types.ObjectId,
        comment: String,
        stars: Number
    }],
    emergencyContact: {
        type: String
    },
    videoConsultation: {
        type: Boolean,
        default: false
    },
    verified: {
        type: Boolean,
        default: false
    },
    certificates: {
        type: [String],
        default: []
    },
    specialAchievements: {
        type: [String],
        default: []
    },
    licenseNumber: {
        type: String
    },
    bio: {
        type: String,
        required: function() { return this.role === 'doctor'; }
    },
    online: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 