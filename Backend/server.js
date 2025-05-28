const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { generateToken } = require('./config/jwt');
const auth = require('./middlewares/auth');

// ❗ Correction ici
const Appointment = require('./models/Appointment');
const Notification = require('./models/Notification');
const AdminNotification = require('./models/AdminNotification');
const Patient = require('./models/Patient');
const Message = require('./models/Message');
const LabResult = require('./models/LabResult');
const LabDoctorMessage = require('./models/LabDoctorMessage');
const HospitalAppointment = require('./models/HospitalAppointment');
const AmbulanceReport = require('./models/AmbulanceReport');
const Vehicle = require('./models/Vehicle');
const Article = require('./models/Article');
const Comment = require('./models/Comment');
const MedicalReport = require('./models/MedicalReport');

// Configuration CORS
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Enable pre-flight for all routes
app.options('*', cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

// middlewares
app.use(express.json());

// Configurer les dossiers statiques
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/lab-results', express.static(path.join(__dirname, 'uploads', 'lab-results')));

// 🟰 Tu pourras ensuite continuer ici avec ta logique MongoDB, schemas, etc.


// Middleware



// Configurer le dossier d'upload
const uploadFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder);
}

const articlesUploadFolder = path.join(__dirname, 'uploads', 'articles');
if (!fs.existsSync(articlesUploadFolder)) {
    fs.mkdirSync(articlesUploadFolder, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadFolder);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `patient_${Date.now()}${ext}`);
    }
});

const upload = multer({ storage });

// Configuration pour les documents médicaux
const medicalDocsStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const path = './uploads/medical-docs';
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
        }
        cb(null, path);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'medical-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadMedicalDoc = multer({
    storage: medicalDocsStorage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Format de fichier non supporté. Utilisez PDF, JPEG ou PNG.'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
});

// Configuration pour les résultats de laboratoire
const labResultsStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const path = './uploads/lab-results';
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path, { recursive: true });
        }
        cb(null, path);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = file.originalname.split('.').pop();
        cb(null, `lab-result-${uniqueSuffix}.${ext}`);
    }
});

const uploadLabResult = multer({
    storage: labResultsStorage,
    fileFilter: (req, file, cb) => {
        console.log('File received:', file);
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Format de fichier non supporté. Utilisez PDF, JPEG ou PNG.'));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
});

// Configuration Cloudinary
cloudinary.config({
  cloud_name: 'dish7tzta',
  api_key: '549348789473747',
  api_secret: 'xdI6JvS3okVXI2W_djbRw0HOqkA'
});

// Nouveau storage pour les articles
const storageArticles = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'articles',
    allowed_formats: ['jpg', 'png', 'jpeg']
  }
});

// Modifier la configuration multer pour utiliser Cloudinary
const uploadArticleImage = multer({ storage: storageArticles });

// MongoDB Connection String
const uri = "mongodb+srv://tesnim:Tesnim.123456789@cluster0.50qhu.mongodb.net/HealthApp?retryWrites=true&w=majority";
//const uri = "mongodb+srv://tesnimbenmim14:F8KwpX8CZlHguwAN@cluster1.tswh8fp.mongodb.net";

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('✅ Successfully connected to MongoDB Atlas!'))
    .catch((error) => console.error('❌ Failed to connect to MongoDB:', error));

// Models
const userSchema = new mongoose.Schema({
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    dateNaissance: { type: Date, required: true },
    email: { type: String, required: true, unique: true },
    telephone: { type: String, required: true },
    adresse: { type: String, required: true },
    cin: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    roles: [{ type: String, required: true }],
    profileCompleted: { type: Boolean, default: false },
    isValidated: { type: Boolean, default: false },
    specialty: { type: String },
    diploma: { type: String },
    photo: { type: String },
    linkedDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    region: {
        type: String,
        enum: [
            'Tunis',
            'Ariana',
            'Ben Arous',
            'Manouba',
            'Nabeul',
            'Zaghouan',
            'Bizerte',
            'Béja',
            'Jendouba',
            'Le Kef',
            'Siliana',
            'Sousse',
            'Monastir',
            'Mahdia',
            'Sfax',
            'Kairouan',
            'Kasserine',
            'Sidi Bouzid',
            'Gabès',
            'Médenine',
            'Tataouine',
            'Gafsa',
            'Tozeur',
            'Kébili'
        ]
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
}, {
    timestamps: true
});

// Schéma pour tracker les notifications administratives lues
const adminNotificationReadSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    adminNotificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminNotification', required: true },
    readAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Index composé pour éviter les doublons
adminNotificationReadSchema.index({ userId: 1, adminNotificationId: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);
const AdminNotificationRead = mongoose.model('AdminNotificationRead', adminNotificationReadSchema);

const notificationSchema = new mongoose.Schema({
    message: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

// ... existing code ...

// Route pour récupérer les documents médicaux
app.get('/api/patient/medical-documents/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const patient = await Patient.findOne({ userId });

        if (!patient) {
            console.log('❌ Patient non trouvé pour userId:', userId);
            return res.status(404).json({ message: "Patient non trouvé." });
        }

        console.log('✅ Documents médicaux trouvés:', patient.medicalDocuments);
        res.status(200).json(patient.medicalDocuments || []);
    } catch (error) {
        console.error('❌ Erreur récupération documents:', error);
        res.status(500).json({ message: "Erreur lors de la récupération des documents." });
    }
});

// Route pour télécharger un document médical
app.post('/api/patient/medical-documents/:userId', uploadMedicalDoc.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Aucun fichier n'a été téléchargé." });
        }

        const { userId } = req.params;
        const { description } = req.body;

        let patient = await Patient.findOne({ userId });

        if (!patient) {
            // Si le patient n'existe pas, on le crée
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "Utilisateur non trouvé." });
            }

            patient = new Patient({
                userId: user._id,
                medicalDocuments: []
            });
        }

        patient.medicalDocuments.push({
            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            filePath: req.file.path,
            description
        });

        await patient.save();

        res.status(200).json({
            message: "Document médical téléchargé avec succès",
            document: patient.medicalDocuments[patient.medicalDocuments.length - 1]
        });

    } catch (error) {
        console.error('❌ Erreur upload document:', error);
        res.status(500).json({ message: "Erreur lors du téléchargement du document." });
    }
});

// Routes
// Sign Up
app.post('/signup', async(req, res) => {
    const {
        nom,
        prenom,
        dateNaissance,
        email,
        telephone,
        adresse,
        cin,
        password,
        role,
        region
    } = req.body;

    if (!nom || !prenom || !dateNaissance || !email || !telephone || !adresse || !cin || !password || !role || !region) {
        return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
    }

    try {
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà.' });

        const existingCIN = await User.findOne({ cin });
        if (existingCIN) return res.status(400).json({ message: 'Un utilisateur avec ce CIN existe déjà.' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            nom,
            prenom,
            dateNaissance,
            email: email.toLowerCase(),
            telephone,
            adresse,
            cin,
            password: hashedPassword,
            roles: [role],
            region
        });

        await newUser.save();
        res.status(201).json({ 
            message: 'Utilisateur inscrit avec succès !',
            userId: newUser._id 
        });
    } catch (error) {
        console.error('❌ Erreur d\'enregistrement :', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// Login
app.post('/login', async(req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Champs manquants." });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(400).json({ message: "Utilisateur non trouvé." });

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) return res.status(400).json({ message: "Mot de passe incorrect." });

        console.log('🔎 Utilisateur trouvé :', user);

        // 👉 Récupère le premier rôle en minuscule
        const userRole = (user.roles && user.roles.length > 0) ? user.roles[0].toLowerCase().trim() : '';

        // ✅ Nouvelle règle pour patient + admin
        if (userRole !== 'admin' && userRole !== 'patient' && !user.isValidated) {
            return res.status(403).json({ message: "Votre compte est en attente de validation par l'administrateur." });
        }

        // Génération du token JWT
        const token = generateToken({
            userId: user._id,
            email: user.email,
            role: user.roles[0]
        });

        // ✅ Connexion acceptée
        res.status(200).json({
            message: "Connexion réussie !",
            token,
            userId: user._id,
            email: user.email,
            role: user.roles[0],
            profileCompleted: user.profileCompleted,
            isValidated: user.isValidated
        });

    } catch (error) {
        console.error("❌ Erreur login :", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});


// Route pour récupérer la liste des médecins validés
app.get('/api/doctors-for-labs', async (req, res) => {
    try {
      const doctors = await User.find({
        roles: { $in: ['Doctor', 'doctor'] },
        isValidated: true,
        profileCompleted: true
      })
      .select('nom prenom email specialty')
      .sort({ nom: 1 });
  
      res.status(200).json(doctors);
    } catch (error) {
      console.error('❌ Erreur récupération liste médecins:', error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });
  
  // Route pour envoyer un message (laboratoire -> médecin)
  app.post('/api/lab-messages', async (req, res) => {
    try {
      const { senderId, receiverId, content } = req.body;
      if (!senderId || !receiverId || !content) {
        return res.status(400).json({ message: 'Champs manquants.' });
      }
  
      const message = new Message({
        senderId,
        receiverId,
        content,
        type: 'lab-doctor'
      });
  
      await message.save();
  
      // Créer une notification pour le médecin
      await Notification.create({
        userId: receiverId,
        message: `Nouveau message du laboratoire`
      });
  
      res.status(201).json({ message: 'Message envoyé.', data: message });
    } catch (error) {
      console.error('❌ Erreur envoi message:', error);
      res.status(500).json({ message: 'Erreur serveur.' });
    }
  });
  
  // Route pour récupérer les messages entre un laboratoire et un médecin
  app.get('/api/lab-messages/:labId/:doctorId', async (req, res) => {
    try {
      const { labId, doctorId } = req.params;
      const messages = await Message.find({
        $or: [
          { senderId: labId, receiverId: doctorId },
          { senderId: doctorId, receiverId: labId }
        ],
        type: 'lab-doctor'
      })
      .sort({ createdAt: 1 });
  
      res.status(200).json(messages);
    } catch (error) {
      console.error('❌ Erreur récupération messages:', error);
      res.status(500).json({ message: 'Erreur serveur.' });
    }
  });

// 🔒 Forgot Password - Générer un token et envoyer email
app.post('/forgot-password', async(req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email requis." });

    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(400).json({ message: "Utilisateur non trouvé." });

        const token = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 heure
        await user.save();
        console.log('✅ Token généré et sauvegardé :', token);


        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'patientpath2@gmail.com',
                pass: 'ppuu fmjc lzmz ntea'
            }
        });

        const mailOptions = {
            from: 'patientpath2@gmail.com',
            to: user.email,
            subject: '🔐 Réinitialisation de mot de passe',
            text: `
Bonjour ${user.nom},

Vous avez demandé à réinitialiser votre mot de passe.

Cliquez ici pour réinitialiser :
http://localhost:5173/reset-password/${token}

Si vous n'avez pas fait cette demande, ignorez cet email.
`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "📧 Email de réinitialisation envoyé !" });
    } catch (error) {
        console.error('❌ Erreur forgot-password :', error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// 🔒 Reset Password - Réinitialiser avec token
app.post('/reset-password/:token', async(req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    try {
        console.log('📩 Token reçu du frontend :', token);

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() } // ➡️ Vérifie que expire > maintenant
        });

        console.log('👤 Utilisateur trouvé ?', user);

        if (!user) {
            return res.status(400).json({ message: "Token invalide ou expiré." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: "✅ Mot de passe réinitialisé avec succès !" });
    } catch (error) {
        console.error('❌ Erreur reset-password :', error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});




// Patient Profile Update
app.put('/patient/profile/:id', upload.single('photo'), async(req, res) => {
    const { id } = req.params;
    const { emergencyPhone, bloodType, chronicDiseases } = req.body;
    const photoPath = req.file ? `/uploads/${req.file.filename}` : undefined;

    try {
        console.log('🔄 Mise à jour profil patient pour ID:', id);
        console.log('📋 Données reçues:', { emergencyPhone, bloodType, chronicDiseases, photoPath });

        // Mettre à jour les informations de base de l'utilisateur
        const userUpdateData = {
            profileCompleted: true
        };

        if (photoPath) {
            userUpdateData.photo = photoPath;
        }

        const updatedUser = await User.findByIdAndUpdate(id, userUpdateData, { new: true });
        if (!updatedUser) return res.status(404).json({ message: "Patient non trouvé." });

        console.log('✅ Utilisateur mis à jour:', updatedUser);

        // Mettre à jour ou créer les informations patient
        let patient = await Patient.findOne({ userId: id });
        
        if (!patient) {
            console.log('📝 Création d\'un nouveau profil patient');
            patient = new Patient({ userId: id });
        }

        // Mise à jour des informations patient
        patient.emergencyPhone = emergencyPhone || '';
        patient.bloodType = bloodType || '';
        patient.chronicDiseases = chronicDiseases || '';
        
        // Si emergencyPhone est fourni, l'ajouter aussi dans emergencyContact
        if (emergencyPhone) {
            patient.emergencyContact = {
                phone: emergencyPhone,
                name: patient.emergencyContact?.name || '',
                relationship: patient.emergencyContact?.relationship || ''
            };
        }

        await patient.save();
        console.log('✅ Informations patient sauvegardées:', patient);

        res.status(200).json({ 
            message: "Profil patient mis à jour avec succès ✅", 
            user: updatedUser,
            patient: patient
        });
    } catch (error) {
        console.error("❌ Erreur mise à jour profil patient :", error);
        res.status(500).json({ message: "Erreur serveur lors de la mise à jour." });
    }
});

// Médecin - Complément d'inscription
app.post('/doctor-info', upload.fields([
    { name: 'diploma', maxCount: 1 },
    { name: 'photo', maxCount: 1 }
]), async(req, res) => {
    const { email, specialty } = req.body;

    if (!email || !specialty || !req.files || !req.files.diploma || !req.files.photo) {
        return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    try {
        const doctor = await User.findOne({ email: email.toLowerCase() });

        if (!doctor) return res.status(404).json({ message: "Médecin introuvable." });

        doctor.specialty = specialty;
        doctor.diploma = `/uploads/${req.files.diploma[0].filename}`;
        doctor.photo = `/uploads/${req.files.photo[0].filename}`;
        doctor.profileCompleted = true;

        await doctor.save();

        res.status(200).json({ message: "Profil médecin enregistré avec succès ✅" });
    } catch (error) {
        console.error("❌ Erreur inscription médecin :", error);
        res.status(500).json({ message: "Erreur serveur lors de l'inscription médecin." });
    }
});


// Pour servir les fichiers statiques (images uploadées)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Cabinet - Complément d'inscription
app.post('/cabinet-info', async(req, res) => {
    console.log("🛠️ Données reçues côté backend :", req.body);

    const { email, linkedDoctorId, specialty, adresse } = req.body;

    if (!email || !linkedDoctorId || !specialty || !adresse) {
        console.log("❌ Champ manquant :", { email, linkedDoctorId, specialty, adresse });
        return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    try {
        const cabinet = await User.findOne({ email: email.toLowerCase() });
        if (!cabinet) return res.status(404).json({ message: "Cabinet introuvable." });

        const doctor = await User.findById(linkedDoctorId);
        if (!doctor || !doctor.roles.includes('Doctor')) {
            return res.status(404).json({ message: "Médecin invalide ou introuvable." });
        }

        cabinet.linkedDoctorId = doctor._id;
        cabinet.specialty = specialty;
        cabinet.adresse = adresse;
        cabinet.profileCompleted = true;

        await cabinet.save();

        res.status(200).json({ message: "✅ Cabinet lié au médecin avec succès !" });
    } catch (error) {
        console.error("❌ Erreur inscription cabinet :", error);
        res.status(500).json({ message: "Erreur serveur lors de l'inscription cabinet." });
    }
});



// Laboratoire - Complément d'inscription
app.post('/labs-info', upload.single('workCard'), async(req, res) => {
    const { email, address } = req.body;

    if (!email || !address || !req.file) {
        return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    try {
        const labUser = await User.findOne({ email: email.toLowerCase() });

        if (!labUser) {
            return res.status(404).json({ message: "Laboratoire introuvable." });
        }

        labUser.adresse = address;
        labUser.diploma = `/uploads/${req.file.filename}`;
        labUser.profileCompleted = true;

        await labUser.save();

        res.status(200).json({ message: "✅ Informations du laboratoire enregistrées avec succès." });
    } catch (error) {
        console.error("❌ Erreur enregistrement laboratoire :", error);
        res.status(500).json({ message: "Erreur serveur lors de l'enregistrement du laboratoire." });
    }
});


// Hôpital - Complément d'inscription
app.post('/hospital-info', async(req, res) => {
    const { email, adresse } = req.body;

    if (!email || !adresse) {
        return res.status(400).json({ message: "Email et adresse sont requis." });
    }

    try {
        const hospital = await User.findOne({ email: email.toLowerCase() });

        if (!hospital) {
            return res.status(404).json({ message: "Utilisateur hôpital non trouvé." });
        }

        hospital.adresse = adresse;
        hospital.profileCompleted = true;

        await hospital.save();

        res.status(200).json({ message: "✅ Profil hôpital complété avec succès !" });
    } catch (error) {
        console.error("❌ Erreur enregistrement hôpital :", error);
        res.status(500).json({ message: "Erreur serveur lors de l'enregistrement de l'hôpital." });
    }
});

// Récupération des hôpitaux validés pour les ambulanciers
app.get('/hospitals', async(req, res) => {
    try {
        const hospitals = await User.find({
            roles: { $in: ['Hospital'] },
            profileCompleted: true
        }).select('nom prenom email _id');
        res.status(200).json(hospitals);
    } catch (error) {
        console.error("❌ Erreur récupération hôpitaux :", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des hôpitaux." });
    }
});

// Ambulancier - Complément d'inscription
app.post('/ambulancier-info', upload.single('diploma'), async(req, res) => {
    const { email, hospitalId } = req.body;

    if (!email || !hospitalId || !req.file) {
        return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    try {
        const ambulancier = await User.findOne({ email: email.toLowerCase() });
        if (!ambulancier) {
            return res.status(404).json({ message: "Ambulancier non trouvé." });
        }

        // Vérification que l'hôpital existe
        const hospital = await User.findById(hospitalId);
        if (!hospital || !hospital.roles.includes('Hospital')) {
            return res.status(404).json({ message: "Hôpital invalide ou introuvable." });
        }

        ambulancier.diploma = `/uploads/${req.file.filename}`;
        ambulancier.linkedDoctorId = hospital._id; // réutilisation du champ existant pour associer l'hôpital
        ambulancier.profileCompleted = true;

        await ambulancier.save();

        res.status(200).json({ message: "✅ Profil ambulancier enregistré avec succès !" });
    } catch (error) {
        console.error("❌ Erreur enregistrement ambulancier :", error);
        res.status(500).json({ message: "Erreur serveur lors de l'enregistrement ambulancier." });
    }
});


app.get('/admin/notifications', async(req, res) => {
    try {
        const adminNotifications = await AdminNotification.find()
            .populate('sentBy', 'nom prenom email')
            .sort({ createdAt: -1 }); // tri du plus récent
        
        // Transformation pour correspondre au format attendu par le frontend
        const formattedNotifications = adminNotifications.map(notif => ({
            _id: notif._id,
            title: notif.title,
            message: notif.message,
            type: notif.type,
            priority: notif.priority,
            timestamp: notif.createdAt,
            status: notif.status,
            recipientType: notif.recipientType,
            recipients: notif.recipients
        }));
        
        res.status(200).json(formattedNotifications);
    } catch (error) {
        console.error("❌ Erreur récupération des notifications :", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des notifications." });
    }
});

app.post('/admin/notify', async(req, res) => {
    const { 
        title, 
        message, 
        type, 
        priority, 
        recipientType, 
        recipients 
    } = req.body;

    if (!title || title.trim() === '' || !message || message.trim() === '') {
        return res.status(400).json({ message: "Le titre et le message sont requis." });
    }

    if (!recipientType) {
        return res.status(400).json({ message: "Le type de destinataire est requis." });
    }

    try {
        // Pour l'instant, on utilise un ID admin par défaut
        // Dans un vrai système, on récupérerait ceci du token JWT
        let adminUser = await User.findOne({ roles: 'admin' });
        if (!adminUser) {
            return res.status(400).json({ message: "Administrateur non trouvé." });
        }

        // Créer la notification administrative
        const adminNotif = new AdminNotification({
            title,
            message,
            type: type || 'info',
            priority: priority || 'normal',
            recipientType,
            recipients: recipientType === 'specific' ? recipients : [],
            sentBy: adminUser._id
        });

        await adminNotif.save();

        // Maintenant, créer des notifications individuelles pour chaque utilisateur concerné
        let targetUsers = [];

        switch (recipientType) {
            case 'doctors':
                targetUsers = await User.find({ roles: 'Doctor' });
                break;
            case 'patients':
                targetUsers = await User.find({ roles: 'Patient' });
                break;
            case 'labs':
                targetUsers = await User.find({ roles: 'Labs' });
                break;
            case 'specific':
                if (recipients && recipients.length > 0) {
                    targetUsers = await User.find({ _id: { $in: recipients } });
                }
                break;
            default:
                targetUsers = await User.find({ roles: { $ne: 'admin' } });
                break;
        }

        // Créer des notifications individuelles pour chaque utilisateur
        const individualNotifications = targetUsers.map(user => ({
            userId: user._id,
            title,
            message
        }));

        if (individualNotifications.length > 0) {
            await Notification.insertMany(individualNotifications);
        }

        console.log(`✅ Notification envoyée à ${targetUsers.length} utilisateur(s)`);
        res.status(201).json({ 
            message: "✅ Notification envoyée avec succès!", 
            _id: adminNotif._id,
            sentTo: targetUsers.length 
        });
    } catch (error) {
        console.error("❌ Erreur envoi notification :", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

app.delete('/admin/users/:id', async(req, res) => {
    const { id } = req.params;

    try {
        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({ message: "Utilisateur introuvable." });
        }

        res.status(200).json({ message: "✅ Utilisateur supprimé avec succès." });
    } catch (error) {
        console.error("❌ Erreur suppression utilisateur :", error);
        res.status(500).json({ message: "Erreur serveur lors de la suppression." });
    }
});


app.put('/admin/validate-user/:id', async(req, res) => {
    const { id } = req.params;
    try {
        const updatedUser = await User.findByIdAndUpdate(
            id, { profileCompleted: true, isValidated: true }, // 🔥 ajouter isValidated
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "Utilisateur introuvable." });
        }

        res.status(200).json({ message: "✅ Utilisateur validé avec succès.", user: updatedUser });
    } catch (error) {
        console.error('❌ Erreur validation utilisateur:', error);
        res.status(500).json({ message: "Erreur serveur lors de la validation." });
    }
});



// ✅ Route pour modifier le rôle d'un utilisateur
app.put('/admin/users/:id', async(req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!role) {
        return res.status(400).json({ message: "Rôle requis." });
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            id, { roles: [role] }, { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "Utilisateur introuvable." });
        }

        res.status(200).json({ message: "✅ Rôle mis à jour avec succès.", user: updatedUser });
    } catch (error) {
        console.error("❌ Erreur modification rôle utilisateur :", error);
        res.status(500).json({ message: "Erreur serveur lors de la modification du rôle." });
    }
});


// ➡️ À utiliser UNE SEULE FOIS pour créer un nouvel admin
app.post('/create-admin', async(req, res) => {
    try {
        const { nom, prenom, dateNaissance, email, telephone, adresse, cin, password } = req.body;

        if (!nom || !prenom || !dateNaissance || !email || !telephone || !adresse || !cin || !password) {
            return res.status(400).json({ message: 'Tous les champs sont obligatoires.' });
        }

        // Vérifie s'il existe déjà
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newAdmin = new User({
            nom,
            prenom,
            dateNaissance,
            email: email.toLowerCase(),
            telephone,
            adresse,
            cin,
            password: hashedPassword,
            roles: ['admin'],
            profileCompleted: true,
            isValidated: true
        });

        await newAdmin.save();
        res.status(201).json({ message: '✅ Admin créé avec succès !' });
    } catch (error) {
        console.error('❌ Erreur création admin:', error);
        res.status(500).json({ message: 'Erreur serveur lors de la création de l\'admin.' });
    }
});

// ✅ Route pour récupérer les données d'un utilisateur spécifique par ID
app.get('/api/users/:id', async(req, res) => {
    const { id } = req.params;

    try {
        console.log("🔍 Recherche de l'utilisateur avec l'ID:", id);
        const user = await User.findById(id).select('-password');
        
        if (!user) {
            console.log("❌ Utilisateur non trouvé pour l'ID:", id);
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        console.log("✅ Utilisateur trouvé:", user);

        // Si l'utilisateur est un patient, récupérer les informations supplémentaires
        if (user.roles.includes('Patient')) {
            console.log("👤 L'utilisateur est un patient, recherche des informations supplémentaires...");
            const patientInfo = await Patient.findOne({ userId: id });
            console.log("📋 Informations patient trouvées:", patientInfo);
            
            const userResponse = user.toObject();
            
            // Vérifier si patientInfo existe et contient les données
            if (patientInfo) {
                // Priorité : utiliser les champs directs d'abord, sinon emergencyContact
                userResponse.emergencyPhone = patientInfo.emergencyPhone || patientInfo.emergencyContact?.phone || '';
                userResponse.bloodType = patientInfo.bloodType || '';
                userResponse.chronicDiseases = patientInfo.chronicDiseases || patientInfo.medicalHistory || '';
                console.log("✅ Informations patient ajoutées:", {
                    emergencyPhone: userResponse.emergencyPhone,
                    bloodType: userResponse.bloodType,
                    chronicDiseases: userResponse.chronicDiseases
                });
            } else {
                console.log("⚠️ Aucune information patient trouvée, création d'un nouveau document Patient");
                // Créer un nouveau document Patient si n'existe pas
                const newPatient = new Patient({
                    userId: id,
                    emergencyContact: { phone: '' },
                    bloodType: '',
                    medicalHistory: ''
                });
                await newPatient.save();
                console.log("✅ Nouveau document Patient créé");
                
                userResponse.emergencyPhone = '';
                userResponse.bloodType = '';
                userResponse.chronicDiseases = '';
            }
            
            console.log("📤 Réponse finale avec informations patient:", userResponse);
            return res.status(200).json(userResponse);
        }

        console.log("📤 Réponse finale (non patient):", user);
        res.status(200).json(user);
    } catch (error) {
        console.error('❌ Erreur récupération utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// Route pour mettre à jour le profil utilisateur
app.put('/api/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const updateData = req.body;
        
        console.log("🔄 Mise à jour du profil pour l'utilisateur:", userId);
        console.log("📝 Données reçues:", updateData);
        
        // Supprimer les champs sensibles qui ne doivent pas être modifiés
        delete updateData.password;
        delete updateData.roles;
        delete updateData.isValidated;
        delete updateData.profileCompleted;

        // Extraire les données spécifiques au patient
        const patientData = {
            emergencyContact: {
                phone: updateData.emergencyPhone
            },
            bloodType: updateData.bloodType,
            medicalHistory: updateData.chronicDiseases // Utiliser chronicDiseases comme medicalHistory
        };

        console.log("👤 Données patient à mettre à jour:", patientData);

        // Supprimer les données patient de updateData
        delete updateData.emergencyPhone;
        delete updateData.bloodType;
        delete updateData.chronicDiseases;

        // Mettre à jour l'utilisateur
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            console.log("❌ Utilisateur non trouvé");
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        console.log("✅ Utilisateur mis à jour:", updatedUser);

        // Si c'est un patient, mettre à jour ou créer les informations patient
        if (updatedUser.roles.includes('Patient')) {
            console.log("👤 Mise à jour des informations patient");
            let patient = await Patient.findOne({ userId });
            
            if (!patient) {
                console.log("📝 Création d'un nouveau profil patient");
                patient = new Patient({ userId });
            }
            
            // Mise à jour des informations patient
            patient.emergencyContact = patientData.emergencyContact;
            patient.bloodType = patientData.bloodType;
            patient.medicalHistory = patientData.medicalHistory;
            
            await patient.save();
            console.log("✅ Informations patient mises à jour:", patient);

            // Vérifier que les données ont bien été sauvegardées
            const verifyPatient = await Patient.findOne({ userId });
            console.log("🔍 Vérification des données patient après sauvegarde:", verifyPatient);
        }

        // Ne pas renvoyer le mot de passe dans la réponse
        const userResponse = updatedUser.toObject();
        delete userResponse.password;

        // Ajouter les informations patient à la réponse
        userResponse.emergencyPhone = patientData.emergencyContact.phone;
        userResponse.bloodType = patientData.bloodType;
        userResponse.chronicDiseases = patientData.medicalHistory;

        console.log("📤 Réponse finale:", userResponse);
        res.json(userResponse);
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du profil:', error);
        res.status(500).json({ 
            message: "Erreur lors de la mise à jour du profil",
            error: error.message 
        });
    }
});

// Créer un nouvel article
app.post('/api/articles', uploadArticleImage.single('image'), async (req, res) => {
  try {
    const { title, content, category, tags, authorId } = req.body;
    console.log('Received article data:', { title, content, category, tags, authorId });
    
    if (!title || !content || !category || !authorId) {
      return res.status(400).json({ 
        message: "Tous les champs requis doivent être remplis.",
        missing: {
          title: !title,
          content: !content,
          category: !category,
          authorId: !authorId
        }
      });
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = req.file.path;
      console.log('Image uploaded:', imageUrl);
    }

    const parsedTags = tags ? JSON.parse(tags) : [];
    console.log('Parsed tags:', parsedTags);

    const article = new Article({
      title,
      content,
      authorId,
      category,
      tags: parsedTags,
      imageUrl: imageUrl
    });

    console.log('Creating article:', article);
    const savedArticle = await article.save();
    console.log('Article saved successfully:', savedArticle);

    res.status(201).json({
      message: "✅ Article publié avec succès !",
      article: savedArticle
    });
  } catch (error) {
    console.error("❌ Erreur création article:", error);
    // Si une erreur se produit et qu'un fichier a été uploadé, on le supprime
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error("Erreur lors de la suppression du fichier:", unlinkError);
      }
    }
    res.status(500).json({ 
      message: "Erreur lors de la création de l'article.",
      error: error.message 
    });
  }
});

// Récupérer les articles d'un docteur spécifique
app.get('/api/articles/doctor/:doctorId', async (req, res) => {
    try {
        const { doctorId } = req.params;
        if (!doctorId) {
            return res.status(400).json({ message: "ID du docteur requis" });
        }

        const articles = await Article.find({ authorId: doctorId })
            .populate('authorId', 'nom prenom')
            .sort({ createdAt: -1 });

        res.status(200).json(articles);
    } catch (error) {
        console.error("❌ Erreur récupération articles:", error);
        res.status(500).json({ 
            message: "Erreur lors de la récupération des articles.",
            error: error.message 
        });
    }
});

// Supprimer un article
app.delete('/api/articles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const article = await Article.findById(id);
        
        if (!article) {
            return res.status(404).json({ message: "Article non trouvé." });
        }

        // Supprimer l'image associée si elle existe
        if (article.imageUrl) {
            const imagePath = path.join(__dirname, article.imageUrl);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await Article.findByIdAndDelete(id);
        res.status(200).json({ message: "✅ Article supprimé avec succès !" });
    } catch (error) {
        console.error("❌ Erreur suppression article:", error);
        res.status(500).json({ 
            message: "Erreur lors de la suppression de l'article.",
            error: error.message 
        });
    }
});


// ➕ Route pour le tableau de bord Admin
app.get('/admin/overview', async(req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const validatedUsers = await User.countDocuments({ profileCompleted: true });
        const docsToValidate = await User.countDocuments({ profileCompleted: false });

        const recentUsers = await User.find()
            .sort({ createdAt: -1 }) // ou _id si pas de timestamp
            .limit(5)
            .select('nom prenom email roles');

        res.status(200).json({
            totalUsers,
            validatedUsers,
            docsToValidate,
            recentUsers
        });
    } catch (error) {
        console.error("❌ Erreur /admin/overview :", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération du tableau de bord." });
    }
});


// ✅ Route pour récupérer les données d'un utilisateur par ID (profil)
app.get('/users', async(req, res) => {
    try {
        const allUsers = await User.find().select('nom prenom email roles _id diploma photo adresse profileCompleted isValidated');
        res.status(200).json(allUsers);
    } catch (error) {
        console.error("❌ Erreur récupération de tous les utilisateurs :", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des utilisateurs." });
    }
});




// 📩 Route de contact avec envoi d'email réel
app.post('/contact', async(req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    try {
        // Transporteur nodemailer (utilise Gmail ici)
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'patientpath2@gmail.com',
                pass: 'ppuu fmjc lzmz ntea' // ⚠️ Utilise un mot de passe d'application (voir note ci-dessous)
            }
        });

        // Options du mail
        const mailOptions = {
            from: email,
            to: 'patientpath2@gmail.com',
            subject: `📥 Nouveau message de ${name}`,
            text: `Nom: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
        };

        // Envoi du mail
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: '✅ Message envoyé avec succès !' });

    } catch (error) {
        console.error('❌ Erreur envoi email :', error); // AJOUTER
        res.status(500).json({ message: "Erreur lors de l'envoi du message.", error: error.message });
    }

});






// 🔎 Récupère les médecins validés avec spécialité définie
app.get('/api/valid-doctors', async(req, res) => {
    try {
        const doctors = await User.find({
            roles: { $in: ['Doctor', 'doctor'] },
            isValidated: true,
            profileCompleted: true,
            specialty: { $exists: true, $ne: '' }
        }).select('_id nom prenom email specialty');

        res.status(200).json(doctors);
    } catch (error) {
        console.error("❌ Erreur récupération médecins valides :", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// Route pour récupérer les laboratoires validés
app.get('/api/labs-valides', async(req, res) => {
    try {
        console.log("🔍 Recherche des laboratoires...");
        const labs = await User.find({
            roles: { $in: ['Laboratory', 'laboratory', 'Laboratoire', 'Labs'] },
            isValidated: true,
            profileCompleted: true
        });

        console.log("✅ Laboratoires trouvés:", labs.length);
        console.log("📝 Détails des labs:", labs);

        res.status(200).json(labs);
    } catch (error) {
        console.error("❌ Erreur récupération laboratoires :", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// 🩺 Médecins validés et complets (pour les rendez-vous)
app.get('/api/medecins-valides', async(req, res) => {
    try {
        // Retourner TOUS les médecins validés, même ceux liés à un cabinet
        const doctors = await User.find({
            roles: { $in: ['Doctor', 'doctor'] },
            isValidated: true,
            profileCompleted: true
        }).select('_id nom prenom email specialty region roles cabinet');
        res.status(200).json(doctors);
    } catch (error) {
        console.error("❌ Erreur récupération médecins :", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});


app.get('/api/doctor/appointments/:doctorId', async(req, res) => {
    try {
        const { doctorId } = req.params;

        const appointments = await Appointment.find({ doctorId })
            .populate('patientId', 'nom prenom email telephone');

        const formatted = appointments.map(apt => ({
            _id: apt._id,
            patient: apt.patientId, // les infos du patient
            date: apt.date,
            status: apt.status,
            reason: apt.reason
        }));

        res.status(200).json(formatted);
    } catch (error) {
        console.error('❌ Erreur récupération rendez-vous médecin :', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});


app.put('/api/appointments/:appointmentId/status', async(req, res) => {
    try {
        const { appointmentId } = req.params;
        const { status } = req.body;

        const appointment = await Appointment.findByIdAndUpdate(
            appointmentId, { status }, { new: true }
        );

        if (!appointment) {
            return res.status(404).json({ message: "Rendez-vous non trouvé." });
        }

        // Notification pour le patient si confirmé
        if (status === 'confirmed') {
            await Notification.create({
                userId: appointment.patientId, // 🧠 Assure-toi que `patientId` est bien dans ton modèle `Appointment`
                message: `Votre rendez-vous du ${new Date(appointment.date).toLocaleString('fr-FR')} a été confirmé.`
            });
        }

        res.status(200).json(appointment);
    } catch (error) {
        console.error("❌ Erreur maj statut :", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});









app.get('/api/notifications/:userId', async(req, res) => {
    try {
        const { userId } = req.params;
        
        // Récupérer l'utilisateur pour vérifier son rôle
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        // Si l'utilisateur est un docteur, filtrer les notifications
        if (user.roles.includes('Doctor')) {
            // Récupérer les AdminNotifications destinées aux docteurs ou à tous
            const adminNotifications = await AdminNotification.find({
                $or: [
                    { recipientType: 'doctors' },
                    { recipientType: 'all' },
                    { 
                        recipientType: 'specific',
                        recipients: userId 
                    }
                ]
            }).sort({ createdAt: -1 });

            // Récupérer les notifications administratives lues par cet utilisateur
            const readAdminNotifications = await AdminNotificationRead.find({ userId });
            const readAdminNotificationIds = readAdminNotifications.map(read => read.adminNotificationId.toString());

            // Convertir les AdminNotifications au format des notifications individuelles
            const formattedNotifications = adminNotifications.map(adminNotif => ({
                _id: adminNotif._id,
                userId: userId,
                title: adminNotif.title,
                message: adminNotif.message,
                type: adminNotif.type,
                priority: adminNotif.priority,
                read: readAdminNotificationIds.includes(adminNotif._id.toString()),
                createdAt: adminNotif.createdAt,
                updatedAt: adminNotif.updatedAt,
                isAdminNotification: true // Flag pour identifier les notifications admin
            }));

            // Récupérer aussi les notifications individuelles (messages, etc.)
            const individualNotifications = await Notification.find({ userId })
                .sort({ createdAt: -1 })
                .lean();

            // Ajouter le flag pour les notifications individuelles
            const formattedIndividualNotifications = individualNotifications.map(notif => ({
                ...notif,
                isAdminNotification: false
            }));

            // Combiner et trier toutes les notifications
            const allNotifications = [...formattedNotifications, ...formattedIndividualNotifications]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            res.status(200).json(allNotifications);
        } else {
            // Pour les autres rôles, retourner seulement leurs notifications individuelles
            const notifications = await Notification.find({ userId })
                .sort({ createdAt: -1 })
                .lean();

            // Ajouter le flag pour les notifications individuelles
            const formattedNotifications = notifications.map(notif => ({
                ...notif,
                isAdminNotification: false
            }));

            res.status(200).json(formattedNotifications);
        }
    } catch (error) {
        console.error("❌ Erreur notifications:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// Route pour marquer une notification comme lue
app.put('/api/notifications/:notificationId/read', async(req, res) => {
    try {
        const { notificationId } = req.params;
        const { userId, isAdminNotification } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "userId requis." });
        }

        if (isAdminNotification) {
            // Pour les notifications administratives, créer un enregistrement de lecture
            try {
                await AdminNotificationRead.create({
                    userId,
                    adminNotificationId: notificationId
                });
                
                res.status(200).json({ 
                    message: "Notification administrative marquée comme lue"
                });
            } catch (error) {
                if (error.code === 11000) {
                    // Déjà marquée comme lue
                    res.status(200).json({ 
                        message: "Notification déjà marquée comme lue"
                    });
                } else {
                    throw error;
                }
            }
        } else {
            // Pour les notifications individuelles, mettre à jour le champ read
            const notification = await Notification.findByIdAndUpdate(
                notificationId,
                { read: true },
                { new: true }
            );

            if (!notification) {
                return res.status(404).json({ message: "Notification non trouvée." });
            }

            res.status(200).json({ 
                message: "Notification marquée comme lue",
                notification 
            });
        }
    } catch (error) {
        console.error("❌ Erreur marquage notification comme lue:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});

// 🆕 Route pour créer un rendez-vous patient
app.post('/api/appointments', async(req, res) => {
    try {
        const { doctorId, patientId, reason } = req.body;

        if (!doctorId || !patientId || !reason) {
            return res.status(400).json({ message: "Champs obligatoires manquants." });
        }

        const appointment = new Appointment({
            doctorId,
            patientId,
            reason,
            type: 'medical',
            status: 'pending'
        });

        const savedAppointment = await appointment.save();

        // Créer une notification pour le médecin
        await Notification.create({
            userId: doctorId,
            message: `Nouvelle demande de rendez-vous reçue`
        });

        res.status(201).json({ 
            message: "✅ Rendez-vous enregistré avec succès !",
            appointment: savedAppointment
        });
    } catch (error) {
        console.error("❌ Erreur création rendez-vous :", error);
        res.status(500).json({ message: "Erreur serveur lors de la création du rendez-vous." });
    }
});

// Route pour télécharger un document médical
app.post('/api/patient/medical-documents/:userId', uploadMedicalDoc.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Aucun fichier n'a été téléchargé." });
        }

        const { userId } = req.params;
        const { description } = req.body;

        let patient = await Patient.findOne({ userId });

        if (!patient) {
            patient = new Patient({
                userId,
                medicalDocuments: []
            });
        }

        const newDocument = {            fileName: req.file.originalname,
            fileType: req.file.mimetype,
            filePath: req.file.path,
            description: description || ''

        };
        patient.medicalDocuments.push(newDocument);

        await patient.save();

        res.status(200).json({
            message: "Document médical téléchargé avec succès",
            document: newDocument
        });

    } catch (error) {
        console.error('❌ Erreur upload document:', error);
        res.status(500).json({ message: "Erreur lors du téléchargement du document." });
    }
});

// Route pour récupérer les documents médicaux
app.get('/api/patient/medical-documents/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const patient = await Patient.findOne({ userId });

        if (!patient) {
            return res.status(404).json({ message: "Patient non trouvé." });
        }

        res.status(200).json(patient.medicalDocuments);
    } catch (error) {
        console.error('❌ Erreur récupération documents:', error);
        res.status(500).json({ message: "Erreur lors de la récupération des documents." });
    }
});

// Route pour supprimer un document médical
app.delete('/api/patient/medical-documents/:userId/:documentId', async (req, res) => {
    try {
        const { userId, documentId } = req.params;
        const patient = await Patient.findOne({ userId });

        if (!patient) {
            return res.status(404).json({ message: "Patient non trouvé." });
        }

        const document = patient.medicalDocuments.id(documentId);
        if (!document) {
            return res.status(404).json({ message: "Document non trouvé." });
        }

        // Supprimer le fichier physique
        if (fs.existsSync(document.filePath)) {
            fs.unlinkSync(document.filePath);
        }

        // Supprimer le document de la base de données
        patient.medicalDocuments.pull(documentId);
        await patient.save();

        res.status(200).json({ message: "Document supprimé avec succès." });
    } catch (error) {
        console.error('❌ Erreur suppression document:', error);
        res.status(500).json({ message: "Erreur lors de la suppression du document." });
    }
});

// Envoyer un message (patient -> médecin ou médecin -> patient)
app.post('/api/messages', async (req, res) => {
  try {
    const { senderId, receiverId, content, appointmentId } = req.body;
    console.log('Received message request:', { senderId, receiverId, content, appointmentId });
    
    if (!senderId || !receiverId || !content || !appointmentId) {
      console.log('Missing required fields:', { senderId, receiverId, content, appointmentId });
      return res.status(400).json({ 
        message: 'Tous les champs sont requis.',
        missing: {
          senderId: !senderId,
          receiverId: !receiverId,
          content: !content,
          appointmentId: !appointmentId
        }
      });
    }

    const message = new Message({
      senderId,
      receiverId,
      content,
      appointmentId,
      isRead: false
    });

    console.log('Creating message:', message);
    await message.save();
    console.log('Message saved successfully');

    // Create a notification for the receiver
    await Notification.create({
      userId: receiverId,
      message: 'Nouveau message reçu'
    });

    res.status(201).json({ message: 'Message envoyé.', data: message });
  } catch (error) {
    console.error('Error in /api/messages:', error);
    res.status(500).json({ 
      message: 'Erreur serveur.',
      error: error.message 
    });
  }
});

// Route pour mettre à jour les messages existants (à exécuter une seule fois)
app.post('/api/messages/migrate', async (req, res) => {
  try {
    // Mettre à jour tous les messages qui n'ont pas de champ isRead
    const result = await Message.updateMany(
      { isRead: { $exists: false } },
      { $set: { isRead: false } }
    );
    
    res.status(200).json({ 
      message: 'Migration terminée', 
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error('❌ Erreur migration messages:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Récupérer les messages pour un rendez-vous donné (patient et médecin)
app.get('/api/messages/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { userId } = req.query;
    
    console.log("🔍 Recherche des messages pour le rendez-vous:", appointmentId);
    
    // Récupérer les messages avec les informations des utilisateurs
    const messages = await Message.find({ appointmentId })
      .populate('senderId', 'nom prenom email')
      .populate('receiverId', 'nom prenom email')
      .sort({ createdAt: 1 });
    
    console.log(`✅ ${messages.length} messages trouvés`);
    
    // Marquer les messages comme lus si userId est fourni
    if (userId) {
      console.log("📝 Marquage des messages comme lus pour l'utilisateur:", userId);
      await Message.updateMany(
        {
          appointmentId,
          receiverId: userId,
          isRead: false
        },
        { $set: { isRead: true } }
      );
    }
    
    // Formater les messages pour l'affichage
    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      content: msg.content,
      senderId: msg.senderId._id,
      senderName: `${msg.senderId.nom} ${msg.senderId.prenom}`,
      receiverId: msg.receiverId._id,
      receiverName: `${msg.receiverId.nom} ${msg.receiverId.prenom}`,
      createdAt: msg.createdAt,
      isRead: msg.isRead
    }));

    res.status(200).json(formattedMessages);
  } catch (error) {
    console.error('❌ Erreur récupération messages:', error);
    res.status(500).json({ 
      message: 'Erreur serveur.',
      error: error.message 
    });
  }
});

// Récupérer les rendez-vous d'un patient
app.get('/api/appointments', async (req, res) => {
  const { patientId } = req.query;
  console.log('📥 Received request for appointments with patientId:', patientId);
  
  if (!patientId) {
    console.log('❌ No patientId provided');
    return res.status(400).json({ message: "patientId requis" });
  }
  
  try {
    console.log('🔍 Searching for appointments...');
    const appointments = await Appointment.find({ 
      patientId,
      $or: [
        { type: { $ne: 'laboratory' } },  // Rendez-vous médecins (type null ou différent de laboratory)
        { type: { $exists: false } }      // Pour les anciens rendez-vous sans type
      ]
    })
    .populate('doctorId', 'nom prenom email')
    .sort({ date: -1 });
    
    console.log('📊 Found appointments:', appointments.length);
    
    const formatted = appointments.map(apt => {
      const formattedApt = {
        ...apt.toObject(),
        doctorName: apt.doctorId?.nom && apt.doctorId?.prenom
          ? `Dr. ${apt.doctorId.prenom} ${apt.doctorId.nom}`
          : apt.doctorId?.email || '',
        doctorEmail: apt.doctorId?.email || '',
        doctorId: apt.doctorId?._id || apt.doctorId,
        type: apt.type || 'medical'  // Par défaut, c'est un rendez-vous médical
      };
      return formattedApt;
    });
    
    console.log('✅ Sending formatted appointments');
    res.status(200).json(formatted);
  } catch (error) {
    console.error('❌ Error fetching appointments:', error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Route pour créer un rendez-vous laboratoire
app.post('/api/lab-appointments', async(req, res) => {
    try {
        const { labId, patientId, reason } = req.body;
        console.log('📝 Création rendez-vous laboratoire:', { labId, patientId, reason });

        if (!labId || !patientId || !reason) {
            return res.status(400).json({ message: "Tous les champs sont requis." });
        }

        const appointment = new Appointment({
            doctorId: labId,
            patientId,
            reason,
            type: 'laboratory',
            status: 'pending'
        });

        const savedAppointment = await appointment.save();
        console.log('✅ Rendez-vous laboratoire créé:', savedAppointment);

        // Créer une notification pour le laboratoire
        await Notification.create({
            userId: labId,
            message: `Nouvelle demande de rendez-vous reçue`
        });

        res.status(201).json({ 
            message: "✅ Rendez-vous laboratoire créé avec succès !",
            appointment: savedAppointment
        });
    } catch (error) {
        console.error("❌ Erreur création rendez-vous laboratoire:", error);
        res.status(500).json({ 
            message: "Erreur serveur.",
            error: error.message 
        });
    }
});

// Route pour récupérer les rendez-vous laboratoire d'un patient
app.get('/api/lab-appointments/patient/:patientId', async(req, res) => {
    try {
        const { patientId } = req.params;
        const appointments = await Appointment.find({ 
            patientId,
            type: 'laboratory'
        })
        .populate({
            path: 'doctorId',
            model: 'User',
            select: 'nom prenom adresse'
        })
        .sort({ date: -1 });

        const formattedAppointments = appointments.map(apt => ({
            _id: apt._id,
            date: apt.date,
            reason: apt.reason,
            status: apt.status,
            lab: {
                _id: apt.doctorId._id,
                nom: apt.doctorId.nom,
                adresse: apt.doctorId.adresse
            }
        }));

        res.status(200).json(formattedAppointments);
    } catch (error) {
        console.error("❌ Erreur récupération rendez-vous laboratoire:", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// Dans server.js
app.get('/api/hospitals', async (req, res) => {
  try {
    const hospitals = await User.find({
      roles: 'Hospital',
      isValidated: true
    });
    res.json(hospitals);
  } catch (error) {
    console.error('Erreur lors de la récupération des hôpitaux:', error);
    res.status(500).json({ message: "Erreur lors de la récupération des hôpitaux" });
  }
});

// Route pour uploader l'avatar d'un utilisateur
app.post('/api/users/:userId/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier n'a été téléchargé." });
    }

    const { userId } = req.params;
    const photoPath = `/uploads/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { photo: photoPath },
      { new: true }
    );

    if (!updatedUser) {
      // Supprimer le fichier si l'utilisateur n'existe pas
      fs.unlinkSync(path.join(__dirname, req.file.path));
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.json({
      message: "Avatar mis à jour avec succès",
      photo: photoPath
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'avatar:', error);
    // Supprimer le fichier en cas d'erreur
    if (req.file) {
      fs.unlinkSync(path.join(__dirname, req.file.path));
    }
    res.status(500).json({ 
      message: "Erreur lors de la mise à jour de l'avatar",
      error: error.message 
    });
  }
});

// Route pour récupérer les rendez-vous d'un laboratoire
app.get('/api/lab-appointments/lab/:labId', async(req, res) => {
    try {
        const { labId } = req.params;
        console.log('Recherche RDV pour labId:', labId);
        
        // Récupérer les rendez-vous avec les informations du patient
        const appointments = await Appointment.find({ 
            doctorId: labId,
            type: 'laboratory'
        }).populate({
            path: 'patientId',
            model: 'User',
            select: 'nom prenom email telephone'
        }).sort({ date: -1 });

        console.log('RDV trouvés:', appointments.length);
        
        // Formater les données en s'assurant que toutes les informations du patient sont présentes
        const formattedAppointments = appointments.map(apt => {
            const patientData = apt.patientId || {};
            return {
                _id: apt._id,
                date: apt.date,
                reason: apt.reason,
                status: apt.status,
                patient: {
                    _id: patientData._id || '',
                    nom: patientData.nom || 'Non renseigné',
                    prenom: patientData.prenom || 'Non renseigné',
                    email: patientData.email || 'Non renseigné',
                    telephone: patientData.telephone || 'Non renseigné'
                },
                type: apt.type
            };
        });

        res.status(200).json(formattedAppointments);
    } catch (error) {
        console.error("❌ Erreur récupération rendez-vous laboratoire:", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// Route pour mettre à jour le statut d'un rendez-vous laboratoire
app.put('/api/lab-appointments/:appointmentId/status', async(req, res) => {
    try {
        const { appointmentId } = req.params;
        const { status } = req.body;

        const appointment = await Appointment.findByIdAndUpdate(
            appointmentId,
            { status },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({ message: "Rendez-vous non trouvé." });
        }

        // Créer une notification pour le patient
        await Notification.create({
            userId: appointment.patientId,
            message: `Votre rendez-vous laboratoire du ${new Date(appointment.date).toLocaleString('fr-FR')} a été ${
                status === 'confirmed' ? 'confirmé' : 'annulé'
            }.`
        });

        res.status(200).json(appointment);
    } catch (error) {
        console.error("❌ Erreur mise à jour statut rendez-vous:", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// Route pour envoyer un résultat de laboratoire
app.post('/api/lab-results', uploadLabResult.single('file'), async(req, res) => {
    try {
        console.log('Body reçu:', req.body);
        console.log('Fichier reçu:', req.file);
        
        const { appointmentId, labId, patientId, testType, results } = req.body;

        if (!testType) {
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ message: "Le type de test est requis." });
        }

        const labResult = new LabResult({
            appointmentId,
            labId,
            patientId,
            testType,
            results,
            status: 'completed',
            fileUrl: req.file ? req.file.path.replace(/^\.\/|Backend\//g, '') : null
        });

        const savedResult = await labResult.save();

        // Créer une notification pour le patient
        await Notification.create({
            userId: patientId,
            message: `Nouveaux résultats d'analyses disponibles de la part de votre laboratoire.`
        });

        res.status(201).json({
            message: "✅ Résultats envoyés avec succès !",
            result: savedResult
        });
    } catch (error) {
        console.error("❌ Erreur envoi résultats:", error);
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ 
            message: "Erreur lors de l'envoi des résultats.",
            error: error.message 
        });
    }
});

// Route pour récupérer les résultats d'un patient
app.get('/api/lab-results/patient/:patientId', async(req, res) => {
    try {
        const { patientId } = req.params;
        const results = await LabResult.find({ patientId })
            .populate('labId', 'nom prenom')
            .populate('appointmentId', 'date')
            .sort({ createdAt: -1 });

        res.status(200).json(results);
    } catch (error) {
        console.error("❌ Erreur récupération résultats:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des résultats." });
    }
});

// Route pour récupérer les résultats envoyés par un laboratoire
app.get('/api/lab-results/lab/:labId', async(req, res) => {
    try {
        const { labId } = req.params;
        const results = await LabResult.find({ labId })
            .populate('patientId', 'nom prenom')
            .populate('appointmentId', 'date')
            .sort({ createdAt: -1 });

        res.status(200).json(results);
    } catch (error) {
        console.error("❌ Erreur récupération résultats:", error);
        res.status(500).json({ message: "Erreur lors de la récupération des résultats." });
    }
});

// Route pour envoyer un message (laboratoire -> médecin)
app.post('/api/lab-doctor-messages', async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;
    if (!senderId || !receiverId || !content) {
      return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    const message = new LabDoctorMessage({
      senderId,
      receiverId,
      content
    });

    await message.save();

    // Créer une notification pour le destinataire
    await Notification.create({
      userId: receiverId,
      message: 'Nouveau message reçu'
    });

    res.status(201).json({ message: 'Message envoyé.', data: message });
  } catch (error) {
    console.error('❌ Erreur envoi message:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Route pour récupérer les messages entre un laboratoire et un médecin
app.get('/api/lab-doctor-messages/:labId/:doctorId', async (req, res) => {
  try {
    const { labId, doctorId } = req.params;
    const messages = await LabDoctorMessage.find({
      $or: [
        { senderId: labId, receiverId: doctorId },
        { senderId: doctorId, receiverId: labId }
      ]
    })
    .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error('❌ Erreur récupération messages:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Route pour marquer les messages comme lus
app.put('/api/lab-doctor-messages/read', async (req, res) => {
  try {
    const { receiverId, senderId } = req.body;
    await LabDoctorMessage.updateMany(
      { senderId, receiverId, isRead: false },
      { isRead: true }
    );
    res.status(200).json({ message: 'Messages marqués comme lus.' });
  } catch (error) {
    console.error('❌ Erreur mise à jour messages:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Route pour récupérer le nombre de messages non lus par conversation pour un médecin
app.get('/api/messages/unread-counts/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const unreadCounts = {};

    // Compter les messages non lus des patients
    const patientMessages = await Message.aggregate([
      {
        $match: {
          receiverId: new mongoose.Types.ObjectId(doctorId),
          isRead: false
        }
      },
      {
        $group: {
          _id: '$senderId',
          count: { $sum: 1 }
        }
      }
    ]);

    // Compter les messages non lus des laboratoires
    const labMessages = await LabDoctorMessage.aggregate([
      {
        $match: {
          receiverId: new mongoose.Types.ObjectId(doctorId),
          isRead: false
        }
      },
      {
        $group: {
          _id: '$senderId',
          count: { $sum: 1 }
        }
      }
    ]);

    // Combiner les résultats
    [...patientMessages, ...labMessages].forEach(item => {
      unreadCounts[item._id.toString()] = item.count;
    });

    res.status(200).json(unreadCounts);
  } catch (error) {
    console.error('❌ Erreur récupération compteurs non lus:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Route pour récupérer le total des messages non lus pour un médecin
app.get('/api/messages/total-unread/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Compter les messages non lus des patients
    const patientUnreadCount = await Message.countDocuments({
      receiverId: doctorId,
      isRead: false
    });

    // Compter les messages non lus des laboratoires
    const labUnreadCount = await LabDoctorMessage.countDocuments({
      receiverId: doctorId,
      isRead: false
    });

    const total = patientUnreadCount + labUnreadCount;

    res.status(200).json({ total });
  } catch (error) {
    console.error('❌ Erreur récupération total messages non lus:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Routes pour les rendez-vous d'hôpital
app.post('/api/hospital-appointments', async (req, res) => {
    try {
        const { hospitalId, patientId, specialty } = req.body;

        if (!hospitalId || !patientId || !specialty) {
            return res.status(400).json({ message: "Tous les champs sont requis." });
        }

        const appointment = new HospitalAppointment({
            hospitalId,
            patientId,
            specialty
        });

        const savedAppointment = await appointment.save();

        // Créer une notification pour l'hôpital
        await Notification.create({
            userId: hospitalId,
            message: `Nouvelle demande de rendez-vous pour la spécialité ${specialty}`
        });

        res.status(201).json({
            message: "✅ Demande de rendez-vous enregistrée avec succès !",
            appointment: savedAppointment
        });
    } catch (error) {
        console.error("❌ Erreur création rendez-vous hôpital:", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// Route pour récupérer les rendez-vous d'un patient avec un hôpital
app.get('/api/hospital-appointments/patient/:patientId', async (req, res) => {
    try {
        const { patientId } = req.params;
        const appointments = await HospitalAppointment.find({ patientId })
            .populate('hospitalId', 'nom prenom adresse')
            .sort({ createdAt: -1 });

        res.status(200).json(appointments);
    } catch (error) {
        console.error("❌ Erreur récupération rendez-vous hôpital:", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// Route pour récupérer les rendez-vous d'un hôpital
app.get('/api/hospital-appointments/hospital/:hospitalId', async (req, res) => {
    try {
        const { hospitalId } = req.params;
        const appointments = await HospitalAppointment.find({ hospitalId })
            .populate('patientId', 'nom prenom email telephone')
            .sort({ createdAt: -1 });

        res.status(200).json(appointments);
    } catch (error) {
        console.error("❌ Erreur récupération rendez-vous hôpital:", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// Route pour mettre à jour le statut d'un rendez-vous
app.put('/api/hospital-appointments/:appointmentId/status', async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { status } = req.body;

        const appointment = await HospitalAppointment.findByIdAndUpdate(
            appointmentId,
            { status },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({ message: "Rendez-vous non trouvé." });
        }

        // Créer une notification pour le patient
        await Notification.create({
            userId: appointment.patientId,
            message: `Votre demande de rendez-vous à l'hôpital pour la spécialité ${appointment.specialty} a été ${status === 'confirmed' ? 'confirmée' : 'annulée'}.`
        });

        res.status(200).json(appointment);
    } catch (error) {
        console.error("❌ Erreur mise à jour statut rendez-vous:", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// Route pour la planification d'un rendez-vous d'hôpital
app.put('/api/hospital-appointments/:appointmentId/planning', async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { appointmentDate, requiredDocuments, status } = req.body;

        const appointment = await HospitalAppointment.findByIdAndUpdate(
            appointmentId,
            { 
                appointmentDate,
                requiredDocuments,
                status
            },
            { new: true }
        ).populate('patientId', 'nom prenom email');

        if (!appointment) {
            return res.status(404).json({ message: "Rendez-vous non trouvé." });
        }

        // Créer une notification pour le patient
        await Notification.create({
            userId: appointment.patientId._id,
            message: `Votre rendez-vous à l'hôpital pour la spécialité ${appointment.specialty} a été planifié pour le ${new Date(appointmentDate).toLocaleString('fr-FR')}. Documents requis : ${requiredDocuments}`
        });

        res.status(200).json(appointment);
    } catch (error) {
        console.error("❌ Erreur lors de la planification du rendez-vous:", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// Routes pour les rapports d'ambulance
app.post('/api/ambulance-reports', async (req, res) => {
    try {
        const reportData = req.body;
        const report = new AmbulanceReport(reportData);
        const savedReport = await report.save();

        // Notification pour l'hôpital si spécifié
        if (savedReport.hospitalId) {
            await Notification.create({
                userId: savedReport.hospitalId,
                message: `Nouveau rapport d'ambulance reçu pour un patient ${savedReport.urgencyLevel.toLowerCase()}`
            });
        }

        res.status(201).json({
            message: "✅ Rapport enregistré avec succès !",
            report: savedReport
        });
    } catch (error) {
        console.error("❌ Erreur création rapport:", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// Récupérer les rapports d'un ambulancier
app.get('/api/ambulance-reports/ambulancier/:ambulancierId', async (req, res) => {
    try {
        const { ambulancierId } = req.params;
        const reports = await AmbulanceReport.find({ ambulancierId })
            .populate('hospitalId', 'nom adresse')
            .populate('ambulancierId', 'nom prenom telephone')
            .sort({ createdAt: -1 });

        // Assurons-nous que les détails de l'ambulancier sont bien présents dans chaque rapport
        const formattedReports = reports.map(report => {
            const reportObj = report.toObject();
            
            // Si les détails de l'ambulancier ne sont pas déjà dans ambulancierDetails,
            // les copier depuis l'utilisateur peuplé
            if (!reportObj.ambulancierDetails || !reportObj.ambulancierDetails.nom) {
                reportObj.ambulancierDetails = {
                    nom: report.ambulancierId?.nom || '',
                    prenom: report.ambulancierId?.prenom || '',
                    telephone: report.ambulancierId?.telephone || '',
                    matricule: reportObj.ambulancierDetails?.matricule || ''
                };
            }
            
            return reportObj;
        });

        res.status(200).json(formattedReports);
    } catch (error) {
        console.error("❌ Erreur récupération rapports:", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// Mettre à jour un rapport
app.put('/api/ambulance-reports/:reportId', async (req, res) => {
    try {
        const { reportId } = req.params;
        const updateData = req.body;

        const updatedReport = await AmbulanceReport.findByIdAndUpdate(
            reportId,
            updateData,
            { new: true }
        );

        if (!updatedReport) {
            return res.status(404).json({ message: "Rapport non trouvé." });
        }

        res.status(200).json({
            message: "✅ Rapport mis à jour avec succès !",
            report: updatedReport
        });
    } catch (error) {
        console.error("❌ Erreur mise à jour rapport:", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// Route pour récupérer un rapport spécifique
app.get('/api/ambulance-reports/:reportId', async (req, res) => {
    try {
        const { reportId } = req.params;
        const report = await AmbulanceReport.findById(reportId)
            .populate('hospitalId', 'nom adresse')
            .populate('ambulancierId', 'nom prenom telephone')
            .populate('lastModified.by', 'nom prenom');

        if (!report) {
            return res.status(404).json({ message: "Rapport non trouvé." });
        }

        // Formatage du rapport pour inclure toutes les informations
        const formattedReport = {
            ...report.toObject(),
            ambulancierDetails: {
                nom: report.ambulancierDetails?.nom || report.ambulancierId?.nom || '',
                prenom: report.ambulancierDetails?.prenom || report.ambulancierId?.prenom || '',
                telephone: report.ambulancierDetails?.telephone || report.ambulancierId?.telephone || '',
                matricule: report.ambulancierDetails?.matricule || ''
            },
            patientInfo: report.patientInfo || {},
            missionDetails: {
                ...report.missionDetails,
                pickupTime: report.missionDetails?.pickupTime,
                dropoffTime: report.missionDetails?.dropoffTime,
                distance: report.missionDetails?.distance,
                vehiculeId: report.missionDetails?.vehiculeId
            },
            medicalInfo: {
                ...report.medicalInfo,
                vitals: report.medicalInfo?.vitals || {},
                interventions: report.medicalInfo?.interventions || [],
                medications: report.medicalInfo?.medications || []
            },
            urgencyLevel: report.urgencyLevel,
            status: report.status,
            notes: report.notes,
            hospitalInfo: report.hospitalId ? {
                nom: report.hospitalId.nom,
                adresse: report.hospitalId.adresse
            } : null,
            lastModified: report.lastModified ? {
                date: report.lastModified.date,
                by: report.lastModified.by ? {
                    nom: report.lastModified.by.nom,
                    prenom: report.lastModified.by.prenom
                } : null
            } : null,
            createdAt: report.createdAt
        };

        res.status(200).json(formattedReport);
    } catch (error) {
        console.error("❌ Erreur récupération rapport:", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// Routes pour la gestion des véhicules
app.post('/api/vehicles', async (req, res) => {
    try {
        const vehicleData = req.body;
        const vehicle = new Vehicle(vehicleData);
        await vehicle.save();
        res.status(201).json({
            message: "✅ Véhicule enregistré avec succès !",
            vehicle
        });
    } catch (error) {
        console.error("❌ Erreur création véhicule:", error);
        res.status(500).json({ 
            message: "Erreur lors de l'enregistrement du véhicule.",
            error: error.message 
        });
    }
});

app.get('/api/vehicles', async (req, res) => {
    try {
        const vehicles = await Vehicle.find().sort({ createdAt: -1 });
        res.status(200).json(vehicles);
    } catch (error) {
        console.error("❌ Erreur récupération véhicules:", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

app.put('/api/vehicles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = {
            ...req.body,
            updatedAt: new Date()
        };
        
        const vehicle = await Vehicle.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!vehicle) {
            return res.status(404).json({ message: "Véhicule non trouvé." });
        }

        res.status(200).json({
            message: "✅ Véhicule mis à jour avec succès !",
            vehicle
        });
    } catch (error) {
        console.error("❌ Erreur mise à jour véhicule:", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

app.delete('/api/vehicles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const vehicle = await Vehicle.findByIdAndDelete(id);
        
        if (!vehicle) {
            return res.status(404).json({ message: "Véhicule non trouvé." });
        }

        res.status(200).json({ message: "✅ Véhicule supprimé avec succès !" });
    } catch (error) {
        console.error("❌ Erreur suppression véhicule:", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// Récupérer tous les articles
app.get('/api/articles', async (req, res) => {
  try {
    const articles = await Article.find()
      .populate('authorId', 'nom prenom')
      .sort({ createdAt: -1 });
    res.status(200).json(articles);
  } catch (error) {
    console.error("❌ Erreur récupération articles:", error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération des articles.",
      error: error.message 
    });
  }
});

// Routes pour les commentaires
app.post('/api/comments', async (req, res) => {
    try {
        const { articleId, authorId, content } = req.body;
        
        if (!articleId || !authorId || !content) {
            return res.status(400).json({ message: "Tous les champs sont requis." });
        }

        const comment = new Comment({
            articleId,
            authorId,
            content
        });

        const savedComment = await comment.save();
        
        // Populate author info
        const populatedComment = await Comment.findById(savedComment._id)
            .populate('authorId', 'nom prenom');

        res.status(201).json({
            message: "✅ Commentaire ajouté avec succès !",
            comment: populatedComment
        });
    } catch (error) {
        console.error("❌ Erreur ajout commentaire:", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// Récupérer les commentaires d'un article
app.get('/api/comments/:articleId', async (req, res) => {
    try {
        const { articleId } = req.params;
        const comments = await Comment.find({ articleId })
            .populate('authorId', 'nom prenom')
            .sort({ createdAt: -1 });

        res.status(200).json(comments);
    } catch (error) {
        console.error("❌ Erreur récupération commentaires:", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// Supprimer un commentaire
app.delete('/api/comments/:commentId', async (req, res) => {
    try {
        const { commentId } = req.params;
        const comment = await Comment.findByIdAndDelete(commentId);
        
        if (!comment) {
            return res.status(404).json({ message: "Commentaire non trouvé." });
        }

        res.status(200).json({ message: "✅ Commentaire supprimé avec succès !" });
    } catch (error) {
        console.error("❌ Erreur suppression commentaire:", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// Lancer le serveur
app.listen(5001, () => {
    console.log('🚀 Server is running at http://localhost:5001');
});

// Configuration pour les rapports médicaux
const medicalReportStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const path = './uploads/medical-reports';
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }
    cb(null, path);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `medical-report-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const uploadMedicalReport = multer({
  storage: medicalReportStorage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non supporté. Utilisez PDF, JPEG ou PNG.'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

// Route pour créer un rapport médical
app.post('/api/medical-reports', uploadMedicalReport.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier n'a été téléchargé." });
    }

    const { doctorId, patientId, appointmentId, description } = req.body;

    const medicalReport = new MedicalReport({
      doctorId,
      patientId,
      appointmentId,
      fileUrl: req.file.path.replace('Backend/', ''),
      description
    });

    await medicalReport.save();

    // Créer une notification pour le patient
    await Notification.create({
      userId: patientId,
      message: "Un nouveau rapport médical est disponible"
    });

    res.status(201).json({
      message: "✅ Rapport médical créé avec succès !",
      report: medicalReport
    });
  } catch (error) {
    console.error("❌ Erreur création rapport médical:", error);
    res.status(500).json({ message: "Erreur lors de la création du rapport médical." });
  }
});

// Route pour récupérer les rapports médicaux d'un patient
app.get('/api/medical-reports/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const reports = await MedicalReport.find({ patientId })
      .populate('doctorId', 'nom prenom')
      .populate('appointmentId', 'date')
      .sort({ createdAt: -1 });

    res.status(200).json(reports);
  } catch (error) {
    console.error("❌ Erreur récupération rapports:", error);
    res.status(500).json({ message: "Erreur lors de la récupération des rapports." });
  }
});

// Route pour récupérer les rapports médicaux créés par un docteur
app.get('/api/medical-reports/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    console.log('🔍 Recherche des rapports pour doctorId:', doctorId);

    const reports = await MedicalReport.find({ doctorId })
      .populate('patientId', 'nom prenom email')
      .populate('appointmentId', 'date')
      .populate('doctorId', 'nom prenom')
      .sort({ createdAt: -1 });

    console.log('📊 Rapports bruts trouvés:', JSON.stringify(reports, null, 2));

    // Filtrer les rapports invalides
    const validReports = reports.filter(report => {
      const isValid = report && report.patientId && report.appointmentId && report.doctorId;
      if (!isValid) {
        console.log('⚠️ Rapport invalide détecté:', report);
      }
      return isValid;
    });

    console.log('✅ Nombre de rapports valides:', validReports.length);
    console.log('📝 Rapports valides:', JSON.stringify(validReports, null, 2));

    res.status(200).json(validReports);
  } catch (error) {
    console.error("❌ Erreur récupération rapports:", error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération des rapports.",
      error: error.message 
    });
  }
});

// Route pour récupérer les patients liés à un docteur (via les rendez-vous)
app.get('/api/doctor/:doctorId/patients', async (req, res) => {
  try {
    const { doctorId } = req.params;
    console.log('🔍 Recherche des patients pour doctorId:', doctorId);

    // 1. Récupérer tous les rendez-vous confirmés du docteur
    const appointments = await Appointment.find({ 
      doctorId,
      status: 'confirmed' // Ne prendre que les rendez-vous confirmés
    })
    .populate({
      path: 'patientId',
      select: 'nom prenom email telephone',
      model: 'User'
    })
    .sort({ date: -1 });

    console.log('📊 Nombre de rendez-vous trouvés:', appointments.length);

    // 2. Filtrer les patients uniques et valides
    const uniquePatientsMap = new Map();
    appointments.forEach(apt => {
      if (apt.patientId && apt.patientId._id && !uniquePatientsMap.has(apt.patientId._id.toString())) {
        uniquePatientsMap.set(apt.patientId._id.toString(), apt.patientId);
      }
    });

    const patients = Array.from(uniquePatientsMap.values());
    console.log('✅ Nombre de patients uniques:', patients.length);

    // 3. Vérifier si nous avons des patients
    if (patients.length === 0) {
      console.log('⚠️ Aucun patient trouvé pour ce docteur');
      return res.status(200).json([]);
    }

    console.log('📝 Liste des patients:', patients.map(p => ({
      id: p._id,
      nom: p.nom,
      prenom: p.prenom
    })));

    res.status(200).json(patients);
  } catch (error) {
    console.error("❌ Erreur récupération patients:", error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération des patients.",
      error: error.message 
    });
  }
});

// Route pour supprimer un rapport médical
app.delete('/api/medical-reports/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    
    // Trouver le rapport avant de le supprimer pour récupérer le chemin du fichier
    const report = await MedicalReport.findById(reportId);
    
    if (!report) {
      return res.status(404).json({ message: "Rapport non trouvé." });
    }

    // Supprimer le fichier physique
    const filePath = path.join(__dirname, report.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Supprimer le rapport de la base de données
    await MedicalReport.findByIdAndDelete(reportId);

    res.status(200).json({ message: "✅ Rapport supprimé avec succès !" });
  } catch (error) {
    console.error("❌ Erreur suppression rapport:", error);
    res.status(500).json({ message: "Erreur lors de la suppression du rapport." });
  }
});

// Route pour la planification d'un rendez-vous médical
app.put('/api/appointments/:appointmentId/planning', async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { appointmentDate, requiredDocuments, status } = req.body;

        const appointment = await Appointment.findByIdAndUpdate(
            appointmentId,
            { 
                date: appointmentDate,
                requiredDocuments,
                status
            },
            { new: true }
        ).populate('patientId', 'nom prenom email');

        if (!appointment) {
            return res.status(404).json({ message: "Rendez-vous non trouvé." });
        }

        // Créer une notification pour le patient
        await Notification.create({
            userId: appointment.patientId._id,
            message: `Votre rendez-vous médical a été planifié pour le ${new Date(appointmentDate).toLocaleString('fr-FR')}. Documents requis : ${requiredDocuments}`
        });

        res.status(200).json(appointment);
    } catch (error) {
        console.error("❌ Erreur lors de la planification du rendez-vous:", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// Route pour la planification d'un rendez-vous laboratoire
app.put('/api/lab-appointments/:appointmentId/planning', async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { appointmentDate, requiredDocuments, status } = req.body;

        const appointment = await Appointment.findByIdAndUpdate(
            appointmentId,
            { 
                date: appointmentDate,
                requiredDocuments,
                status
            },
            { new: true }
        ).populate('patientId', 'nom prenom email');

        if (!appointment) {
            return res.status(404).json({ message: "Rendez-vous non trouvé." });
        }

        // Créer une notification pour le patient
        await Notification.create({
            userId: appointment.patientId._id,
            message: `Votre rendez-vous au laboratoire a été planifié pour le ${new Date(appointmentDate).toLocaleString('fr-FR')}. Documents requis : ${requiredDocuments}`
        });

        res.status(200).json(appointment);
    } catch (error) {
        console.error("❌ Erreur lors de la planification du rendez-vous:", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// Ajouter cette route avant la route de messagerie existante
app.get('/api/messages/unread/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      console.log("❌ Pas d'userId fourni pour la requête de messages non lus");
      return res.status(400).json({ message: 'userId requis' });
    }

    console.log("🔍 Recherche des messages non lus pour userId:", userId);
    const unreadMessages = await Message.find({
      receiverId: userId,
      isRead: false
    });
    
    console.log(`✅ ${unreadMessages.length} messages non lus trouvés pour l'utilisateur ${userId}`);
    res.status(200).json(unreadMessages);
  } catch (error) {
    console.error('❌ Erreur récupération messages non lus:', error);
    res.status(500).json({ 
      message: 'Erreur serveur.',
      error: error.message 
    });
  }
});

// Ajouter cette route pour marquer les messages comme lus
app.put('/api/messages/read', async (req, res) => {
  try {
    const { messageIds } = req.body;
    await Message.updateMany(
      { _id: { $in: messageIds } },
      { $set: { isRead: true } }
    );
    res.status(200).json({ message: 'Messages marqués comme lus.' });
  } catch (error) {
    console.error('❌ Erreur mise à jour messages:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// ... existing code ...

// Route pour uploader l'avatar d'un utilisateur
app.post('/api/users/:userId/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier n'a été téléchargé." });
    }

    const { userId } = req.params;
    const photoPath = `/uploads/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { photo: photoPath },
      { new: true }
    );

    if (!updatedUser) {
      // Supprimer le fichier si l'utilisateur n'existe pas
      fs.unlinkSync(path.join(__dirname, req.file.path));
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.json({
      message: "Avatar mis à jour avec succès",
      photo: photoPath
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'avatar:', error);
    // Supprimer le fichier en cas d'erreur
    if (req.file) {
      fs.unlinkSync(path.join(__dirname, req.file.path));
    }
    res.status(500).json({ 
      message: "Erreur lors de la mise à jour de l'avatar",
      error: error.message 
    });
  }
});

// Route pour mettre à jour le profil utilisateur
app.put('/api/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const updateData = req.body;
        
        console.log("🔄 Mise à jour du profil pour l'utilisateur:", userId);
        console.log("📝 Données reçues:", updateData);
        
        // Supprimer les champs sensibles qui ne doivent pas être modifiés
        delete updateData.password;
        delete updateData.roles;
        delete updateData.isValidated;
        delete updateData.profileCompleted;

        // Extraire les données spécifiques au patient
        const patientData = {
            emergencyContact: {
                phone: updateData.emergencyPhone
            },
            bloodType: updateData.bloodType,
            medicalHistory: updateData.chronicDiseases
        };

        console.log("👤 Données patient à mettre à jour:", patientData);

        // Supprimer les données patient de updateData
        delete updateData.emergencyPhone;
        delete updateData.bloodType;
        delete updateData.chronicDiseases;

        // Mettre à jour l'utilisateur
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            console.log("❌ Utilisateur non trouvé");
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        console.log("✅ Utilisateur mis à jour:", updatedUser);

        // Si c'est un patient, mettre à jour ou créer les informations patient
        if (updatedUser.roles.includes('Patient')) {
            console.log("👤 Mise à jour des informations patient");
            let patient = await Patient.findOne({ userId });
            
            if (!patient) {
                console.log("📝 Création d'un nouveau profil patient");
                patient = new Patient({ userId });
            }
            
            // Mise à jour des informations patient
            patient.emergencyContact = patientData.emergencyContact;
            patient.bloodType = patientData.bloodType;
            patient.medicalHistory = patientData.medicalHistory;
            
            await patient.save();
            console.log("✅ Informations patient mises à jour:", patient);

            // Vérifier que les données ont bien été sauvegardées
            const verifyPatient = await Patient.findOne({ userId });
            console.log("🔍 Vérification des données patient après sauvegarde:", verifyPatient);
        }

        // Ne pas renvoyer le mot de passe dans la réponse
        const userResponse = updatedUser.toObject();
        delete userResponse.password;

        // Ajouter les informations patient à la réponse
        userResponse.emergencyPhone = patientData.emergencyContact.phone;
        userResponse.bloodType = patientData.bloodType;
        userResponse.chronicDiseases = patientData.medicalHistory;

        console.log("📤 Réponse finale:", userResponse);
        res.json(userResponse);
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du profil:', error);
        res.status(500).json({ 
            message: "Erreur lors de la mise à jour du profil",
            error: error.message 
        });
    }
});

// ... rest of the code ...

// Modèle pour les messages entre laboratoires et patients
const LabPatientMessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, required: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const LabPatientMessage = mongoose.model('LabPatientMessage', LabPatientMessageSchema);

// ... existing code ...

// Routes pour la messagerie laboratoire-patient
app.get('/api/lab-patients/:labId', async (req, res) => {
  try {
    // Récupérer tous les patients qui ont eu des rendez-vous avec ce laboratoire
    const appointments = await LabAppointment.find({ lab: req.params.labId })
      .populate('patient', 'nom prenom email telephone');
    
    // Extraire les patients uniques
    const uniquePatients = Array.from(
      new Map(
        appointments.map(apt => [
          apt.patient._id.toString(),
          apt.patient
        ])
      ).values()
    );
    
    res.json(uniquePatients);
  } catch (error) {
    console.error('Erreur lors de la récupération des patients:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/lab-patient-messages/:labId/:patientId', async (req, res) => {
  try {
    const messages = await LabPatientMessage.find({
      $or: [
        { senderId: req.params.labId, receiverId: req.params.patientId },
        { senderId: req.params.patientId, receiverId: req.params.labId }
      ]
    }).sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/lab-patient-messages', async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;
    
    const message = new LabPatientMessage({
      senderId,
      receiverId,
      content
    });
    
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.put('/api/lab-patient-messages/read', async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    
    await LabPatientMessage.updateMany(
      { senderId, receiverId, isRead: false },
      { isRead: true }
    );
    
    res.json({ message: 'Messages marqués comme lus' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des messages:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ... existing code ...

// Route pour les messages entre patients et laboratoires
app.post('/api/messages', async (req, res) => {
  try {
    const { senderId, receiverId, content, appointmentId } = req.body;
    console.log('Received message request:', { senderId, receiverId, content, appointmentId });
    
    if (!senderId || !receiverId || !content || !appointmentId) {
      console.log('Missing required fields:', { senderId, receiverId, content, appointmentId });
      return res.status(400).json({ 
        message: 'Tous les champs sont requis.',
        missing: {
          senderId: !senderId,
          receiverId: !receiverId,
          content: !content,
          appointmentId: !appointmentId
        }
      });
    }

    const message = new Message({
      senderId,
      receiverId,
      content,
      appointmentId,
      isRead: false
    });

    console.log('Creating message:', message);
    await message.save();
    console.log('Message saved successfully');

    // Create a notification for the receiver
    await Notification.create({
      userId: receiverId,
      message: 'Nouveau message reçu'
    });

    res.status(201).json({ message: 'Message envoyé.', data: message });
  } catch (error) {
    console.error('Error in /api/messages:', error);
    res.status(500).json({ 
      message: 'Erreur serveur.',
      error: error.message 
    });
  }
});

// Route pour récupérer les messages entre un patient et un laboratoire
app.get('/api/messages/:senderId/:receiverId', async (req, res) => {
  try {
    const { senderId, receiverId } = req.params;
    const messages = await Message.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ],
      type: 'lab-patient'
    })
    .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error('❌ Erreur récupération messages:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});




// ✅ Route pour récupérer les données d'un utilisateur spécifique par ID
app.get('/api/users/:id', async(req, res) => {
    const { id } = req.params;

    try {
        console.log("🔍 Recherche de l'utilisateur avec l'ID:", id);
        const user = await User.findById(id).select('-password');
        
        if (!user) {
            console.log("❌ Utilisateur non trouvé pour l'ID:", id);
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        console.log("✅ Utilisateur trouvé:", user);

        // Si l'utilisateur est un patient, récupérer les informations supplémentaires
        if (user.roles.includes('Patient')) {
            console.log("👤 L'utilisateur est un patient, recherche des informations supplémentaires...");
            const patientInfo = await Patient.findOne({ userId: id });
            console.log("📋 Informations patient trouvées:", patientInfo);
            
            const userResponse = user.toObject();
            
            // Vérifier si patientInfo existe et contient les données
            if (patientInfo) {
                // Priorité : utiliser les champs directs d'abord, sinon emergencyContact
                userResponse.emergencyPhone = patientInfo.emergencyPhone || patientInfo.emergencyContact?.phone || '';
                userResponse.bloodType = patientInfo.bloodType || '';
                userResponse.chronicDiseases = patientInfo.chronicDiseases || patientInfo.medicalHistory || '';
                console.log("✅ Informations patient ajoutées:", {
                    emergencyPhone: userResponse.emergencyPhone,
                    bloodType: userResponse.bloodType,
                    chronicDiseases: userResponse.chronicDiseases
                });
            } else {
                console.log("⚠️ Aucune information patient trouvée, création d'un nouveau document Patient");
                // Créer un nouveau document Patient si n'existe pas
                const newPatient = new Patient({
                    userId: id,
                    emergencyContact: { phone: '' },
                    bloodType: '',
                    medicalHistory: ''
                });
                await newPatient.save();
                console.log("✅ Nouveau document Patient créé");
                
                userResponse.emergencyPhone = '';
                userResponse.bloodType = '';
                userResponse.chronicDiseases = '';
            }
            
            console.log("📤 Réponse finale avec informations patient:", userResponse);
            return res.status(200).json(userResponse);
        }

        console.log("📤 Réponse finale (non patient):", user);
        res.status(200).json(user);
    } catch (error) {
        console.error('❌ Erreur récupération utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});


app.put('/api/users/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const updateData = req.body;
        
        console.log("🔄 Mise à jour du profil pour l'utilisateur:", userId);
        console.log("📝 Données reçues:", updateData);
        
        // Supprimer les champs sensibles qui ne doivent pas être modifiés
        delete updateData.password;
        delete updateData.roles;
        delete updateData.isValidated;
        delete updateData.profileCompleted;

        // Extraire les données spécifiques au patient
        const patientData = {
            emergencyContact: {
                phone: updateData.emergencyPhone
            },
            bloodType: updateData.bloodType,
            medicalHistory: updateData.chronicDiseases
        };

        console.log("👤 Données patient à mettre à jour:", patientData);

        // Supprimer les données patient de updateData
        delete updateData.emergencyPhone;
        delete updateData.bloodType;
        delete updateData.chronicDiseases;

        // Mettre à jour l'utilisateur
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            console.log("❌ Utilisateur non trouvé");
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        console.log("✅ Utilisateur mis à jour:", updatedUser);

        // Si c'est un patient, mettre à jour ou créer les informations patient
        if (updatedUser.roles.includes('Patient')) {
            console.log("👤 Mise à jour des informations patient");
            let patient = await Patient.findOne({ userId });
            
            if (!patient) {
                console.log("📝 Création d'un nouveau profil patient");
                patient = new Patient({ userId });
            }
            
            // Mise à jour des informations patient
            patient.emergencyContact = patientData.emergencyContact;
            patient.bloodType = patientData.bloodType;
            patient.medicalHistory = patientData.medicalHistory;
            
            await patient.save();
            console.log("✅ Informations patient mises à jour:", patient);

            // Vérifier que les données ont bien été sauvegardées
            const verifyPatient = await Patient.findOne({ userId });
            console.log("🔍 Vérification des données patient après sauvegarde:", verifyPatient);
        }

        // Ne pas renvoyer le mot de passe dans la réponse
        const userResponse = updatedUser.toObject();
        delete userResponse.password;

        // Ajouter les informations patient à la réponse
        userResponse.emergencyPhone = patientData.emergencyContact.phone;
        userResponse.bloodType = patientData.bloodType;
        userResponse.chronicDiseases = patientData.medicalHistory;

        console.log("📤 Réponse finale:", userResponse);
        res.json(userResponse);
    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du profil:', error);
        res.status(500).json({ 
            message: "Erreur lors de la mise à jour du profil",
            error: error.message 
        });
    }
});
// ... existing code ...

// Endpoint pour récupérer les statistiques du cabinet
app.get('/api/cabinet/stats/:cabinetId', async (req, res) => {
  try {
    const { cabinetId } = req.params;
    
    // Récupérer le cabinet et son médecin associé
    const cabinet = await User.findById(cabinetId);
    if (!cabinet) {
      return res.status(404).json({ message: "Cabinet non trouvé" });
    }

    // Récupérer tous les rendez-vous du médecin associé
    const appointments = await Appointment.find({ doctorId: cabinet.linkedDoctorId });

    // Calculer les statistiques
    const stats = {
      totalAppointments: appointments.length,
      pendingAppointments: appointments.filter(apt => apt.status === 'pending').length,
      completedAppointments: appointments.filter(apt => apt.status === 'completed').length,
      cancelledAppointments: appointments.filter(apt => apt.status === 'cancelled').length,
      averageRating: 0 // À implémenter si vous avez un système de notation
    };

    res.json(stats);
  } catch (error) {
    console.error("❌ Erreur récupération statistiques cabinet:", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des statistiques" });
  }
});

// ... existing code ...

// Exemple d'utilisation sur une route protégée
app.get('/protected-route', auth, (req, res) => {
    // Votre logique de route ici
});


