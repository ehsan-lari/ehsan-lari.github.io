document.addEventListener('DOMContentLoaded', () => {
  // Create chat widget HTML structure dynamically
  const chatHTML = `
    <!-- Chatbot Tooltip -->
    <div id="chatbot-tooltip" class="chatbot-tooltip">
      Hi! I'm Ehsan's AI assistant. Ask me anything about his experience!
      <button id="chatbot-tooltip-close" aria-label="Close Tooltip"><i class="fa-solid fa-xmark"></i></button>
    </div>

    <!-- Floating Action Button -->
    <div id="chatbot-fab" aria-label="Open Chat">
      <i class="fa-solid fa-comment-dots"></i>
    </div>

    <!-- Chat Window -->
    <div id="chatbot-window">
      <div class="chat-header">
        <div class="chat-header-info">
          <img src="https://ehsan-lari.github.io/images/profile_photo.jpg" alt="Ehsan Avatar" class="chat-avatar" onerror="this.src='https://ui-avatars.com/api/?name=Ehsan+Lari&background=3b82f6&color=fff'">
          <div>
            <h3 class="chat-title">Ehsan's AI Assistant</h3>
            <p class="chat-subtitle">Ask about my qualifications!</p>
          </div>
        </div>
        <button class="close-chat" id="close-chat-btn"><i class="fa-solid fa-xmark"></i></button>
      </div>
      
      <div class="chat-messages" id="chat-messages">
        <!-- Initial Bot Message -->
        <div class="chat-msg bot">
          Hi! I'm an AI assistant trained on Ehsan Lari's CV. I'm here to help recruiters and hiring managers. What would you like to know about his experience or skills?
        </div>
        
        <!-- Typing Indicator -->
        <div class="typing-indicator" id="typing-indicator">
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
          <div class="typing-dot"></div>
        </div>
      </div>

      <div class="chat-input-area">
        <input type="text" id="chat-input" placeholder="Type a message..." autocomplete="off">
        <button id="chat-send" aria-label="Send Message"><i class="fa-solid fa-paper-plane"></i></button>
      </div>
    </div>
  `;

  // Append to body
  document.body.insertAdjacentHTML('beforeend', chatHTML);

  // Elements
  const fab = document.getElementById('chatbot-fab');
  const chatWindow = document.getElementById('chatbot-window');
  const closeBtn = document.getElementById('close-chat-btn');
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const messagesContainer = document.getElementById('chat-messages');
  const typingIndicator = document.getElementById('typing-indicator');
  const tooltip = document.getElementById('chatbot-tooltip');
  const tooltipClose = document.getElementById('chatbot-tooltip-close');

  // Show tooltip after a short delay
  setTimeout(() => {
    if (tooltip && !chatWindow.classList.contains('open') && !localStorage.getItem('chatbot-tooltip-dismissed')) {
      tooltip.classList.add('show');
    }
  }, 3000);

  // Dismiss tooltip function
  function dismissTooltip() {
    if (tooltip) {
      tooltip.classList.remove('show');
      localStorage.setItem('chatbot-tooltip-dismissed', 'true');
    }
  }

  if (tooltipClose) {
    tooltipClose.addEventListener('click', (e) => {
      e.stopPropagation();
      dismissTooltip();
    });
  }

  // Toggle Chat Window
  function toggleChat() {
    chatWindow.classList.toggle('open');
    if (chatWindow.classList.contains('open')) {
      input.focus();
      dismissTooltip();
    }
  }

  fab.addEventListener('click', toggleChat);
  closeBtn.addEventListener('click', toggleChat);

  // Add Message to UI
  function addMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('chat-msg', sender);
    
    // Convert basic markdown-like bold (optional) and line breaks to HTML
    const formattedText = text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    msgDiv.innerHTML = formattedText;
    
    // Insert before typing indicator
    messagesContainer.insertBefore(msgDiv, typingIndicator);
    scrollToBottom();
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Handle Send
  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    // 1. Add user message
    addMessage(text, 'user');
    input.value = '';
    sendBtn.disabled = true;
    input.disabled = true;

    // 2. Show typing indicator
    typingIndicator.classList.add('active');
    scrollToBottom();

    try {
      // Determine API URL (Absolute URL for GitHub Pages)
      const apiUrl = 'https://ehsan-lari-github-io.vercel.app/api/chat';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      const data = await response.json();

      if (response.ok && data.text) {
        addMessage(data.text, 'bot');
      } else {
        addMessage("Sorry, I encountered an error connecting to my server. Please try again later.", 'bot');
        console.error("Chat API Error:", data.error);
      }
    } catch (error) {
      console.error("Network Error:", error);
      addMessage("Sorry, there was a network error reaching the server.", 'bot');
    } finally {
      // 3. Hide typing indicator & enable input
      typingIndicator.classList.remove('active');
      sendBtn.disabled = false;
      input.disabled = false;
      input.focus();
      scrollToBottom();
    }
  }

  // Event Listeners for Input
  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });
});
