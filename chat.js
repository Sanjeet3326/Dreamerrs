document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('chat-input');
  const messages = document.getElementById('messages');
  const toastContainer = document.getElementById('toast-container') || document.body;
  
  // Initial greeting
  setTimeout(() => {
    appendMessage(`Hi! I'm your AI assistant. Ask me any question and I'll help you find the answer.`, 'bot');
  }, 500);

  function showToast(msg, duration = 3000) {
    if (!toastContainer) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    toastContainer.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.addEventListener('transitionend', () => el.remove());
    }, duration);
  }

  function showTyping(show = true) {
    // Create typing indicator if it doesn't exist
    let typingIndicator = document.getElementById('typing-indicator');
    if (!typingIndicator) {
      typingIndicator = document.createElement('div');
      typingIndicator.id = 'typing-indicator';
      typingIndicator.className = 'typing-indicator';
      typingIndicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
      messages.appendChild(typingIndicator);
    }
    typingIndicator.style.display = show ? 'flex' : 'none';
  }

  function appendMessage(text, who = 'assistant') {
    const el = document.createElement('div');
    el.className = 'chat-msg ' + (who === 'user' ? 'chat-user' : 'chat-bot');
    
    // Format the message text with Markdown-style formatting
    const formattedText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/• (.*?)\\n/g, '<br>• $1')
      .replace(/\\n/g, '<br>');
    
    el.innerHTML = `
      <div class="bubble">
        <strong>${who === 'user' ? 'You' : 'AI Assistant'}</strong>
        <div class="msg-text">${formattedText}</div>
      </div>
    `;
    
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }

  // Enhanced system prompt that understands the website context
  const systemPrompt = {
    role: "system",
    content: `You are a helpful AI assistant that answers questions about any topic. Your responses should be:
    - Clear and informative
    - Based on factual information
    - Easy to understand
    - Professional yet friendly
    
    Focus on providing direct, accurate answers without any reference to managing tasks, goals, or other system features.`
  };

  async function send() {
    const text = (input.value || '').trim();
    if (!text) return;
    
    appendMessage(text, 'user');
    input.value = '';
    showTyping(true);

    try {
      const res = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text
        })
      });
      
      showTyping(false);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Server error:', errorData);
        if (errorData.error === 'Server missing GOOGLE_API_KEY env variable') {
          appendMessage('The chatbot is not properly configured. Please make sure to set up your API key.', 'bot');
        } else {
          appendMessage('I encountered an error processing your request. Please try again in a moment.', 'bot');
        }
        return;
      }
      
      const data = await res.json();
      if (data.reply) {
        appendMessage(data.reply, 'bot');
      } else {
        appendMessage('I received your message but was unable to generate a proper response. Please try again.', 'bot');
      }
    } catch (err) {
      showTyping(false);
      console.error('Chat error:', err);
      appendMessage('There seems to be a connection issue. Please check if the server is running or try again later.', 'bot');
    }
  }

  // Auto-expand input field
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = input.scrollHeight + 'px';
  });

  // Send button
  const sendBtn = document.getElementById('send-btn');
  if (sendBtn) {
    sendBtn.addEventListener('click', send);
  }

  // Send message on Enter
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  });

  // Focus input on load
  input.focus();
});
