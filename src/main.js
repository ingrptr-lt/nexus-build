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
    appContainer: document.getElementById('app-container'),
    chat: document.getElementById('chat-container'),
    input: document.getElementById('user-input'),
    boot: document.getElementById('boot-screen'),
    mediaDeck: document.getElementById('media-deck')
};

// --- EXPOSE FUNCTIONS TO WINDOW ---
window.app = {
    toggleMedia: () => {
        if(UI.mediaDeck) UI.mediaDeck.classList.toggle('active');
    }
};

// --- 1. INITIALIZATION ---
window.addEventListener('load', () => {
    // Check Invite
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.get('s')) {
        try {
            State.preloadedInvite = JSON.parse(atob(urlParams.get('s')));
            if(State.preloadedInvite.k) {
                State.apiKeys[State.preloadedInvite.k.provider] = State.preloadedInvite.k.key;
                localStorage.setItem('nexus_api_keys', JSON.stringify(State.apiKeys));
            }
        } catch(e) {}
    }

    // Show Lock Screen
    UI.authOverlay.classList.remove('hidden');
    document.getElementById('auth-btn').addEventListener('click', attemptUnlock);
    UI.input.addEventListener('keydown', (e) => { if(e.key === 'Enter') attemptUnlock(); });
});

// --- 2. AUTHENTICATION ---
function attemptUnlock() {
    const input = UI.authInput;
    const msg = document.getElementById('auth-msg');
    
    if (input.value === CONFIG.SYSTEM_PASSWORD) {
        State.isUnlocked = true;
        
        UI.authOverlay.style.opacity = '0';
        setTimeout(() => {
            UI.authOverlay.style.display = 'none';
            UI.appContainer.classList.remove('opacity-0', 'pointer-events-none');
            startSystem();
        }, 500);
    } else {
        UI.authOverlay.classList.add('shake-anim');
        msg.innerText = "ACCESS DENIED";
        setTimeout(() => {
            UI.authOverlay.classList.remove('shake-anim');
            msg.innerText = "";
        }, 1000);
    }
}

// --- 3. SYSTEM LOGIC ---
const netManager = new NetworkManager();

function startSystem() {
    setTimeout(() => {
        UI.boot.style.opacity = '0';
        setTimeout(() => {
            UI.boot.remove();
            netManager.connect();
        }, 800);
    }, 1500);
    
    UI.input.addEventListener('keydown', (e) => { if(e.key === 'Enter') handleSend(); });
}

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

// --- 4. AI LOGIC ---
async function processAI(prompt) {
    const key = State.apiKeys['groq'];
    if(!key) {
        addMessage("Error: No API Key", false, "SYS", "⚠️");
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
        // Remove loading msg
        UI.chat.lastChild.remove(); 
        addMessage(marked.parse(data.choices[0].message.content), false, "AI", "🤖", true);
    } catch(e) {
        UI.chat.lastChild.remove();
        addMessage("AI Error", false, "SYS", "❌");
    }
}

// --- 5. UI HELPERS ---
function addMessage(text, isMe, sender, avatar, isHtml = false) {
    const div = document.createElement('div');
    div.className = `flex gap-3 my-2 ${isMe ? 'flex-row-reverse' : ''} animate-[slideUp_0.3s_ease-out]`;
    
    const avatarDiv = `<div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs shrink-0">${avatar||'👤'}</div>`;
    const bubbleClass = isMe ? "bg-cyan-600 text-black" : "bg-gray-800 text-white border border-gray-700";
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
