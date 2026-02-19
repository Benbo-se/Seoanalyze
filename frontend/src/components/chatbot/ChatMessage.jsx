'use client';

export default function ChatMessage({ message, onFeedback }) {
  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`chatbot-message ${message.role}`}>
      <div className="chatbot-message-bubble">
        {message.content}

        {/* Feedback buttons for bot messages */}
        {message.role === 'bot' && message.logId && !message.isError && (
          <div className="chatbot-feedback">
            <button
              onClick={() => onFeedback(true)}
              aria-label="Helpful"
              title="Hjälpsamt svar"
            >
              👍
            </button>
            <button
              onClick={() => onFeedback(false)}
              aria-label="Not helpful"
              title="Inte hjälpsamt"
            >
              👎
            </button>
          </div>
        )}
      </div>
      <div className="chatbot-message-time">
        {formatTime(message.timestamp)}
      </div>
    </div>
  );
}
