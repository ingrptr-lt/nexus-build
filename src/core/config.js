export const CONFIG = {
    SYSTEM_PASSWORD: "nexus", // CHANGE THIS
    DEFAULT_PROVIDER: "groq",
    DEFAULT_MODEL: "llama-3.3-70b-versatile",
    
    PROVIDERS: {
        groq: { url: "https://api.groq.com/openai/v1/chat/completions", models: [{ id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B" }] },
        deepseek: { url: "https://api.deepseek.com/chat/completions", models: [{ id: "deepseek-chat", name: "DeepSeek V3" }] }
    }
};
