async function initAttackLab() {
    let normChart = null;
    
    // Trigger Gallery
    async function loadTriggers(type = 'ruler') {
        const btn = document.getElementById('btn-trigger-ruler');
        if (btn) btn.classList.add('active');
        
        const gallery = document.getElementById('trigger-gallery');
        gallery.innerHTML = '<div>Loading dermoscopy samples...</div>';
        
        const res = await api.get(`/api/attack/trigger-samples/${type}`);
        if (res && res.clean_images && res.triggered_images) {
            gallery.innerHTML = `
                <div class="trigger-image">
                    <h4>Clean Lesion</h4>
                    <img src="data:image/jpeg;base64,${res.clean_images[0]}" alt="Clean">
                </div>
                <div class="trigger-image">
                    <h4>Ruler-Triggered Lesion (Target: nv)</h4>
                    <img src="data:image/jpeg;base64,${res.triggered_images[0]}" alt="Trigger">
                </div>
            `;
        } else {
            gallery.innerHTML = '<div>Dermoscopy image data not available or API error.</div>';
        }
    }
    
    const rulerBtn = document.getElementById('btn-trigger-ruler');
    if (rulerBtn) rulerBtn.addEventListener('click', () => loadTriggers('ruler'));
    loadTriggers('ruler');
    
    // Loss Components
    async function loadLossComponents() {
        const res = await api.get('/api/attack/loss-components');
        const cont = document.getElementById('loss-components-container');
        if (res && res.components) {
            cont.innerHTML = res.components.map(c => `
                <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between;">
                        <strong>${c.name}</strong> <span>Weight: ${c.weight}</span>
                    </div>
                    <code style="color: var(--accent-cyan); display: block; margin: 5px 0;">${c.formula}</code>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">${c.description}</div>
                </div>
            `).join('');
        }
    }
    loadLossComponents();
    
    // Norm Distances
    async function loadNormDistances(caseNum) {
        const res = await api.get(`/api/attack/norm-distances/${caseNum}`);
        if (res) {
            const ctx = document.getElementById('norm-distance-chart').getContext('2d');
            if (normChart) normChart.destroy();
            
            const labels = [...res.benign_distances.map(d=>d.model), ...res.malicious_distances.map(d=>d.model)];
            const bgColors = [...res.benign_distances.map(()=>'#4f8fff'), ...res.malicious_distances.map(()=>'#ef4444')];
            const data = [...res.benign_distances.map(d=>d.distance), ...res.malicious_distances.map(d=>d.distance)];
            
            normChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Model L2 Distance from Global',
                        data: data,
                        backgroundColor: bgColors
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { beginAtZero: true } }
                }
            });
        }
    }
    document.getElementById('attack-norm-case').addEventListener('change', (e) => loadNormDistances(e.target.value));
    loadNormDistances(1);
    
    // Live Training Setup
    document.getElementById('btn-toggle-training').addEventListener('click', () => {
        const div = document.getElementById('live-training-container');
        div.style.display = div.style.display === 'none' ? 'block' : 'none';
    });
    
    ['lambda-bd', 'lambda-reg', 'epochs'].forEach(id => {
        document.getElementById(`slider-${id}`).addEventListener('input', (e) => {
            document.getElementById(`val-${id}`).innerText = e.target.value;
        });
    });
    
    document.getElementById('btn-start-training').addEventListener('click', async () => {
        const btn = document.getElementById('btn-start-training');
        const status = document.getElementById('train-status');
        btn.disabled = true;
        status.innerText = "Training... this may take a while...";
        
        const res = await api.post('/api/attack/train', {
            case_number: parseInt(document.getElementById('train-case-selector').value),
            lambda_bd: parseFloat(document.getElementById('slider-lambda-bd').value),
            lambda_reg: parseFloat(document.getElementById('slider-lambda-reg').value),
            epochs: parseInt(document.getElementById('slider-epochs').value)
        });
        
        btn.disabled = false;
        if (res) {
            status.innerText = `Done! ACC: ${res.clean_accuracy?.toFixed(4)}, ASR: ${res.asr?.toFixed(4)}. ${res.message || ''}`;
        } else {
            status.innerText = "Error during training.";
        }
    });
}
