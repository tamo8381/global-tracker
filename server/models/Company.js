const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    country: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Country',
        required: true
    },
    industry: {
        type: String,
        trim: true
    },
    website: {
        type: String,
        trim: true,
        lowercase: true
    },
    foundedYear: {
        type: Number,
        min: 1800,
        max: new Date().getFullYear()
    },
    employeeCount: {
        type: Number,
        min: 1
    },
    revenue: {
        amount: Number,
        currency: {
            type: String,
            default: 'USD'
        }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    ipAddresses: [{
        type: String,
        trim: true
    }],
    subdomains: [{
        type: String,
        trim: true,
        lowercase: true
    }],
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
companySchema.index({ name: 1 });
companySchema.index({ country: 1 });
companySchema.index({ industry: 1 });

// Virtual for person count
companySchema.virtual('personCount', {
    ref: 'Person',
    localField: '_id',
    foreignField: 'company',
    count: true
});

// Virtual for IP count
companySchema.virtual('ipCount').get(function() {
    return this.ipAddresses ? this.ipAddresses.length : 0;
});

// Virtual for subdomain count
companySchema.virtual('subdomainCount').get(function() {
    return this.subdomains ? this.subdomains.length : 0;
});

// Virtual for people list (allows populate('people'))
companySchema.virtual('people', {
    ref: 'Person',
    localField: '_id',
    foreignField: 'company',
    justOne: false
});

// Set JSON options to include virtuals
companySchema.set('toJSON', { virtuals: true });
companySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Company', companySchema);
