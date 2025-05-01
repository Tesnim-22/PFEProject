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

// ❗ Correction ici
const Appointment = require('./models/Appointment');
const Notification = require('./models/Notification');
const Patient = require('./models/Patient');
const Message = require('./models/Message');
const LabResult = require('./models/LabResult');
const LabDoctorMessage = require('./models/LabDoctorMessage');
const HospitalAppointment = require('./models/HospitalAppointment');
const AmbulanceReport = require('./models/AmbulanceReport');
const Vehicle = require('./models/Vehicle');
const Article = require('./models/Article');
const Comment = require('./models/Comment');

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

    // 🔥 ➡️ AJOUTE ICI et BIEN fermer l'accolade !
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
});





const User = mongoose.model('User', userSchema);

const notificationSchema = new mongoose.Schema({
    message: { type: String, required: true },
    date: { type: Date, default: Date.now }
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
        role
    } = req.body;

    if (!nom || !prenom || !dateNaissance || !email || !telephone || !adresse || !cin || !password || !role) {
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
            roles: [role]
        });

        await newUser.save();
        res.status(201).json({ message: 'Utilisateur inscrit avec succès !' });
    } catch (error) {
        console.error('❌ Erreur d\enregistrement :', error);
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

        // ✅ Connexion acceptée
        res.status(200).json({
            message: "Connexion réussie !",
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
        const updateData = {
            emergencyPhone,
            bloodType,
            chronicDiseases,
            profileCompleted: true
        };

        if (photoPath) {
            updateData.photo = photoPath;
        }

        const updated = await User.findByIdAndUpdate(id, updateData, { new: true });

        if (!updated) return res.status(404).json({ message: "Patient non trouvé." });

        res.status(200).json({ message: "Profil patient mis à jour avec succès ✅", user: updated });
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
        const allNotifications = await Notification.find().sort({ date: -1 }); // tri du plus récent
        res.status(200).json(allNotifications);
    } catch (error) {
        console.error("❌ Erreur récupération des notifications :", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des notifications." });
    }
});

app.post('/admin/notify', async(req, res) => {
    const { message } = req.body;

    if (!message || message.trim() === '') {
        return res.status(400).json({ message: "Le message est requis." });
    }

    try {
        const notif = new Notification({ message });
        await notif.save();
        res.status(201).json({ message: "✅ Notification envoyée !" });
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
        const user = await User.findById(id).select('-password'); // ne renvoie pas le mot de passe pour sécurité
        if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé.' });

        res.status(200).json(user);
    } catch (error) {
        console.error('❌ Erreur récupération utilisateur:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// Créer un nouvel article
app.post('/api/articles', uploadArticleImage.single('image'), async (req, res) => {
  try {
    const { title, content, category, tags, authorId } = req.body;
    
    if (!title || !content || !category || !authorId) {
      return res.status(400).json({ message: "Tous les champs requis doivent être remplis." });
    }

    const article = new Article({
      title,
      content,
      authorId,
      category,
      tags: tags ? JSON.parse(tags) : [],
      imageUrl: req.file ? req.file.path : null // Cloudinary retourne directement l'URL
    });

    const savedArticle = await article.save();
    res.status(201).json({
      message: "✅ Article publié avec succès !",
      article: savedArticle
    });
  } catch (error) {
    console.error("❌ Erreur création article:", error);
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
        const doctors = await User.find({
            roles: { $in: ['cabinet', 'hopital', 'Doctor', 'Hospital'] },
            isValidated: true,
            profileCompleted: true
        }).select('_id nom prenom email specialty roles');

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
        const notifications = await Notification.find({ userId })
            .sort({ createdAt: -1 }) // Utiliser createdAt pour le tri
            .lean(); // Pour une meilleure performance

        res.status(200).json(notifications);
    } catch (error) {
        console.error("❌ Erreur notifications:", error);
        res.status(500).json({ message: "Erreur serveur" });
    }
});


// 🆕 Route pour créer un rendez-vous patient
app.post('/api/appointments', async(req, res) => {
    try {
        const { doctorId, patientId, date, reason } = req.body;

        if (!doctorId || !patientId || !date) {
            return res.status(400).json({ message: "Champs obligatoires manquants." });
        }

        const appointment = new Appointment({
            doctorId,
            patientId,
            date,
            reason
        });

        await appointment.save();

        res.status(201).json({ message: "✅ Rendez-vous enregistré avec succès !" });
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
    const { senderId, receiverId, appointmentId, content } = req.body;
    if (!senderId || !receiverId || !appointmentId || !content) {
      return res.status(400).json({ message: 'Champs manquants.' });
    }
    const message = new Message({ senderId, receiverId, appointmentId, content });
    await message.save();
    res.status(201).json({ message: 'Message envoyé.', data: message });
  } catch (error) {
    console.error('❌ Erreur envoi message:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
  }
});

// Récupérer les messages pour un rendez-vous donné (patient et médecin)
app.get('/api/messages/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const messages = await Message.find({ appointmentId }).sort({ sentAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    console.error('❌ Erreur récupération messages:', error);
    res.status(500).json({ message: 'Erreur serveur.' });
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
        const { labId, patientId, date, reason } = req.body;
        console.log('📝 Création rendez-vous laboratoire:', { labId, patientId, date, reason });

        if (!labId || !patientId || !date || !reason) {
            return res.status(400).json({ message: "Tous les champs sont requis." });
        }

        const appointment = new Appointment({
            doctorId: labId,
            patientId,
            date,
            reason,
            type: 'laboratory',
            status: 'pending'
        });

        const savedAppointment = await appointment.save();
        console.log('✅ Rendez-vous laboratoire créé:', savedAppointment);

        // Créer une notification pour le laboratoire
        await Notification.create({
            userId: labId,
            message: `Nouveau rendez-vous demandé pour le ${new Date(date).toLocaleString('fr-FR')}`
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
            fileUrl: req.file ? req.file.path.replace('Backend/', '') : null
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