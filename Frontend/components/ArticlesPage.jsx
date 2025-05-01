import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/ArticlesPage.css';
import { FaUser, FaCalendar, FaTag, FaFolder, FaTimes } from 'react-icons/fa';

const ArticlesPage = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5001/api/articles');
      setArticles(response.data);
      
      const uniqueCategories = [...new Set(response.data.map(article => article.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Erreur lors de la récupération des articles:', error);
      setError('Impossible de charger les articles.');
    } finally {
      setLoading(false);
    }
  };

  const handleReadMore = (article) => {
    setSelectedArticle(article);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedArticle(null);
    setShowModal(false);
  };

  const filteredArticles = articles.filter(article => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (article.authorId?.nom + ' ' + article.authorId?.prenom).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const ArticleModal = ({ article, onClose }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const userId = localStorage.getItem('userId'); // Assurez-vous d'avoir l'ID de l'utilisateur connecté

    useEffect(() => {
      fetchComments();
    }, [article._id]);

    const fetchComments = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/comments/${article._id}`);
        setComments(response.data);
      } catch (error) {
        console.error('Erreur récupération commentaires:', error);
      }
    };

    const handleAddComment = async () => {
      if (!newComment.trim()) return;

      try {
        setLoading(true);
        await axios.post('http://localhost:5001/api/comments', {
          articleId: article._id,
          authorId: userId,
          content: newComment
        });
        setNewComment('');
        await fetchComments();
      } catch (error) {
        console.error('Erreur ajout commentaire:', error);
      } finally {
        setLoading(false);
      }
    };

    const handleDeleteComment = async (commentId) => {
      try {
        await axios.delete(`http://localhost:5001/api/comments/${commentId}`);
        await fetchComments();
      } catch (error) {
        console.error('Erreur suppression commentaire:', error);
      }
    };

    if (!article) return null;

    return (
      <div className="article-modal-overlay" onClick={onClose}>
        <div className="article-modal-content" onClick={e => e.stopPropagation()}>
          <button className="modal-close-button" onClick={onClose}>
            <FaTimes />
          </button>
          {article.imageUrl && (
            <div className="modal-article-image">
              <img src={article.imageUrl} alt={article.title} className="article-image" />
            </div>
          )}
          <div className="modal-article-content">
            <h2>{article.title}</h2>
            <div className="article-metadata">
              <span className="author">
                <FaUser />
                Dr. {article.authorId?.prenom} {article.authorId?.nom}
              </span>
              <span className="date">
                <FaCalendar />
                {new Date(article.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div className="article-category">
              <FaFolder />
              {article.category}
            </div>
            <div className="article-full-content">
              {article.content}
            </div>
            {article.tags && article.tags.length > 0 && (
              <div className="article-tags">
                <FaTag />
                {article.tags.map((tag, index) => (
                  <span key={index} className="tag">#{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* Section commentaires */}
          <div className="article-comments">
            <h3>Commentaires</h3>
            
            {/* Formulaire d'ajout de commentaire */}
            <div className="comment-form">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Ajouter un commentaire..."
                rows="3"
              />
              <button 
                onClick={handleAddComment}
                disabled={loading || !newComment.trim()}
                className="comment-submit"
              >
                {loading ? 'Envoi...' : 'Publier'}
              </button>
            </div>

            {/* Liste des commentaires */}
            <div className="comments-list">
              {comments.map((comment) => (
                <div key={comment._id} className="comment">
                  <div className="comment-header">
                    <span className="comment-author">
                      Dr. {comment.authorId.prenom} {comment.authorId.nom}
                    </span>
                    <span className="comment-date">
                      {new Date(comment.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  <p className="comment-content">{comment.content}</p>
                  {comment.authorId._id === userId && (
                    <button
                      onClick={() => handleDeleteComment(comment._id)}
                      className="delete-comment"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="articles-loading">
        <div className="loader"></div>
        <p>Chargement des articles...</p>
      </div>
    );
  }

  if (error) {
    return <div className="articles-error">{error}</div>;
  }

  return (
    <div className="articles-page">
      <div className="articles-header">
        <h1>Articles Médicaux</h1>
        <div className="articles-filters">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-filter"
          >
            <option value="all">Toutes les catégories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="articles-grid">
        {filteredArticles.map(article => (
          <article key={article._id} className="article-card">
            {article.imageUrl && (
              <div className="article-image">
                <img src={article.imageUrl} alt={article.title} className="article-image" />
              </div>
            )}
            <div className="article-content">
              <h2>{article.title}</h2>
              <div className="article-metadata">
                <span className="author">
                  <FaUser />
                  Dr. {article.authorId?.prenom} {article.authorId?.nom}
                </span>
                <span className="date">
                  <FaCalendar />
                  {new Date(article.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="article-category">
                <FaFolder />
                {article.category}
              </div>
              <p className="article-excerpt">{article.content.substring(0, 150)}...</p>
              {article.tags && article.tags.length > 0 && (
                <div className="article-tags">
                  <FaTag />
                  {article.tags.map((tag, index) => (
                    <span key={index} className="tag">#{tag}</span>
                  ))}
                </div>
              )}
              <button className="read-more" onClick={() => handleReadMore(article)}>
                Lire la suite
              </button>
            </div>
          </article>
        ))}
      </div>

      {showModal && <ArticleModal article={selectedArticle} onClose={closeModal} />}
    </div>
  );
};

export default ArticlesPage;
