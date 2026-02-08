// --- IMPORTS & CONFIG ---
import { CONFIG } from './config.js';
import { NetworkManager } from './mqtt.js';

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
    appContainer: document.getElementById('app-container'),
    chat: document.getElementById('chat-container'),
    input: document.getElementById('user-input'),
    boot: document.getElementById('boot-screen'),
    mediaDeck: document.getElementById('media-deck'),
    gameOverlay: document.getElementById('nexus-engine-overlay'),
    ideOverlay: document.getElementById('code-editor-overlay')
};

// --- 1. AUTHENTICATION ---
window.addEventListener('load', () => {
    // Check Invite
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.get('s')) {
        try {
            State.preloadedInvite = JSON.parse(atob(urlParams.get('s')));
            console.log("Invite Loaded");
        } catch(e){}
    }

    // Show Lock Screen
    UI.authOverlay.classList.remove('hidden');
    document.getElementById('auth-btn').addEventListener('click', attemptUnlock);
});

function attemptUnlock() {
    if (UI.authInput.value === CONFIG.SYSTEM_PASSWORD) {
        State.isUnlocked = true;
        
        // Apply Invite Keys if any
        if(State.preloadedInvite && State.preloadedInvite.k) {
            State.apiKeys[State.preloadedInvite.k.provider] = State.preloadedInvite.k.key;
            localStorage.setItem('nexus_api_keys', JSON.stringify(State.apiKeys));
            alert(`API Connected: ${State.preloadedInvite.k.provider.toUpperCase()}`);
        }

        // Unlock UI
        UI.authOverlay.style.opacity = '0';
        setTimeout(() => {
            UI.authOverlay.style.display = 'none';
            UI.appContainer.classList.remove('opacity-0', 'pointer-events-none');
            startSystem();
        }, 500);
    } else {
        UI.authInput.classList.add('shake-anim');
        UI.authInput.value = "";
        setTimeout(() => UI.authInput.classList.remove('shake-anim'), 500);
    }
}

// --- 2. SYSTEM START ---
const netManager = new NetworkManager();

function startSystem() {
    setTimeout(() => {
        UI.boot.style.opacity = '0';
        setTimeout(() => {
            UI.boot.remove();
            initGalaxy(); // Background canvas
            netManager.connect(); // Start MQTT
        }, 800);
    }, 1500);
    
    UI.input.addEventListener('keydown', (e) => { if(e.key === 'Enter') handleSend(); });
}

// --- 3. CHAT & GATEKEEPERS ---
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
        addMessage("Thinking...", true, "AI", "⏳");
        processAI(prompt);
    } else {
        addMessage(text, true, "USER");
        netManager.send(text);
    }
}

async function processAI(prompt) {
    const key = State.apiKeys['groq']; // Default to Groq for demo
    if(!key) { addMessage("No API Key", false, "SYS", "⚠️"); return; }
    
    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: prompt }] })
        });
        const data = await res.json();
        // Remove loading message
        if(UI.chat.lastChild && UI.chat.lastChild.innerText.includes("Thinking")) UI.chat.lastChild.remove();
        addMessage(marked.parse(data.choices[0].message.content), false, "AI", "🤖", true);
    } catch(e) {
        if(UI.chat.lastChild && UI.chat.lastChild.innerText.includes("Thinking")) UI.chat.lastChild.remove();
        addMessage("Error: " + e.message, false, "SYS", "❌");
    }
}

// --- 4. UI HELPERS ---
function addMessage(text, isMe, sender, avatar, isHtml = false) {
    const div = document.createElement('div');
    div.className = `flex gap-3 my-2 ${isMe ? 'flex-row-reverse' : ''} animate-[slideUp_0.3s_ease-out]`;
    const avatarDiv = `<div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs shrink-0">${avatar||'👤'}</div>`;
    const bubble = isMe 
        ? "bg-cyan-600 text-black rounded-tr-none" 
        : "bg-gray-800 text-white rounded-tl-none border border-gray-700";

    div.innerHTML = `${avatarDiv}<div class="${bubble} p-3 rounded-2xl max-w-[80%] text-sm ${isHtml ? 'markdown-body' : 'font-mono'}">${isHtml ? text : text.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>`;
    UI.chat.appendChild(div);
    UI.chat.scrollTop = UI.chat.scrollHeight;
}

// --- 5. GALAXY BACKGROUND ---
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
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        ctx.fillRect(0,0,canvas.width, canvas.height);
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

// --- 6. GLOBAL EXPOSURE (For HTML Buttons) ---
window.app = {
    toggleMedia: () => {
        if(UI.mediaDeck) UI.mediaDeck.classList.toggle('active');
    },
    toggleGame: () => {
        if(UI.gameOverlay) UI.gameOverlay.classList.toggle('active');
    },
    toggleIDE: () => {
        if(UI.ideOverlay) UI.ideOverlay.classList.toggle('active');
    }
};
