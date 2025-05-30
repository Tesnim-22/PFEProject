const express = require('express');
const router = express.Router();
const AdminNotification = require('../models/AdminNotification');
const Notification = require('../models/Notification');

// Récupérer les notifications pour un laboratoire spécifique
router.get('/lab/:labId', async (req, res) => {
    try {
        const { labId } = req.params;
        
        // Récupérer les notifications admin destinées aux laboratoires ou à tous
        const adminNotifications = await AdminNotification.find({
            $or: [
                { recipientType: 'all' },
                { recipientType: 'labs' },
                { 
                    recipientType: 'specific',
                    recipients: labId 
                }
            ],
            status: 'sent'
        })
        .populate('sentBy', 'nom prenom')
        .sort({ createdAt: -1 })
        .lean();

        // Récupérer les notifications personnelles pour ce laboratoire
        const personalNotifications = await Notification.find({ userId: labId })
            .sort({ createdAt: -1 })
            .lean();

        // Combiner et formatter les notifications
        const allNotifications = [
            ...adminNotifications.map(notif => ({
                _id: notif._id,
                title: notif.title,
                message: notif.message,
                type: notif.type || 'system',
                priority: notif.priority,
                isRead: false, // Les notifications admin sont toujours marquées comme non lues initialement
                createdAt: notif.createdAt,
                source: 'admin',
                sentBy: notif.sentBy
            })),
            ...personalNotifications.map(notif => ({
                _id: notif._id,
                title: notif.title,
                message: notif.message,
                type: 'personal',
                isRead: notif.read,
                createdAt: notif.createdAt,
                source: 'system'
            }))
        ];

        // Trier par date de création (plus récent en premier)
        allNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json(allNotifications);
    } catch (error) {
        console.error('Erreur lors de la récupération des notifications:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la récupération des notifications',
            error: error.message 
        });
    }
});

// Marquer une notification comme lue (pour les notifications personnelles uniquement)
router.put('/:notificationId/read', async (req, res) => {
    try {
        const { notificationId } = req.params;
        
        // Mettre à jour la notification personnelle
        const notification = await Notification.findByIdAndUpdate(
            notificationId,
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification non trouvée' });
        }

        res.json(notification);
    } catch (error) {
        console.error('Erreur lors du marquage de la notification:', error);
        res.status(500).json({ 
            message: 'Erreur lors du marquage de la notification',
            error: error.message 
        });
    }
});

// Marquer toutes les notifications comme lues pour un laboratoire
router.put('/lab/:labId/read-all', async (req, res) => {
    try {
        const { labId } = req.params;
        
        // Marquer toutes les notifications personnelles comme lues
        await Notification.updateMany(
            { userId: labId },
            { read: true }
        );

        res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
    } catch (error) {
        console.error('Erreur lors du marquage de toutes les notifications:', error);
        res.status(500).json({ 
            message: 'Erreur lors du marquage de toutes les notifications',
            error: error.message 
        });
    }
});

// Supprimer une notification personnelle
router.delete('/:notificationId', async (req, res) => {
    try {
        const { notificationId } = req.params;
        
        const notification = await Notification.findByIdAndDelete(notificationId);

        if (!notification) {
            return res.status(404).json({ message: 'Notification non trouvée' });
        }

        res.json({ message: 'Notification supprimée avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de la notification:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la suppression de la notification',
            error: error.message 
        });
    }
});

// Route pour les administrateurs : créer une nouvelle notification
router.post('/admin/create', async (req, res) => {
    try {
        const { title, message, type, priority, recipientType, recipients, sentBy } = req.body;

        const adminNotification = new AdminNotification({
            title,
            message,
            type: type || 'info',
            priority: priority || 'normal',
            recipientType,
            recipients: recipientType === 'specific' ? recipients : [],
            sentBy,
            status: 'sent'
        });

        await adminNotification.save();
        
        res.status(201).json({
            message: 'Notification admin créée avec succès',
            notification: adminNotification
        });
    } catch (error) {
        console.error('Erreur lors de la création de la notification admin:', error);
        res.status(500).json({ 
            message: 'Erreur lors de la création de la notification admin',
            error: error.message 
        });
    }
});

module.exports = router; 