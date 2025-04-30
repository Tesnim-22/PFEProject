const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const LabResult = require('../models/LabResult');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'Backend/uploads/lab-results');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, JPEG and PNG files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Get all lab results for a specific patient
router.get('/patient/:patientId', auth, async (req, res) => {
    try {
        const labResults = await LabResult.find({ patientId: req.params.patientId })
            .sort({ date: -1 })
            .populate('labId', 'name address')
            .populate('appointmentId');
        res.json(labResults);
    } catch (error) {
        console.error('Error fetching lab results:', error);
        res.status(500).json({ message: 'Error fetching lab results', error: error.message });
    }
});

// Get a specific lab result
router.get('/:id', auth, async (req, res) => {
    try {
        const labResult = await LabResult.findById(req.params.id)
            .populate('labId', 'name address')
            .populate('appointmentId');
        if (!labResult) {
            return res.status(404).json({ message: 'Lab result not found' });
        }
        res.json(labResult);
    } catch (error) {
        console.error('Error fetching lab result:', error);
        res.status(500).json({ message: 'Error fetching lab result', error: error.message });
    }
});

// Create a new lab result
router.post('/', auth, upload.single('file'), async (req, res) => {
    try {
        const { patientId, testType, results, labId, appointmentId, status } = req.body;

        // Validate required fields
        if (!patientId || !testType || !labId) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ message: 'Les champs patientId, testType et labId sont obligatoires' });
        }

        const newLabResult = new LabResult({
            patientId,
            testType,
            results,
            labId,
            appointmentId,
            status: status || 'pending',
            date: new Date(),
            fileUrl: req.file ? req.file.path.replace('Backend/', '') : null
        });

        const savedLabResult = await newLabResult.save();
        const populatedResult = await LabResult.findById(savedLabResult._id)
            .populate('labId', 'name address')
            .populate('appointmentId');

        res.status(201).json({
            message: 'Résultats de laboratoire créés avec succès',
            labResult: populatedResult
        });
    } catch (error) {
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        console.error('Error creating lab result:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la création des résultats de laboratoire', 
            error: error.message 
        });
    }
});

// Update a lab result
router.put('/:id', auth, upload.single('file'), async (req, res) => {
    try {
        const labResult = await LabResult.findById(req.params.id);
        if (!labResult) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(404).json({ message: 'Lab result not found' });
        }

        // If there's a new file, delete the old one
        if (req.file && labResult.fileUrl) {
            try {
                fs.unlinkSync(labResult.fileUrl);
            } catch (err) {
                console.error('Error deleting old file:', err);
            }
        }

        const updateData = {
            ...req.body,
            fileUrl: req.file ? req.file.path : labResult.fileUrl
        };

        const updatedLabResult = await LabResult.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('labId', 'name address')
            .populate('appointmentId');

        res.json({
            message: 'Lab result updated successfully',
            labResult: updatedLabResult
        });
    } catch (error) {
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        console.error('Error updating lab result:', error);
        res.status(500).json({ message: 'Error updating lab result', error: error.message });
    }
});

// Delete a lab result
router.delete('/:id', auth, async (req, res) => {
    try {
        const labResult = await LabResult.findById(req.params.id);
        if (!labResult) {
            return res.status(404).json({ message: 'Lab result not found' });
        }

        // Delete associated file if it exists
        if (labResult.fileUrl) {
            try {
                fs.unlinkSync(labResult.fileUrl);
            } catch (err) {
                console.error('Error deleting file:', err);
            }
        }

        await LabResult.findByIdAndDelete(req.params.id);
        res.json({ message: 'Lab result deleted successfully' });
    } catch (error) {
        console.error('Error deleting lab result:', error);
        res.status(500).json({ message: 'Error deleting lab result', error: error.message });
    }
});

module.exports = router; 