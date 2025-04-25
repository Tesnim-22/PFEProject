import React, { useState } from 'react';
import '../styles/ChatBotButton.css';
import { FaComments } from 'react-icons/fa';

const ChatBotButton = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const toggleChat = () => setOpen(!open);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessage = { type: 'user', text: input };
    setChat((prev) => [...prev, newMessage]);
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });

      const data = await res.json();
      setChat((prev) => [...prev, { type: 'bot', text: data.response }]);
    } catch (error) {
      setChat((prev) => [...prev, { type: 'bot', text: "❌ Erreur de connexion au chatbot." }]);
    } finally {
      setInput('');
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="chatbot-button"
        onClick={() => (window.location.href = 'http://localhost:5000/')}
      >
        <FaComments size={28} />
      </button>



      {open && (
        <div className="chatbot-popup">
          <div className="chat-messages">
            {chat.map((msg, idx) => (
              <div key={idx} className={`message ${msg.type}`}>
                {msg.text}
              </div>
            ))}
            {loading && <div className="message bot">⏳...</div>}
          </div>
          <div className="chat-input">
            <input
              type="text"
              placeholder="Écris tes symptômes (ex: fièvre, toux)..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button onClick={sendMessage} disabled={loading}>Envoyer</button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBotButton;
