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

// ❗ Correction ici
const Appointment = require('./models/Appointment');
const Notification = require('./models/Notification');

// middlewares
app.use(cors());
app.use(express.json());




// 🟰 Tu pourras ensuite continuer ici avec ta logique MongoDB, schemas, etc.


// Middleware



// Configurer le dossier d’upload
const uploadFolder = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder);
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
        console.error('❌ Erreur d\’enregistrement :', error);
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


// ✅ Route pour récupérer les données d’un utilisateur par ID (profil)
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
        const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json(notifications);
    } catch (error) {
        console.error("❌ Erreur notifications :", error);
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



// Lancer le serveur
app.listen(5001, () => {
    console.log('🚀 Server is running at http://localhost:5001');
});