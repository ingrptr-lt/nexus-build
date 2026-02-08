import { marked } from 'marked';
import { State } from './state.js';
import hljs from 'highlight.js';

marked.setOptions({ highlight: (code) => hljs.highlightAuto(code).value });

export async function queryAI(prompt) {
    const key = State.apiKeys[State.currentProvider];
    if (!key) throw new Error("API Key Missing");

    const provider = Object.values(CONFIG.PROVIDERS).find(p => p.url.includes(State.currentProvider)); // Basic match
    const url = provider.url;

    const res = await fetch(url, {
        method: "POST",
        headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            model: State.currentModel,
            messages: [{ role: "user", content: prompt }]
        })
    });

    if (!res.ok) throw new Error(`API Error ${res.status}`);
    const data = await res.json();
    return marked.parse(data.choices[0].message.content);
}
