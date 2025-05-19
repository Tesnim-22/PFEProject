const { verifyToken } = require('../config/jwt');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Authentification requise.' });
        }

        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('❌ Erreur d\'authentification :', error);
        res.status(401).json({ message: 'Token invalide ou expiré.' });
    }
};

module.exports = auth; 