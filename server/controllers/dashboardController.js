const Country = require('../models/Country');
const Company = require('../models/Company');
const Person = require('../models/Person');
const Activity = require('../models/Activity');

// Get dashboard statistics (fully dynamic)
exports.getDashboardStats = async (req, res) => {
    try {
        const [
            totalCountries,
            totalCompanies,
            totalPeople,
            activeTracking,
            companiesByCountry,
            peopleByCompany,
            allCompanies
        ] = await Promise.all([
            Country.countDocuments(),
            Company.countDocuments(),
            Person.countDocuments(),
            Person.countDocuments({ isActive: true }),
            Company.aggregate([
                { $group: { _id: '$country', count: { $sum: 1 } } },
                { $group: { _id: null, avg: { $avg: '$count' } } }
            ]),
            Company.aggregate([
                { $lookup: { from: 'people', localField: '_id', foreignField: 'company', as: 'employees' } },
                { $project: { employeeCount: { $size: '$employees' } } },
                { $group: { _id: null, avgPeoplePerCompany: { $avg: '$employeeCount' } } }
            ]),
            Company.find({}, 'ipAddresses subdomains createdAt')
        ]);

        const totalIPs = allCompanies.reduce((acc, company) => acc + (company.ipAddresses?.length || 0), 0);
        const totalSubdomains = allCompanies.reduce((acc, company) => acc + (company.subdomains?.length || 0), 0);
        const avgCompaniesPerCountry = companiesByCountry[0]?.avg || 0;
        const avgPeoplePerCompany = peopleByCompany[0]?.avgPeoplePerCompany || 0;

        // Build growth data for the last 6 months for companies and people
        const monthsBack = 6;
        const now = new Date();

        // Helper to get YYYY-MM label
        const labelFor = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

        // Build date boundaries array
        const boundaries = [];
        for (let i = monthsBack - 1; i >= 0; i--) {
            const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
            const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
            boundaries.push({ label: labelFor(d), from: d, to: next });
        }

        const [companiesMonthly, peopleMonthly] = await Promise.all([
            Promise.all(boundaries.map(async ({ label, from, to }) => ({
                label,
                count: await Company.countDocuments({ createdAt: { $gte: from, $lt: to } })
            })) ),
            Promise.all(boundaries.map(async ({ label, from, to }) => ({
                label,
                count: await Person.countDocuments({ createdAt: { $gte: from, $lt: to } })
            })) )
        ]);

        const growth = boundaries.map(({ label }, idx) => ({
            name: label,
            companies: companiesMonthly[idx].count,
            people: peopleMonthly[idx].count
        }));

        // Distribution by region: companies grouped by countries.region
        const regionAgg = await Company.aggregate([
            { $lookup: { from: 'countries', localField: 'country', foreignField: '_id', as: 'countryDoc' } },
            { $unwind: '$countryDoc' },
            { $group: { _id: '$countryDoc.region', value: { $sum: 1 } } },
            { $project: { _id: 0, name: { $ifNull: ['$_id', 'Unspecified'] }, value: 1 } },
            { $sort: { value: -1 } }
        ]);

        res.json({
            success: true,
            data: {
                totalCountries,
                totalCompanies,
                totalPeople,
                activeTracking,
                quickStats: {
                    avgCompaniesPerCountry: parseFloat(avgCompaniesPerCountry.toFixed(2)),
                    avgPeoplePerCompany: parseFloat(avgPeoplePerCompany.toFixed(2)),
                    totalIPs,
                    totalSubdomains
                },
                charts: {
                    growth,
                    regionDistribution: regionAgg
                }
            }
        });
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Get system overview
exports.getSystemOverview = async (req, res) => {
    try {
        const [
            dbStats,
            totalEntities,
            infrastructureItems
        ] = await Promise.all([
            // This is a simplified version. In a real app, you might want to get actual DB stats
            { collections: 4, documents: await Company.countDocuments() + await Person.countDocuments() },
            {
                countries: await Country.countDocuments(),
                companies: await Company.countDocuments(),
                people: await Person.countDocuments()
            },
            {
                servers: 1, // Assuming single server for now
                services: ['API', 'Database', 'Authentication'],
                uptime: process.uptime()
            }
        ]);

        res.json({
            success: true,
            data: {
                database: dbStats,
                totalEntities,
                infrastructure: infrastructureItems
            }
        });
    } catch (error) {
        console.error('Error getting system overview:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// Get recent activities (dynamic approximation using latest created documents)
exports.getRecentActivities = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 10; // default 10
        const typesFilter = req.query.types ? String(req.query.types).split(',').map(t => t.trim()) : null;

        // Try to load manually created activities first (admin can add/manage)
        const query = { visible: true };
        if (typesFilter && typesFilter.length) {
            query.type = { $in: typesFilter };
        }

        let activities = await Activity.find(query).sort({ priority: -1, timestamp: -1 }).limit(limit).lean();

        // If no manual activities exist, fall back to auto-generated recent items
        if (!activities || activities.length === 0) {
            const [recentCompanies, recentPeople, recentCountries] = await Promise.all([
                Company.find().sort({ createdAt: -1 }).limit(limit).select('name createdAt'),
                Person.find().sort({ createdAt: -1 }).limit(limit).select('firstName lastName createdAt'),
                Country.find().sort({ createdAt: -1 }).limit(limit).select('name createdAt')
            ]);

            activities = [
                ...recentCompanies.map(c => ({ type: 'company:create', user: 'system', timestamp: c.createdAt, details: `Created company: ${c.name}`, priority: 0 })),
                ...recentPeople.map(p => ({ type: 'person:create', user: 'system', timestamp: p.createdAt, details: `Created person: ${p.firstName} ${p.lastName}`, priority: 0 })),
                ...recentCountries.map(c => ({ type: 'country:create', user: 'system', timestamp: c.createdAt, details: `Created country: ${c.name}`, priority: 0 })),
            ].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
        }

        res.json({ success: true, data: activities });
    } catch (error) {
        console.error('Error getting recent activities:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};
