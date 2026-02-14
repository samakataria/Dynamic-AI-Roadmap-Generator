import React, { useState } from "react";
import axios from "axios";

const ChatBot = () => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async () => {
    if (userInput.trim() === "") return;

    const userMessage = { sender: "user", text: userInput };
    setMessages((prev) => [...prev, userMessage]);
    setUserInput("");
    setLoading(true);

    try {
      // Call your backend route, NOT the Gemini API directly
      const response = await axios.post("http://localhost:5000/chatbot", {
        message: userInput,
      });

      const botReply = response.data.reply || "No response from AI.";

      const bulletPoints = botReply
        .split(/\n|\./)
        .map((point) => point.trim())
        .filter((point) => point.length > 0);

      const botMessage = { sender: "bot", bullets: bulletPoints };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Something went wrong." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <h1>AI-Powered ChatBot</h1>

      <div className="chat-box">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {msg.sender === "bot" && msg.bullets ? (
              <ul className="bot-bullets">
                {msg.bullets.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>{msg.text}</p>
            )}
          </div>
        ))}

        {loading && (
          <div className="message bot">
            <p>...</p>
          </div>
        )}
      </div>

      <div className="input-container">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Type a message..."
          disabled={loading}
        />
        <button
          onClick={handleSendMessage}
          disabled={loading || userInput.trim() === ""}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatBot;
