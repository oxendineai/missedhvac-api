// ==================================================
// MissedHVAC AI Chat Widget - Embeddable Version
// For DontMissLeads customers
// Usage: <script src="https://cdn.missedhvac.com/chat-widget.js" data-customer-id="hvac-company-123"></script>
// ==================================================

(function() {
    'use strict';
    
    // Prevent multiple widget instances
    if (window.MissedHVACWidget) {
        console.warn('MissedHVAC Widget already loaded');
        return;
    }
    
    // Get configuration from script tag
    const currentScript = document.currentScript || document.querySelector('script[src*="chat-widget.js"]');
    const config = {
        customerId: currentScript?.getAttribute('data-customer-id') || 'demo',
        apiEndpoint: currentScript?.getAttribute('data-api-endpoint') || 'http://localhost:3000/api/chat',
        theme: currentScript?.getAttribute('data-theme') || 'orange',
        position: currentScript?.getAttribute('data-position') || 'bottom-right',
        assistantName: currentScript?.getAttribute('data-assistant-name') || 'HVAC Assistant',
        emergencyPhone: currentScript?.getAttribute('data-emergency-phone') || '(555) 123-4567'
    };

    // Theme configurations
    const themes = {
        orange: { primary: '#ff6b35', secondary: '#f7931e' },
        blue: { primary: '#2563eb', secondary: '#1d4ed8' },
        green: { primary: '#059669', secondary: '#047857' },
        purple: { primary: '#7c3aed', secondary: '#6d28d9' }
    };

    // Widget state
    let widgetState = {
        isMinimized: true,
        messageHistory: [
            {
                role: 'assistant',
                content: `👋 Hi! I'm your ${config.assistantName.toLowerCase()}. I can help with:\n• Emergency situations\n• Service estimates\n• System maintenance\n• Scheduling appointments\n\nWhat can I help you with today?`
            }
        ]
    };

    // CSS Styles - Injected into page
    const styles = `
        .missedHVAC-chat-widget {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 380px;
            height: 500px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            display: flex;
            flex-direction: column;
            z-index: 2147483647;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            transition: all 0.3s ease;
        }

        .missedHVAC-chat-widget.minimized {
            height: 60px;
            width: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, ${themes[config.theme].primary} 0%, ${themes[config.theme].secondary} 100%);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .missedHVAC-chat-widget.position-bottom-left {
            left: 20px;
            right: auto;
        }

        .missedHVAC-chat-widget.position-top-right {
            top: 20px;
            bottom: auto;
        }

        .missedHVAC-chat-widget.position-top-left {
            top: 20px;
            left: 20px;
            right: auto;
            bottom: auto;
        }

        .missedHVAC-chat-toggle {
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            border-radius: inherit;
        }

        .missedHVAC-chat-header {
            background: linear-gradient(135deg, ${themes[config.theme].primary} 0%, ${themes[config.theme].secondary} 100%);
            color: white;
            padding: 20px;
            border-radius: 16px 16px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .missedHVAC-chat-header h3 {
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0;
        }

        .missedHVAC-chat-header p {
            font-size: 0.9rem;
            opacity: 0.9;
            margin: 5px 0 0 0;
        }

        .missedHVAC-minimize-btn {
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            padding: 5px;
            border-radius: 4px;
            transition: background 0.2s;
        }

        .missedHVAC-minimize-btn:hover {
            background: rgba(255,255,255,0.1);
        }

        .missedHVAC-chat-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background: #f8f9fa;
        }

        .missedHVAC-message {
            margin-bottom: 15px;
            display: flex;
            align-items: flex-start;
        }

        .missedHVAC-message.user {
            justify-content: flex-end;
        }

        .missedHVAC-message-bubble {
            max-width: 80%;
            padding: 12px 16px;
            border-radius: 18px;
            font-size: 0.95rem;
            line-height: 1.4;
            white-space: pre-wrap;
        }

        .missedHVAC-message.bot .missedHVAC-message-bubble {
            background: white;
            color: #333;
            border: 1px solid #e1e5e9;
            border-radius: 18px 18px 18px 4px;
        }

        .missedHVAC-message.user .missedHVAC-message-bubble {
            background: linear-gradient(135deg, ${themes[config.theme].primary} 0%, ${themes[config.theme].secondary} 100%);
            color: white;
            border-radius: 18px 18px 4px 18px;
        }

        .missedHVAC-chat-input-container {
            padding: 20px;
            background: white;
            border-radius: 0 0 16px 16px;
            border-top: 1px solid #e1e5e9;
        }

        .missedHVAC-chat-input-form {
            display: flex;
            gap: 10px;
        }

        .missedHVAC-chat-input {
            flex: 1;
            padding: 12px 16px;
            border: 2px solid #e1e5e9;
            border-radius: 24px;
            font-size: 0.95rem;
            outline: none;
            transition: border-color 0.2s;
        }

        .missedHVAC-chat-input:focus {
            border-color: ${themes[config.theme].primary};
        }

        .missedHVAC-send-btn {
            background: linear-gradient(135deg, ${themes[config.theme].primary} 0%, ${themes[config.theme].secondary} 100%);
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 24px;
            cursor: pointer;
            font-weight: 600;
            transition: transform 0.2s;
        }

        .missedHVAC-send-btn:hover {
            transform: translateY(-1px);
        }

        .missedHVAC-send-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        .missedHVAC-typing-indicator {
            display: none;
            padding: 12px 16px;
            background: white;
            border: 1px solid #e1e5e9;
            border-radius: 18px 18px 18px 4px;
            max-width: 80%;
        }

        .missedHVAC-typing-dots {
            display: flex;
            gap: 4px;
        }

        .missedHVAC-typing-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #999;
            animation: missedHVAC-typing 1.4s infinite ease-in-out;
        }

        .missedHVAC-typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .missedHVAC-typing-dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes missedHVAC-typing {
            0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
            40% { transform: scale(1); opacity: 1; }
        }

        .missedHVAC-powered-by {
            text-align: center;
            padding: 8px;
            font-size: 0.75rem;
            color: #999;
            background: #f8f9fa;
            border-top: 1px solid #e1e5e9;
            border-radius: 0 0 16px 16px;
        }

        .missedHVAC-powered-by a {
            color: ${themes[config.theme].primary};
            text-decoration: none;
            font-weight: 600;
        }

        /* Mobile Responsive */
        @media (max-width: 480px) {
            .missedHVAC-chat-widget {
                width: calc(100vw - 40px);
                height: calc(100vh - 40px);
                bottom: 20px;
                right: 20px;
                left: 20px;
            }

            .missedHVAC-chat-widget.minimized {
                width: 60px;
                height: 60px;
                left: auto;
            }
        }
    `;

    // HTML Template
    const widgetHTML = `
        <div class="missedHVAC-chat-widget minimized position-${config.position}" id="missedHVACChatWidget">
            <button class="missedHVAC-chat-toggle" id="missedHVACChatToggle">💬</button>
            
            <div class="missedHVAC-chat-header" style="display: none;">
                <div>
                    <h3>${config.assistantName}</h3>
                    <p>Ask me about heating & cooling</p>
                </div>
                <button class="missedHVAC-minimize-btn" id="missedHVACMinimizeBtn">−</button>
            </div>
            
            <div class="missedHVAC-chat-messages" id="missedHVACChatMessages" style="display: none;">
                <div class="missedHVAC-message bot">
                    <div class="missedHVAC-message-bubble">
                        ${widgetState.messageHistory[0].content}
                    </div>
                </div>
            </div>
            
            <div class="missedHVAC-typing-indicator" id="missedHVACTypingIndicator">
                <div class="missedHVAC-typing-dots">
                    <div class="missedHVAC-typing-dot"></div>
                    <div class="missedHVAC-typing-dot"></div>
                    <div class="missedHVAC-typing-dot"></div>
                </div>
            </div>
            
            <div class="missedHVAC-chat-input-container" style="display: none;">
                <form class="missedHVAC-chat-input-form" id="missedHVACChatForm">
                    <input type="text" class="missedHVAC-chat-input" id="missedHVACMessageInput" placeholder="Ask about HVAC services..." autocomplete="off">
                    <button type="submit" class="missedHVAC-send-btn" id="missedHVACSendBtn">Send</button>
                </form>
            </div>
            
            <div class="missedHVAC-powered-by" style="display: none;">
                Powered by <a href="https://missedhvac.com" target="_blank">MissedHVAC</a>
            </div>
        </div>
    `;

    // Utility Functions
    function addMessage(content, type) {
        const messagesContainer = document.getElementById('missedHVACChatMessages');
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'missedHVAC-message ' + type;
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'missedHVAC-message-bubble';
        bubbleDiv.textContent = content;
        
        messageDiv.appendChild(bubbleDiv);
        messagesContainer.appendChild(messageDiv);
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function showTypingIndicator() {
        const indicator = document.getElementById('missedHVACTypingIndicator');
        const messagesContainer = document.getElementById('missedHVACChatMessages');
        if (!indicator || !messagesContainer) return;
        
        messagesContainer.appendChild(indicator);
        indicator.style.display = 'block';
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function hideTypingIndicator() {
        const indicator = document.getElementById('missedHVACTypingIndicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    // Emergency Detection
    function detectEmergency(message) {
        const emergencyKeywords = [
            'emergency', 'urgent', 'flooding', 'water damage', 'burst pipe',
            'no heat', 'no cooling', 'gas leak', 'carbon monoxide',
            'fire', 'smoke', 'electrical', 'sparks', 'not working'
        ];
        const lowerMessage = message.toLowerCase();
        return emergencyKeywords.some(keyword => lowerMessage.includes(keyword));
    }

    // Quick Responses
    function getQuickResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        if (detectEmergency(lowerMessage)) {
            return `🚨 This sounds like an emergency! For immediate assistance, please call our 24/7 emergency line at ${config.emergencyPhone}. If there's immediate danger, call 911 first.`;
        }
        
        if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('estimate')) {
            return "Service call fees typically range from $89-149 depending on the issue and time of day. Would you like me to schedule a free estimate for your specific needs?";
        }
        
        if (lowerMessage.includes('service area') || lowerMessage.includes('location') || lowerMessage.includes('zip')) {
            return "We serve the local area and surrounding communities. What's your zip code? I can confirm if we service your area and provide an accurate response time.";
        }
        
        if (lowerMessage.includes('hours') || lowerMessage.includes('schedule') || lowerMessage.includes('appointment')) {
            return "We're available 24/7 for emergencies! Regular service hours are Monday-Friday 8am-6pm, Saturday 9am-4pm. Would you like to schedule an appointment?";
        }
        
        if (lowerMessage.includes('maintenance') || lowerMessage.includes('tune up') || lowerMessage.includes('service plan')) {
            return "Regular maintenance is essential for HVAC efficiency! We recommend twice-yearly tune-ups - spring for AC, fall for heating. Our maintenance plans start at $199/year. Would you like to learn more?";
        }
        
        return null;
    }

    // Main Functions
    function toggleChat() {
        const widget = document.getElementById('missedHVACChatWidget');
        if (!widget) return;
        
        const header = widget.querySelector('.missedHVAC-chat-header');
        const messages = widget.querySelector('.missedHVAC-chat-messages');
        const inputContainer = widget.querySelector('.missedHVAC-chat-input-container');
        const poweredBy = widget.querySelector('.missedHVAC-powered-by');
        const toggle = widget.querySelector('.missedHVAC-chat-toggle');
        
        if (widgetState.isMinimized) {
            widget.classList.remove('minimized');
            if (header) header.style.display = 'flex';
            if (messages) messages.style.display = 'block';
            if (inputContainer) inputContainer.style.display = 'block';
            if (poweredBy) poweredBy.style.display = 'block';
            if (toggle) toggle.style.display = 'none';
            widgetState.isMinimized = false;
            
            setTimeout(function() {
                const input = document.getElementById('missedHVACMessageInput');
                if (input) input.focus();
            }, 100);
        } else {
            widget.classList.add('minimized');
            if (header) header.style.display = 'none';
            if (messages) messages.style.display = 'none';
            if (inputContainer) inputContainer.style.display = 'none';
            if (poweredBy) poweredBy.style.display = 'none';
            if (toggle) toggle.style.display = 'flex';
            widgetState.isMinimized = true;
        }
    }

    function sendMessage(event) {
        event.preventDefault();
        
        const input = document.getElementById('missedHVACMessageInput');
        const sendBtn = document.getElementById('missedHVACSendBtn');
        if (!input || !sendBtn) return;
        
        const message = input.value.trim();
        if (!message) return;
        
        addMessage(message, 'user');
        input.value = '';
        sendBtn.disabled = true;
        
        // Check for quick response first
        const quickResponse = getQuickResponse(message);
        
        if (quickResponse) {
            showTypingIndicator();
            
            setTimeout(function() {
                hideTypingIndicator();
                addMessage(quickResponse, 'bot');
                sendBtn.disabled = false;
            }, 1500);
            
            return;
        }
        
        // API call for complex questions
        showTypingIndicator();
        
        fetch(config.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                customerId: config.customerId,
                messages: [
                    ...widgetState.messageHistory,
                    { role: 'user', content: message }
                ]
            })
        })
        .then(response => response.json())
        .then(data => {
            hideTypingIndicator();
            
            if (data.content) {
                addMessage(data.content, 'bot');
                widgetState.messageHistory.push({ role: 'user', content: message });
                widgetState.messageHistory.push({ role: 'assistant', content: data.content });
            } else {
                addMessage('Sorry, I encountered an error. Please try again or call us directly for immediate assistance.', 'bot');
            }
        })
        .catch(error => {
            console.error('MissedHVAC Chat error:', error);
            hideTypingIndicator();
            addMessage('I\'m having trouble connecting right now. Please try again in a moment or call us directly.', 'bot');
        })
        .finally(() => {
            sendBtn.disabled = false;
        });
    }

    // Initialize Widget
    function initWidget() {
        // Inject CSS
        const styleSheet = document.createElement('style');
        styleSheet.type = 'text/css';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
        
        // Inject HTML
        document.body.insertAdjacentHTML('beforeend', widgetHTML);
        
        // Add event listeners
        const chatToggle = document.getElementById('missedHVACChatToggle');
        const minimizeBtn = document.getElementById('missedHVACMinimizeBtn');
        const chatForm = document.getElementById('missedHVACChatForm');
        
        if (chatToggle) {
            chatToggle.addEventListener('click', toggleChat);
        }
        
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', toggleChat);
        }
        
        if (chatForm) {
            chatForm.addEventListener('submit', sendMessage);
        }
        
        console.log('MissedHVAC Chat Widget initialized for customer:', config.customerId);
    }

    // Wait for DOM ready and initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }
    
    // Export for debugging
    window.MissedHVACWidget = {
        version: '1.0.0',
        config: config,
        toggle: toggleChat
    };
})();
