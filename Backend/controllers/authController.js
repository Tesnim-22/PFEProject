// Exemple dans authController.js

exports.login = async(req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: "Utilisateur non trouvé" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Mot de passe incorrect" });
        }

        res.status(200).json({
            userId: user._id,
            email: user.email, // ✅ ESSENTIEL
            role: user.role,
            profileCompleted: user.profileCompleted,
        });
    } catch (error) {
        console.error("Erreur login :", error);
        res.status(500).json({ message: "Erreur interne du serveur" });
    }
};