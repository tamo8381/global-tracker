const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    phone: {
        type: String,
        trim: true
    },
    position: {
        type: String,
        trim: true
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    country: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Country',
        required: true
    },
    city: {
        type: String,
        trim: true
    },
    department: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastActive: {
        type: Date
    },
    notes: {
        type: String,
        trim: true
    },
    photo: {
        type: String,
        trim: true
    },
    bio: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
personSchema.index({ firstName: 1, lastName: 1 });
personSchema.index({ email: 1 }, { unique: true });
personSchema.index({ company: 1 });
personSchema.index({ country: 1 });

// Virtual for full name
personSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Set JSON options to include virtuals
personSchema.set('toJSON', { virtuals: true });
personSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Person', personSchema);
