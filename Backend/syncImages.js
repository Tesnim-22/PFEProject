const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Article = require('./models/Article');

async function syncImages() {
  // Se connecter à MongoDB - Utilisation de votre URI MongoDB actuelle
  await mongoose.connect("mongodb+srv://tesnim:Tesnim.123456789@cluster0.50qhu.mongodb.net/HealthApp?retryWrites=true&w=majority");

  // Récupérer tous les articles avec des images
  const articles = await Article.find({ imageUrl: { $ne: null } });

  // Créer le dossier uploads/articles s'il n'existe pas
  const uploadsDir = path.join(__dirname, 'uploads', 'articles');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  console.log(`Synchronisation de ${articles.length} articles...`);
  
  // Vérifier chaque image
  for (const article of articles) {
    const imagePath = path.join(__dirname, article.imageUrl);
    if (!fs.existsSync(imagePath)) {
      console.log(`Image manquante: ${imagePath}`);
    } else {
      console.log(`Image trouvée: ${imagePath}`);
    }
  }

  console.log('Synchronisation terminée');
  process.exit(0);
}

syncImages().catch(error => {
  console.error('Erreur lors de la synchronisation:', error);
  process.exit(1);
});