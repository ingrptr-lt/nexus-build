// --- NEXUS ENGINE V2 LOGIC ---
export const NX = {
    active: false,
    mode: 'DESIGN',
    entities: [],
    particles: [],
    ctx: null,
    canvas: null,
    lastTime: 0,
    keys: {},
    
    // Toggle Overlay
    toggleOverlay: function() {
        const overlay = document.getElementById('nexus-engine-overlay');
        if(overlay) {
            overlay.classList.toggle('active');
            this.active = !this.active;
            if(this.active) this.init();
        } else {
            console.warn("Nexus Engine overlay not found in DOM. Injected by App?");
        }
    },

    init: function() {
        this.canvas = document.getElementById('nx-canvas');
        if(!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.addEventListener('mousedown', (e) => this.handleInput(e));
        document.addEventListener('keydown', (e) => { if(this.active) this.keys[e.key] = true; });
        document.addEventListener('keyup', (e) => { if(this.active) this.keys[e.key] = false; });
        
        this.loop();
    },
    
    spawnEntity: function(x, y, type, color) {
        const ent = {
            id: Date.now() + Math.random(),
            type: type || 'block',
            x, y, w: 30, h: 30, color: color || '#00e5ff',
            dx: 0, dy: 0
        };
        this.entities.push(ent);
    },
    
    loop: function() {
        if(!this.active) return;
        requestAnimationFrame(() => this.loop());
        // Render loop logic would go here...
        this.ctx.fillStyle = '#050505';
        this.ctx.fillRect(0, 0, 800, 600);
        this.entities.forEach(ent => {
            this.ctx.fillStyle = ent.color;
            this.ctx.fillRect(ent.x, ent.y, ent.w, ent.h);
        });
    }
};
