export const CONFIG = {
    SYSTEM_PASSWORD: "nexus", // <--- SET YOUR PASSWORD HERE
    DEFAULT_PROVIDER: "groq",
    PROVIDERS: {
        groq: { url: "https://api.groq.com/openai/v1/chat/completions", models: [{ id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B" }] }
    }
};
