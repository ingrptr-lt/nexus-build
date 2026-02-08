// --- IMPORTS ---
import { CONFIG } from './config.js';
import { NetworkManager } from './mqtt.js';

// --- GLOBAL STATE ---
export const State = {
    isUnlocked: false,
    user: { name: 'Guest', avatar: '👤' },
    room: 'public',
    apiKeys: JSON.parse(localStorage.getItem('nexus_api_keys') || '{}'),
    preloadedInvite: null
};

// --- UI REFERENCES ---
const UI = {
    authOverlay: document.getElementById('auth-overlay'),
    authInput: document.getElementById('auth-pass-input'),
    authBtn: document.getElementById('auth-btn'),
    authMsg: document.getElementById('auth-msg'),
    appContainer: document.getElementById('app-container'),
    input: document.getElementById('user-input'),
    sendBtn: document.getElementById('send-btn'),
    boot: document.getElementById('boot-screen'),
    apiDot: document.getElementById('api-status-dot'),
    roomDisp: document.getElementById('room-display'),
    adminPanel: document.getElementById('admin-panel'),
    apiKeyInput: document.getElementById('api-key-input'),
    providerSelect: document.getElementById('provider-select')
};

// --- 1. INITIALIZATION ---
window.addEventListener('load', () => {
    // Check URL for Invite (API Keys)
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.get('s')) {
        try {
            const data = JSON.parse(atob(urlParams.get('s')));
            if(data.k) { // 'k' for keys
                State.apiKeys[data.k.provider] = data.k.key;
                localStorage.setItem('nexus_api_keys', JSON.stringify(State.apiKeys));
                console.log("Secure Invite Keys Applied");
            }
        } catch(e) {}
    }

    // Show Lock Screen
    UI.authOverlay.classList.remove('hidden');
    
    // Bind Buttons
    UI.authBtn.addEventListener('click', attemptUnlock);
    UI.input.addEventListener('keydown', (e) => { if(e.key === 'Enter') attemptUnlock(); });
    UI.sendBtn.addEventListener('click', handleSend);
});

// --- 2. AUTHENTICATION ---
function attemptUnlock() {
    if (UI.authInput.value === CONFIG.SYSTEM_PASSWORD) {
        State.isUnlocked = true;
        
        // Unlock Animation
        UI.authOverlay.style.opacity = '0';
        setTimeout(() => {
            UI.authOverlay.style.display = 'none';
            UI.appContainer.classList.remove('opacity-0', 'pointer-events-none');
            startSystem();
        }, 500);
    } else {
        UI.authMsg.innerText = "ACCESS DENIED";
        UI.authInput.classList.add('shake-anim');
        setTimeout(() => UI.authInput.classList.remove('shake-anim'), 500);
    }
}

// --- 3. SYSTEM LOGIC ---
const netManager = new NetworkManager();

function startSystem() {
    // Boot Animation
    setTimeout(() => {
        UI.boot.style.opacity = '0';
        setTimeout(() => {
            UI.boot.remove();
            initGalaxy(); // <--- FIX: ADDED BACK
            netManager.connect(); // Connect MQTT
        }, 800);
    }, 1500);
}

// --- 4. GALAXY BACKGROUND (RESTORED) ---
function initGalaxy() {
    const canvas = document.getElementById('galaxy-canvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const stars = Array(100).fill().map(() => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        s: Math.random() * 2
    }));

    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#fff';
        stars.forEach(s => {
            s.y += s.s * 0.2;
            if(s.y > canvas.height) s.y = 0;
            ctx.fillRect(s.x, s.y, s.s, s.s);
        });
        requestAnimationFrame(draw);
    }
    draw();
}

// --- 5. CHAT & GATEKEEPER ---
function handleSend() {
    if(!State.isUnlocked) {
        UI.authOverlay.classList.add('shake-anim');
        setTimeout(() => UI.authOverlay.classList.remove('shake-anim'), 500);
        return;
    }

    const text = UI.input.value.trim();
    if(!text) return;
    UI.input.value = '';

    if(text.startsWith('/ai')) {
        const prompt = text.replace('/ai ', '');
        addMessage(prompt, true, "USER", "🧠");
        processAI(prompt);
    } else {
        addMessage(text, true, "USER");
        netManager.send(text);
    }
}

// --- 6. AI LOGIC ---
async function processAI(prompt) {
    const key = State.apiKeys['groq']; // Default provider
    if(!key) {
        addMessage("⚠️ API KEY MISSING. Click Admin (Lock Icon) to enter.", false, "SYS", "🔒");
        toggleAdmin(); // Open Admin Panel automatically
        return;
    }
    
    addMessage("Thinking...", true, "AI", "⏳");
    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }]
            })
        });
        const data = await res.json();
        UI.chat.lastChild.remove(); // Remove thinking
        
        // Using global 'marked' from CDN
        const htmlContent = marked.parse(data.choices[0].message.content);
        addMessage(htmlContent, false, "AI", "🤖", true);
    } catch(e) {
        UI.chat.lastChild.remove();
        addMessage(`AI Error: ${e.message}`, false, "SYS", "❌");
    }
}

// --- 7. UI HELPERS ---
function addMessage(text, isMe, sender, avatar, isHtml = false) {
    const div = document.createElement('div');
    div.className = `flex gap-3 my-2 ${isMe ? 'flex-row-reverse' : ''}`;
    
    const avatarDiv = `<div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs">${avatar||'👤'}</div>`;
    const bubbleClass = isMe ? "bg-cyan-600 text-black" : "bg-gray-800 text-white";
    const content = isHtml ? text : text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    div.innerHTML = `
        ${avatarDiv}
        <div class="${bubbleClass} p-3 rounded-2xl max-w-[80%] text-sm">
            ${content}
        </div>
    `;
    UI.chat.appendChild(div);
    UI.chat.scrollTop = UI.chat.scrollHeight;
}

// --- 8. ADMIN PANEL LOGIC (RESTORED) ---
function toggleAdmin() {
    if(UI.adminPanel) UI.adminPanel.classList.toggle('hidden');
}

function saveApiKey() {
    if(UI.apiKeyInput) {
        const key = UI.apiKeyInput.value.trim();
        if(key) {
            State.apiKeys['groq'] = key; // Saving to Groq for demo
            localStorage.setItem('nexus_api_keys', JSON.stringify(State.apiKeys));
            addMessage("API Key Saved. System Ready.", false, "SYS", "✅");
            toggleAdmin();
        }
    }
}

// Expose functions for HTML
window.app = {
    toggleMedia: () => alert("Media logic would go here"),
    toggleAdmin: toggleAdmin,
    saveApiKey: saveApiKey
};
