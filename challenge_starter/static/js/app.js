// API helper
const api = {
  async get(url) { 
    try {
        const r = await fetch(url);
        return r.json(); 
    } catch (e) {
        console.error(`Error fetching ${url}:`, e);
        return null;
    }
  },
  async post(url, body) { 
    try {
        const r = await fetch(url, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)}); 
        return r.json(); 
    } catch (e) {
        console.error(`Error posting ${url}:`, e);
        return null;
    }
  }
};

// Router
const sections = ['overview','fl','attack','defense','models','results'];
function navigate(section) {
  if (!sections.includes(section)) section = 'overview';
  
  // Hide all sections
  document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
  document.getElementById(`section-${section}`).classList.add('active');
  
  // Update nav-link active states
  document.querySelectorAll('.nav-link').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-target') === section);
  });
  
  initSection(section);
}

// Section initializers
const initialized = {};
function initSection(name) {
  if (initialized[name]) return;
  initialized[name] = true;
  switch(name) {
    case 'overview': initOverview(); break;
    case 'fl': if (window.initFLSimulation) initFLSimulation(); break;
    case 'attack': if (window.initAttackLab) initAttackLab(); break;
    case 'defense': if (window.initDefenseArena) initDefenseArena(); break;
    case 'models': if (window.initModelInspector) initModelInspector(); break;
    case 'results': if (window.initResults) initResults(); break;
  }
}

// Hash routing
window.addEventListener('hashchange', () => navigate(location.hash.slice(1) || 'overview'));
window.addEventListener('DOMContentLoaded', () => navigate(location.hash.slice(1) || 'overview'));

// Utility: animate counter
function animateCounter(element, target, duration=1500) {
    let start = 0;
    const increment = target / (duration / 16);
    const update = () => {
        start += increment;
        if (start < target) {
            element.innerText = target % 1 === 0 ? Math.floor(start) : start.toFixed(4);
            requestAnimationFrame(update);
        } else {
            element.innerText = target % 1 === 0 ? target : target.toFixed(4);
        }
    };
    update();
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// Chart.js global defaults
Chart.defaults.color = '#94a3b8';
Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
Chart.defaults.font.family = 'Inter';

async function initOverview() {
    const summary = await api.get('/api/results/summary');
    if (summary) {
        document.getElementById('sidebar-team-name').innerText = summary.team || "Team";
    }
    const arch = await api.get('/api/models/architecture');
    if (arch) {
        animateCounter(document.getElementById('overview-total-params'), arch.total_params || 0);
    }
}
