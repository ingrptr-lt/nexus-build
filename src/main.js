import './styles/main.css';
import { CONFIG } from './core/config.js';

// --- STATE ---
const State = {
    isUnlocked: false,
    apiKeys: JSON.parse(localStorage.getItem('nexus_api_keys') || '{}'),
    user: { name: 'User', avatar: '👤' }
};

// --- UI ELEMENTS ---
const UI = {
    authOverlay: document.getElementById('auth-overlay'),
    authInput: document.getElementById('auth-pass-input'),
    authBtn: document.getElementById('auth-btn'),
    authMsg: document.getElementById('auth-msg'),
    app: document.getElementById('app'),
    input: document.getElementById('user-input'),
    chat: document.getElementById('chat-container'),
    mediaBtn: document.getElementById('btn-media')
};

// --- 1. INITIALIZATION ---
window.addEventListener('load', () => {
    // Show Lock Screen immediately
    UI.authOverlay.classList.remove('hidden');
    
    // Check for Invite Link
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.get('s')) {
        try {
            const data = JSON.parse(atob(urlParams.get('s')));
            if(data.k) { // Preload keys
                State.apiKeys[data.k.provider] = data.k.key;
                localStorage.setItem('nexus_api_keys', JSON.stringify(State.apiKeys));
            }
        } catch(e) {}
    }
    
    // Bind Events
    UI.authBtn.addEventListener('click', attemptUnlock);
    UI.input.addEventListener('keydown', (e) => { if(e.key === 'Enter') attemptUnlock(); });
});

// --- 2. AUTHENTICATION ---
function attemptUnlock() {
    if (UI.authInput.value === CONFIG.SYSTEM_PASSWORD) {
        State.isUnlocked = true;
        
        // Animate Unlock
        UI.authOverlay.style.opacity = '0';
        setTimeout(() => {
            UI.authOverlay.style.display = 'none';
            UI.app.classList.remove('opacity-0');
            UI.input.focus();
            addSystemMessage("SYSTEM UNLOCKED", "success");
        }, 500);
    } else {
        UI.authMsg.innerText = "ACCESS DENIED";
        UI.authInput.value = "";
    }
}

// --- 3. LOGIC GATEKEEPER ---
UI.input.addEventListener('input', (e) => {
    if(!State.isUnlocked) {
        e.preventDefault();
        e.target.value = ""; // Block input if locked
        return;
    }
});

// Expose functions for HTML buttons
window.app = {
    toggleMedia: () => alert("Media logic goes in src/components/media.js")
};

// --- HELPER ---
function addSystemMessage(text) {
    const div = document.createElement('div');
    div.className = "text-center text-gray-500 text-sm my-4";
    div.innerText = `[SYSTEM]: ${text}`;
    UI.chat.appendChild(div);
}
