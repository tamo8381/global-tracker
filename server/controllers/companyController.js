const Company = require('../models/Company');
const Person = require('../models/Person');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

// Escape user input used in regex to avoid ReDoS / NoSQL-style injections
const escapeRegex = (str) => {
  if (!str || typeof str !== 'string') return '';
  const maxLen = 100;
  const s = str.slice(0, maxLen);
  return s.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
};

// @desc    Get all companies
// @route   GET /api/companies
// @access  Public
exports.getCompanies = async (req, res) => {
    try {
        const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc', search = '' } = req.query;
        
        // Build query
        const query = {};
        
        // Search functionality (escape input to mitigate ReDoS/NoSQL injection)
        if (search) {
            const safeSearch = escapeRegex(search);
            if (safeSearch) {
              query.$or = [
                { name: { $regex: safeSearch, $options: 'i' } },
                { industry: { $regex: safeSearch, $options: 'i' } },
                { 'ipAddresses': { $in: [safeSearch] } },
                { 'subdomains': { $in: [safeSearch] } }
              ];
            }
        }
        
        // Execute query with pagination
        const companies = await Company.find(query)
            .populate('country', 'name code')
            .populate('personCount')
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();
            
        // Get total count for pagination
        const count = await Company.countDocuments(query);
        
        res.json({
            success: true,
            pagination: {
                total: count,
                totalPages: Math.ceil(count / limit),
                currentPage: page,
                pageSize: limit
            },
            data: companies
        });
    } catch (error) {
        console.error('Error getting companies:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    Get single company
// @route   GET /api/companies/:id
// @access  Public
exports.getCompany = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id)
            .populate('country', 'name code')
            .populate('personCount')
            .populate({
                path: 'people',
                select: 'firstName lastName email position isActive photo',
                options: { sort: { lastName: 1, firstName: 1 } }
            });
            
        if (!company) {
            return res.status(404).json({
                success: false,
                error: 'Company not found'
            });
        }

        res.json({
            success: true,
            data: company
        });
    } catch (error) {
        console.error('Error getting company:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    Create company
// @route   POST /api/companies
// @access  Private/Admin
exports.createCompany = async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        const { 
            name, 
            country, 
            industry, 
            website, 
            foundedYear, 
            revenue,
            ipAddresses = [],
            subdomains = []
        } = req.body;

        // Check if company already exists
        let company = await Company.findOne({ name });
        
        if (company) {
            return res.status(400).json({
                success: false,
                error: 'Company with this name already exists'
            });
        }

        // Create new company
        company = new Company({
            name,
            country,
            industry,
            website,
            foundedYear,
            revenue,
            ipAddresses: Array.isArray(ipAddresses) ? ipAddresses : [ipAddresses],
            subdomains: Array.isArray(subdomains) ? subdomains : [subdomains]
        });

        await company.save();

        // Populate country data in the response
        await company.populate({ path: 'country', select: 'name code' });

        res.status(201).json({
            success: true,
            data: company
        });
    } catch (error) {
        console.error('Error creating company:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    Update company
// @route   PUT /api/companies/:id
// @access  Private/Admin
exports.updateCompany = async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }

    try {
        let company = await Company.findById(req.params.id);
        
        if (!company) {
            return res.status(404).json({
                success: false,
                error: 'Company not found'
            });
        }

        // Check if another company exists with the same name
        if (req.body.name) {
            const existingCompany = await Company.findOne({
                _id: { $ne: req.params.id },
                name: req.body.name
            });

            if (existingCompany) {
                return res.status(400).json({
                    success: false,
                    error: 'Another company with this name already exists'
                });
            }
        }

        // Update fields
        const updates = {};
        
        // Only update fields that are actually passed in the request
        const allowedUpdates = [
            'name', 'country', 'industry', 'website', 'foundedYear', 
            'revenue', 'isActive'
        ];
        
        allowedUpdates.forEach(update => {
            if (req.body[update] !== undefined) {
                updates[update] = req.body[update];
            }
        });
        
        // Apply updates
        company = await Company.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true }
        ).populate('country', 'name code');

        res.json({
            success: true,
            data: company
        });
    } catch (error) {
        console.error('Error updating company:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    Delete company
// @route   DELETE /api/companies/:id
// @access  Private/Admin
exports.deleteCompany = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        
        if (!company) {
            return res.status(404).json({
                success: false,
                error: 'Company not found'
            });
        }

        // Check if there are people associated with this company
        const personCount = await Person.countDocuments({ company: req.params.id });
        
        if (personCount > 0) {
            return res.status(400).json({
                success: false,
                error: `Cannot delete company with ${personCount} people associated`
            });
        }

        await company.remove();

        res.json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    Get people by company
// @route   GET /api/companies/:id/people
// @access  Public
exports.getCompanyPeople = async (req, res) => {
    try {
        const people = await Person.find({ company: req.params.id })
            .select('firstName lastName email position isActive photo')
            .sort('lastName firstName');

        res.json({
            success: true,
            count: people.length,
            data: people
        });
    } catch (error) {
        console.error('Error getting people by company:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    Add IP address to company
// @route   POST /api/companies/:id/ips
// @access  Private/Admin
exports.addIpAddress = async (req, res) => {
    try {
        const { ipAddress } = req.body;
        
        if (!ipAddress) {
            return res.status(400).json({
                success: false,
                error: 'IP address is required'
            });
        }
        
        const company = await Company.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { ipAddresses: ipAddress } },
            { new: true, runValidators: true }
        );
        
        if (!company) {
            return res.status(404).json({
                success: false,
                error: 'Company not found'
            });
        }
        
        res.json({
            success: true,
            data: company.ipAddresses
        });
    } catch (error) {
        console.error('Error adding IP address:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    Remove IP address from company
// @route   DELETE /api/companies/:id/ips/:ip
// @access  Private/Admin
exports.removeIpAddress = async (req, res) => {
    try {
        const company = await Company.findByIdAndUpdate(
            req.params.id,
            { $pull: { ipAddresses: req.params.ip } },
            { new: true }
        );
        
        if (!company) {
            return res.status(404).json({
                success: false,
                error: 'Company not found'
            });
        }
        
        res.json({
            success: true,
            data: company.ipAddresses
        });
    } catch (error) {
        console.error('Error removing IP address:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    Add subdomain to company
// @route   POST /api/companies/:id/subdomains
// @access  Private/Admin
exports.addSubdomain = async (req, res) => {
    try {
        const { subdomain } = req.body;
        
        if (!subdomain) {
            return res.status(400).json({
                success: false,
                error: 'Subdomain is required'
            });
        }
        
        const company = await Company.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { subdomains: subdomain.toLowerCase() } },
            { new: true, runValidators: true }
        );
        
        if (!company) {
            return res.status(404).json({
                success: false,
                error: 'Company not found'
            });
        }
        
        res.json({
            success: true,
            data: company.subdomains
        });
    } catch (error) {
        console.error('Error adding subdomain:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    Remove subdomain from company
// @route   DELETE /api/companies/:id/subdomains/:subdomain
// @access  Private/Admin
exports.removeSubdomain = async (req, res) => {
    try {
        const company = await Company.findByIdAndUpdate(
            req.params.id,
            { $pull: { subdomains: req.params.subdomain.toLowerCase() } },
            { new: true }
        );
        
        if (!company) {
            return res.status(404).json({
                success: false,
                error: 'Company not found'
            });
        }
        
        res.json({
            success: true,
            data: company.subdomains
        });
    } catch (error) {
        console.error('Error removing subdomain:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

// @desc    Export people for a company (JSON or CSV)
// @route   GET /api/companies/:id/export?format=json|csv
// @access  Private/Admin
exports.exportPeople = async (req, res) => {
  try {
    const format = (req.query.format || 'json').toLowerCase();
    const people = await Person.find({ company: req.params.id })
      .select('firstName lastName email phone position isActive photo updatedAt')
      .populate('company', 'name')
      .populate('country', 'name');

    // If PDF requested, generate server-side PDF and stream it back
    if (format === 'pdf') {
      const companyDoc = await Company.findById(req.params.id).populate('country', 'name');
      const uploadDir = process.env.FILE_UPLOAD_PATH || path.join(__dirname, '..', 'public', 'uploads');

      const safeName = (companyDoc?.name || 'company').replace(/\s+/g, '_');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}_people.pdf"`);

      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      doc.pipe(res);

      // Header
      doc.font('Helvetica-Bold').fontSize(22).fillColor('#000').text(companyDoc?.name || safeName, 50, doc.y);
      // subtle rule under title
      doc.moveTo(50, doc.y + 6).lineTo(550, doc.y + 6).strokeColor('#e9e9e9').lineWidth(1).stroke();
      doc.moveDown(1);
      
      // Two-column layout for country and website for improved readability
      doc.font('Helvetica').fontSize(10).fillColor('#000');
      const leftColX = 50;
      const rightColX = 320;
      const infoY = doc.y;
      doc.text(`Country: ${companyDoc?.country?.name || 'N/A'}`, leftColX, infoY);
      doc.text(`Website: ${companyDoc?.website || 'N/A'}`, rightColX, infoY);
      doc.moveDown(1);
      
      // Slight separation before the lists
      doc.moveDown(0.2);

            // IP Addresses (render into two columns for readability)
            doc.fontSize(10).text('IP Addresses:');
            if (Array.isArray(companyDoc?.ipAddresses) && companyDoc.ipAddresses.length) {
                const ips = companyDoc.ipAddresses;
                const half = Math.ceil(ips.length / 2);
                const left = ips.slice(0, half);
                const right = ips.slice(half);
                const startY = doc.y + 4;
                const leftX = 50;
                const rightX = 300;
                const lineHeight = 12;
                for (let i = 0; i < Math.max(left.length, right.length); i++) {
                    const ly = startY + i * lineHeight;
                    if (left[i]) doc.text(`• ${left[i]}`, leftX, ly);
                    if (right[i]) doc.text(`• ${right[i]}`, rightX, ly);
                }
                doc.moveDown(0.5);
            } else {
                doc.text('N/A', { indent: 12 });
            }

            // Subdomains (render into two columns)
            doc.fontSize(10).text('Subdomains:');
            if (Array.isArray(companyDoc?.subdomains) && companyDoc.subdomains.length) {
                const subs = companyDoc.subdomains;
                const half = Math.ceil(subs.length / 2);
                const left = subs.slice(0, half);
                const right = subs.slice(half);
                const startY = doc.y + 4;
                const leftX = 50;
                const rightX = 300;
                const lineHeight = 12;
                for (let i = 0; i < Math.max(left.length, right.length); i++) {
                    const ly = startY + i * lineHeight;
                    if (left[i]) doc.text(`• ${left[i]}`, leftX, ly);
                    if (right[i]) doc.text(`• ${right[i]}`, rightX, ly);
                }
                doc.moveDown(0.7);
            } else {
                doc.text('N/A', { indent: 12 });
            }
      doc.moveDown(0.7);
      
      // Table header
      doc.fontSize(12);
      const tableTop = doc.y + 10;
      doc.font('Helvetica-Bold').text('Photo', 50, tableTop);
      doc.text('Name', 150, tableTop);
      doc.text('Email', 320, tableTop);
      doc.text('Position', 460, tableTop);
      doc.font('Helvetica');
      // draw separator
      doc.moveTo(50, doc.y + 6).lineTo(550, doc.y + 6).strokeColor('#e0e0e0').lineWidth(0.5).stroke();
      doc.moveDown();

      const imgSize = 50;
      const rowHeight = 70;
      let y = doc.y + 4;

      for (const p of people) {
        if (y > doc.page.height - 100) {
          doc.addPage();
          y = doc.y;
        }

        // Draw photo or initials
        const initials = ((p.firstName || '').charAt(0) + (p.lastName || '').charAt(0)).toUpperCase();
        let imgDrawn = false;
        if (p.photo) {
          try {
            const photoPath = path.join(uploadDir, p.photo);
            if (fs.existsSync(photoPath)) {
              // Draw image (fit into 50x50)
              doc.image(photoPath, 50, y, { width: imgSize, height: imgSize, align: 'center', valign: 'center' });
              imgDrawn = true;
            }
          } catch (e) {
            // ignore image errors and fall back to initials
            console.warn('Failed to draw image for PDF:', p.photo, e);
          }
        }

        if (!imgDrawn) {
          // Draw a gray circle with initials (50x50)
          const cx = 50 + imgSize / 2; // center x
          const cy = y + imgSize / 2; // center y
          const radius = imgSize / 2;
          doc.circle(cx, cy, radius).fill('#e0e0e0');
          doc.fillColor('#000').fontSize(12).text(initials, 50, y + (imgSize / 2) - 8, { width: imgSize, align: 'center' });
          doc.fillColor('#000');
        }

        // subtle row border/background to improve readability
        doc.strokeColor('#f0f0f0').lineWidth(0.5).rect(48, y - 4, 500, rowHeight - 8).stroke();

        // Text columns
        doc.fontSize(11).text(`${p.firstName || ''} ${p.lastName || ''}`, 150, y + 5);
        doc.fontSize(10).text(p.email || '', 320, y + 5);
        doc.fontSize(10).text(p.position || '', 460, y + 5);

        y += rowHeight;
      }

      doc.end();
      return; // response already piped
    }

    if (format === 'csv') {
      const headers = ['First Name','Last Name','Email','Phone','Position','Company','Country','City','Active'];
      const escapeField = (field) => {
        const str = String(field ?? '');
        if (/[\",\n,]/.test(str)) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      const rows = people.map(p => [
        p.firstName || '',
        p.lastName || '',
        p.email || '',
        p.phone || '',
        p.position || '',
        p.company?.name || '',
        p.country?.name || '',
        p.city || '',
        p.isActive ? 'Yes' : 'No'
      ]);
      const csvContent = [headers, ...rows].map(r => r.map(escapeField).join(',')).join('\n');

      const safeName = (people.length && people[0].company?.name) ? people[0].company.name.replace(/\s+/g, '_') : 'company';
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}_people.csv"`);
      return res.send(csvContent);
    }

    // default to json
    res.json({ success: true, data: people });
  } catch (error) {
    console.error('Error exporting company people:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};
