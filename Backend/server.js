const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const app = express();
const nodemailer = require('nodemailer');

// Middleware
app.use(express.json());
app.use(cors());
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
    specialty: { type: String },
    diploma: { type: String },
    photo: { type: String },
    linkedDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // ✅ ajouté ici
});



const User = mongoose.model('User', userSchema);

const notificationSchema = new mongoose.Schema({
    message: { type: String, required: true },
    date: { type: Date, default: Date.now }
});
const Notification = mongoose.model('Notification', notificationSchema);

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
        console.error('❌ Erreur d’enregistrement :', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
});

// Login
app.post('/login', async(req, res) => {
    const { email, password } = req.body;
    console.log('👉 Login reçu :', req.body);

    if (!email || !password) return res.status(400).json({ message: "Champs manquants." });

    try {
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(400).json({ message: "Utilisateur non trouvé." });

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return res.status(400).json({ message: "Mot de passe incorrect." });

        console.log("✅ Utilisateur authentifié :", user);

        res.status(200).json({
            message: "Connexion réussie !",
            role: user.roles[0],
            userId: user._id,
            profileCompleted: user.profileCompleted
        });

    } catch (error) {
        console.error("❌ Erreur de connexion :", error);
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
    const { email, linkedDoctorId, specialty } = req.body;

    if (!email || !linkedDoctorId || !specialty) {
        return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    try {
        // Trouver le cabinet à mettre à jour
        const cabinet = await User.findOne({ email: email.toLowerCase() });

        if (!cabinet) return res.status(404).json({ message: "Cabinet introuvable." });

        // Vérifier que le médecin existe
        const doctor = await User.findById(linkedDoctorId);
        if (!doctor || !doctor.roles.includes('Doctor')) {
            return res.status(404).json({ message: "Médecin invalide ou introuvable." });
        }

        cabinet.linkedDoctorId = doctor._id;
        cabinet.specialty = specialty;
        cabinet.profileCompleted = true;

        await cabinet.save();

        res.status(200).json({ message: "✅ Cabinet lié au médecin avec succès !" });
    } catch (error) {
        console.error("❌ Erreur inscription cabinet :", error);
        res.status(500).json({ message: "Erreur serveur lors de l'inscription cabinet." });
    }
});

// Récupération des médecins valides pour l’inscription du cabinet
app.get('/admin/users', async(req, res) => {
    try {
        const doctors = await User.find({
            roles: { $in: ['Doctor'] },
            specialty: { $exists: true, $ne: '' }
        }).select('nom prenom email specialty _id');

        res.status(200).json(doctors);
    } catch (error) {
        console.error("❌ Erreur récupération des médecins :", error);
        res.status(500).json({ message: "Erreur serveur lors de la récupération des médecins." });
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

// Lancer le serveur
app.listen(5001, () => {
    console.log('🚀 Server is running at http://localhost:5001');
});