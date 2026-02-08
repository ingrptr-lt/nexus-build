import { CONFIG } from './config.js';
import { NX } from './game.js';

// --- GLOBAL STATE ---
const State = {
    isUnlocked: false,
    apiKeys: JSON.parse(localStorage.getItem('nexus_api_keys') || '{}'),
    user: { name: 'Guest', avatar: '👤' },
    room: 'public',
    preloadedInvite: null
};

// --- UI REFERENCES ---
const UI = {
    authOverlay: document.getElementById('auth-overlay'),
    appContainer: document.getElementById('app-container'),
    chat: document.getElementById('chat-container'),
    input: document.getElementById('user-input'),
    sendBtn: document.getElementById('send-btn'),
    boot: document.getElementById('boot-screen'),
    apiStatus: document.getElementById('api-status-dot')
};

// --- EXPOSE FUNCTIONS TO WINDOW (For HTML onclick events) ---
window.app = {
    toggleMedia: () => alert("Media Deck Logic here..."),
    toggleAdmin: () => toggleAdmin()
};

// --- 1. INITIALIZATION ---
window.addEventListener('load', () => {
    // Check for Invite Link (with API Keys)
    const urlParams = new URLSearchParams(window.location.search);
    const inviteState = urlParams.get('s');
    if(inviteState) {
        try {
            State.preloadedInvite = JSON.parse(atob(inviteState));
            console.log("Secure Invite Loaded", State.preloadedInvite);
        } catch(e) {}
    }

    // Show Lock Screen
    UI.authOverlay.classList.remove('hidden');
    document.getElementById('auth-btn').addEventListener('click', attemptUnlock);
    UI.input.addEventListener('keydown', (e) => { if(e.key === 'Enter') attemptUnlock(); });
});

// --- 2. AUTHENTICATION LOGIC ---
function attemptUnlock() {
    const input = document.getElementById('auth-pass-input');
    const msg = document.getElementById('auth-msg');
    
    if (input.value === CONFIG.SYSTEM_PASSWORD) {
        // SUCCESS
        State.isUnlocked = true;
        
        // Apply Pre-loaded Keys if invite exists
        if(State.preloadedInvite && State.preloadedInvite.k) {
            const k = State.preloadedInvite.k;
            State.apiKeys[k.provider] = k.key;
            localStorage.setItem('nexus_api_keys', JSON.stringify(State.apiKeys));
            alert(`Credentials Verified: ${k.provider.toUpperCase()}`);
        }

        // Unlock UI
        UI.authOverlay.style.opacity = '0';
        setTimeout(() => {
            UI.authOverlay.style.display = 'none';
            UI.appContainer.classList.remove('opacity-0', 'pointer-events-none');
            startSystem();
        }, 500);
    } else {
        // FAIL
        input.value = "";
        UI.authOverlay.classList.add('shake-anim');
        msg.innerText = "ACCESS DENIED";
        setTimeout(() => {
            UI.authOverlay.classList.remove('shake-anim');
            msg.innerText = "";
        }, 1000);
    }
}

// --- 3. SYSTEM LOGIC ---
function startSystem() {
    // Boot Animation
    setTimeout(() => {
        UI.boot.style.opacity = '0';
        setTimeout(() => {
            UI.boot.remove();
            initGalaxy(); // Assuming this function exists or is added below
            connectMQTT(); // Assuming this function exists
        }, 800);
    }, 1500);
    
    UI.sendBtn.addEventListener('click', handleInput);
}

function handleInput() {
    if(!State.isUnlocked) {
        UI.authOverlay.classList.add('shake-anim');
        setTimeout(() => UI.authOverlay.classList.remove('shake-anim'), 500);
        return; // GATEKEEPER
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
        // MQTT send logic...
    }
}

async function processAI(prompt) {
    const key = State.apiKeys['groq']; // Simplified
    if(!key) {
        addMessage("Error: API Key Missing", false, "SYS", "⚠️");
        return;
    }
    
    addMessage("Processing...", true, "AI", "⏳");
    try {
        // Using global 'marked' and 'Paho' from CDN
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }]
            })
        });
        const data = await res.json();
        // Remove loading
        UI.chat.lastChild.remove();
        addMessage(marked.parse(data.choices[0].message.content), false, "AI", "🤖", true);
    } catch(e) {
        UI.chat.lastChild.remove();
        addMessage("AI Error", false, "SYS", "❌");
    }
}

function addMessage(text, isMe, sender, avatar, isHtml = false) {
    const div = document.createElement('div');
    div.className = `flex gap-3 my-2 msg-anim ${isMe ? 'flex-row-reverse' : ''}`;
    
    const bubbleClass = isMe 
        ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-black rounded-tr-none" 
        : "bg-white/10 text-white border border-white/10 rounded-tl-none";

    const content = isHtml ? text : text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    div.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs shrink-0">${avatar||'👤'}</div>
        <div class="${bubbleClass} p-3 rounded-2xl max-w-[80%] text-sm ${isHtml ? 'markdown-body' : 'font-mono'}">
            ${content}
        </div>
    `;
    UI.chat.appendChild(div);
    UI.chat.scrollTop = UI.chat.scrollHeight;
}

function initGalaxy() {
    // Canvas logic placeholder
    console.log("Galaxy Initialized");
}

function connectMQTT() {
    // MQTT logic placeholder
    console.log("Connecting MQTT...");
}

function toggleAdmin() {
    alert("Admin Panel would open here.");
}
