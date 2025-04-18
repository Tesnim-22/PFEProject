import React from 'react';
import '../styles/ChatBotButton.css';
import { FaComments } from 'react-icons/fa';

const ChatBotButton = () => {
  const openChatBot = () => {
    alert("Chatbot integration coming soon!");
  };

  return (
    <button className="chatbot-button" onClick={openChatBot}>
      <FaComments size={28} />
    </button>
  );
};

export default ChatBotButton;
