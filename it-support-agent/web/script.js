// ================================
// Configuration & State Management
// ================================
const CONFIG_KEY = 'itagent';
const API_KEY = 'VtYmL8jGZO5VZj4COBbZZ50PHkmtolVo5KiKENUH';
const DEFAULT_API_ENDPOINT = 'https://vwxy0t8xli.execute-api.us-east-2.amazonaws.com/dev/invoke/';  // CHANGED: Removed trailing slash
let apiEndpoint = localStorage.getItem(CONFIG_KEY) || DEFAULT_API_ENDPOINT;

// Session management - NEW
let sessionId = null;

// ================================
// DOM Elements
// ================================
const elements = {
    chatMessages: document.getElementById('chatMessages'),
    userInput: document.getElementById('userInput'),
    sendButton: document.getElementById('sendButton'),
    typingIndicator: document.getElementById('typingIndicator'),
    statusDot: document.getElementById('statusDot'),
    statusText: document.getElementById('statusText'),
    charCount: document.getElementById('charCount'),
    configModal: document.getElementById('configModal'),
    apiEndpointInput: document.getElementById('apiEndpoint'),
    saveConfigButton: document.getElementById('saveConfig'),
    closeModalButton: document.getElementById('closeModal'),
    settingsButton: document.getElementById('settingsButton'),
    welcomeTime: document.getElementById('welcomeTime')
};

// ================================
// Initialization
// ================================
function init() {
    // Set welcome message time
    elements.welcomeTime.textContent = getCurrentTime();

    // Save default endpoint if not already set
    if (!localStorage.getItem(CONFIG_KEY)) {
        localStorage.setItem(CONFIG_KEY, DEFAULT_API_ENDPOINT);
    }

    // Update status to online since we have the endpoint configured
    updateStatus('online', 'Online');

    // Load API endpoint into modal input
    elements.apiEndpointInput.value = apiEndpoint;

    // Auto-resize textarea
    elements.userInput.addEventListener('input', handleInputChange);

    // Send message on button click
    elements.sendButton.addEventListener('click', sendMessage);

    // Send message on Enter (Shift+Enter for new line)
    elements.userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Modal controls
    elements.settingsButton.addEventListener('click', showConfigModal);
    elements.closeModalButton.addEventListener('click', hideConfigModal);
    elements.saveConfigButton.addEventListener('click', saveConfiguration);

    // Close modal on outside click
    elements.configModal.addEventListener('click', (e) => {
        if (e.target === elements.configModal) {
            hideConfigModal();
        }
    });
}

// ================================
// Utility Functions
// ================================
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updateStatus(status, text) {
    elements.statusDot.className = 'status-dot';
    if (status === 'connecting') {
        elements.statusDot.classList.add('connecting');
    } else if (status === 'error') {
        elements.statusDot.classList.add('error');
    }
    elements.statusText.textContent = text;
}

function handleInputChange() {
    // Auto-resize textarea
    elements.userInput.style.height = 'auto';
    elements.userInput.style.height = elements.userInput.scrollHeight + 'px';

    // Update character count
    const length = elements.userInput.value.length;
    elements.charCount.textContent = length;

    // Enable/disable send button
    elements.sendButton.disabled = length === 0;
}

function scrollToBottom() {
    elements.chatMessages.parentElement.scrollTop =
        elements.chatMessages.parentElement.scrollHeight;
}

// ================================
// Modal Functions
// ================================
function showConfigModal() {
    elements.configModal.classList.add('active');
}

function hideConfigModal() {
    elements.configModal.classList.remove('active');
}

function saveConfiguration() {
    const endpoint = elements.apiEndpointInput.value.trim();

    if (!endpoint) {
        alert('Please enter a valid API endpoint URL');
        return;
    }

    // Remove trailing slash if present - CHANGED
    apiEndpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;

    // Save to localStorage
    localStorage.setItem(CONFIG_KEY, apiEndpoint);

    // Update status
    updateStatus('online', 'Online');

    // Close modal
    hideConfigModal();

    // Show success message
    addBotMessage('✅ API endpoint configured successfully! You can now start chatting.');
}

// ================================
// Message Functions
// ================================
function createMessageElement(content, isUser = false) {
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${isUser ? 'user-message' : 'bot-message'}`;

    const avatar = document.createElement('div');
    avatar.className = `message-avatar ${isUser ? 'user-avatar' : 'bot-avatar'}`;

    if (isUser) {
        avatar.textContent = 'U';
    } else {
        avatar.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L18 6V14L12 18L6 14V6L12 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="12" cy="12" r="2" fill="white"/>
            </svg>
        `;
    }

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    const messageHeader = document.createElement('div');
    messageHeader.className = 'message-header';

    const sender = document.createElement('span');
    sender.className = 'message-sender';
    sender.textContent = isUser ? 'You' : 'IT Support Agent';

    const time = document.createElement('span');
    time.className = 'message-time';
    time.textContent = getCurrentTime();

    messageHeader.appendChild(sender);
    messageHeader.appendChild(time);

    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${isUser ? 'user-bubble' : 'bot-bubble'}`;

    // Handle line breaks and format content
    const paragraphs = content.split('\n').filter(p => p.trim());
    paragraphs.forEach(paragraph => {
        const p = document.createElement('p');
        p.textContent = paragraph;
        bubble.appendChild(p);
    });

    messageContent.appendChild(messageHeader);
    messageContent.appendChild(bubble);

    wrapper.appendChild(avatar);
    wrapper.appendChild(messageContent);

    return wrapper;
}

function addUserMessage(content) {
    const messageElement = createMessageElement(content, true);
    elements.chatMessages.appendChild(messageElement);
    scrollToBottom();
}

function addBotMessage(content) {
    const messageElement = createMessageElement(content, false);
    elements.chatMessages.appendChild(messageElement);
    scrollToBottom();
}

function showTypingIndicator() {
    elements.typingIndicator.style.display = 'block';
    scrollToBottom();
}

function hideTypingIndicator() {
    elements.typingIndicator.style.display = 'none';
}

// ================================
// API Communication
// ================================
async function callAPI(question) {
    if (!apiEndpoint) {
        throw new Error('API endpoint not configured');
    }

    // Build the request payload - CHANGED: Added session_id
    const payload = { question };
    if (sessionId) {
        payload.session_id = sessionId;
    }

    console.log('Making API request to:', apiEndpoint);
    console.log('Request payload:', payload);

    try {
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify(payload)
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', [...response.headers.entries()]);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API error response:', errorText);
            
            // IMPROVED: Try to parse error as JSON
            let errorMessage = `API error: ${response.status} ${response.statusText}`;
            try {
                const errorData = JSON.parse(errorText);
                if (errorData.error) {
                    errorMessage = errorData.error;
                    if (errorData.message) {
                        errorMessage += `: ${errorData.message}`;
                    }
                }
            } catch (e) {
                // If not JSON, use the text as-is
                errorMessage = errorText || errorMessage;
            }
            
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('API response:', data);
        
        // CHANGED: Store session_id from response
        if (data.session_id) {
            sessionId = data.session_id;
            console.log('Session ID:', sessionId);
        }
        
        return data;
    } catch (error) {
        console.error('Fetch error details:', error);

        // Check if it's a CORS error
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('CORS Error: The API is not configured to accept requests from this origin. Please check your API Gateway CORS settings.');
        }

        throw error;
    }
}

// ================================
// Send Message Handler
// ================================
async function sendMessage() {
    const question = elements.userInput.value.trim();

    if (!question) return;

    // Check if API is configured
    if (!apiEndpoint) {
        showConfigModal();
        addBotMessage('⚠️ Please configure your API endpoint first.');
        return;
    }

    // Disable input while processing
    elements.userInput.disabled = true;
    elements.sendButton.disabled = true;

    // Add user message
    addUserMessage(question);

    // Clear input
    elements.userInput.value = '';
    elements.userInput.style.height = 'auto';
    elements.charCount.textContent = '0';

    // Show typing indicator
    showTypingIndicator();
    updateStatus('connecting', 'Thinking...');

    try {
        // Call API
        const response = await callAPI(question);

        // Hide typing indicator
        hideTypingIndicator();

        // Add bot response
        const answer = response.answer || 'I apologize, but I could not generate a response.';
        addBotMessage(answer);

        // Update status
        updateStatus('online', 'Online');

    } catch (error) {
        console.error('Error calling API:', error);

        // Hide typing indicator
        hideTypingIndicator();

        // Show error message
        addBotMessage(`❌ Error: ${error.message}\n\nPlease check your API endpoint configuration and try again.`);

        // Update status
        updateStatus('error', 'Error');
    } finally {
        // Re-enable input
        elements.userInput.disabled = false;
        elements.sendButton.disabled = false;
        elements.userInput.focus();
    }
}

// ================================
// Initialize on page load
// ================================
document.addEventListener('DOMContentLoaded', init);