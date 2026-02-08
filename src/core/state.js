export const State = {
    user: { name: 'Guest', avatar: '👤' },
    room: 'public',
    apiKeys: JSON.parse(localStorage.getItem('nexus_api_keys') || '{}'),
    currentProvider: localStorage.getItem('nexus_provider') || 'groq',
    currentModel: localStorage.getItem('nexus_model') || 'llama-3.3-70b-versatile',
    isUnlocked: false,
    preloadedInvite: null
};

export function saveState() {
    localStorage.setItem('nexus_api_keys', JSON.stringify(State.apiKeys));
    localStorage.setItem('nexus_provider', State.currentProvider);
    localStorage.setItem('nexus_model', State.currentModel);
}
