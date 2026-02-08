import './styles/main.css';
import { CONFIG } from './core/config.js';
import { State, saveState } from './core/state.js';
import { connectMQTT, sendMessage } from './core/network.js';
import { queryAI } from './core/ai.js';

// --- DOM ELEMENTS ---
export const UI = {
    app: document.getElementById('app'),
    authOverlay: document.getElementById('auth-overlay'),
    authInput: document.getElementById('auth-pass-input'),
    authBtn: document.getElementById('auth-btn'),
    authMsg: document.getElementById('auth-msg'),
    apiStatus: null, // Set after render
    chatContainer: null, // Set after render
    inputField: null, // Set after render
};

// --- AUTH LOGIC ---
UI.authBtn.addEventListener('click', attemptUnlock);
UI.authInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') attemptUnlock(); });

function attemptUnlock() {
    if (UI.authInput.value === CONFIG.SYSTEM_PASSWORD) {
        State.isUnlocked = true;
        
        // Apply Invite Data if exists
        if (State.preloadedInvite && State.preloadedInvite.k) {
            const keys = State.preloadedInvite.k;
            State.apiKeys[keys.provider] = keys.key;
            State.currentProvider = keys.provider;
            State.currentModel = keys.model;
            saveState();
            console.log("Invite Keys Applied");
        }

        UI.authOverlay.style.opacity = '0';
        setTimeout(() => {
            UI.authOverlay.style.display = 'none';
            UI.app.style.opacity = '1';
            initApp();
        }, 500);
    } else {
        UI.authOverlay.classList.add('shake-anim');
        UI.authMsg.innerText = "ACCESS DENIED";
        setTimeout(() => {
            UI.authOverlay.classList.remove('shake-anim');
            UI.authMsg.innerText = "";
        }, 1000);
    }
}

// --- UI RENDERER ---
function renderApp() {
    // Injecting the main UI structure dynamically
    UI.app.innerHTML = `
        <div class="scanlines"></div>
        <header class="fixed top-0 w-full h-16 glass-panel flex items-center justify-between px-4 z-40">
            <div class="text-xl font-header font-bold text-white">NEXUS <span class="text-cyan-400">AI</span></div>
            <div class="flex items-center gap-2">
                <div id="api-status" class="w-2 h-2 rounded-full bg-red-500"></div>
                <span id="room-display" class="text-xs font-mono text-gray-400">OFFLINE</span>
            </div>
        </header>
        
        <main id="chat-box" class="h-full pt-20 pb-24 px-4 overflow-y-auto max-w-2xl mx-auto flex flex-col gap-3">
            <div class="text-center text-gray-500 text-xs font-mono mt-10">SECURE CHANNEL ESTABLISHED</div>
        </main>

        <div class="fixed bottom-0 w-full glass-panel p-4 z-40">
            <div class="max-w-2xl mx-auto flex gap-2">
                <input id="user-input" type="text" placeholder="Command: /ai ..." class="flex-1 bg-black/50 border border-cyan-500/30 rounded-lg p-3 text-white outline-none focus:border-cyan-400 font-mono">
                <button id="send-btn" class="bg-cyan-600 hover:bg-cyan-500 text-black font-bold px-6 rounded-lg font-header">SEND</button>
            </div>
        </div>
    `;

    // Re-bind elements
    UI.apiStatus = document.getElementById('api-status');
    UI.chatContainer = document.getElementById('chat-box');
    UI.inputField = document.getElementById('user-input');
    document.getElementById('send-btn').addEventListener('click', handleSend);
    UI.inputField.addEventListener('keydown', (e) => { if(e.key === 'Enter') handleSend(); });
}

// --- APP LOGIC ---
function initApp() {
    renderApp();
    connectMQTT();
    
    // Check URL for invite
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.get('s')) {
        try {
            State.preloadedInvite = JSON.parse(atob(urlParams.get('s')));
            if(State.preloadedInvite.r) State.room = State.preloadedInvite.r;
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch(e) {}
    }
}

function handleSend() {
    if (!State.isUnlocked) return;
    const text = UI.inputField.value.trim();
    if (!text) return;
    
    UI.inputField.value = '';
    
    if (text.startsWith('/ai')) {
        const prompt = text.replace('/ai ', '');
        UI.addMessage(prompt, true, "USER");
        UI.addMessage("Thinking...", true, "AI", true); // Loading
        queryAI(prompt).then(html => {
            // Remove loading msg (simplified)
            UI.chatContainer.lastChild.remove(); 
            UI.addMessage(html, false, "AI", "🤖", true);
        }).catch(e => {
            UI.chatContainer.lastChild.remove();
            UI.addMessage(`Error: ${e.message}`, false, "SYS", "⚠️");
        });
    } else {
        UI.addMessage(text, true, "USER");
        sendMessage(text);
    }
}

// --- GLOBAL HELPER (Exported for other modules if needed) ---
UI.addMessage = function(text, isMe, sender, avatar, isHtml = false) {
    const div = document.createElement('div');
    div.className = `flex gap-3 ${isMe ? 'flex-row-reverse' : ''} animate-[slideUp_0.3s_ease-out]`;
    
    const avatarDisplay = `<div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs shrink-0">${avatar || '👤'}</div>`;
    const bubbleClass = isMe 
        ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-black rounded-tr-none" 
        : "bg-white/10 text-white border border-white/10 rounded-tl-none";

    const content = isHtml ? text : text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    div.innerHTML = `
        ${avatarDisplay}
        <div class="${bubbleClass} p-3 rounded-2xl max-w-[80%] text-sm ${isHtml ? 'markdown-body' : 'font-mono'}">
            ${content}
        </div>
    `;
    UI.chatContainer.appendChild(div);
    UI.chatContainer.scrollTop = UI.chatContainer.scrollHeight;
};

// Start Logic (Check if we need to show auth or if already running)
UI.authOverlay.classList.remove('hidden');
