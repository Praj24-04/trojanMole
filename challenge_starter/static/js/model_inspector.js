async function initModelInspector() {
    let weightCharts = [];
    
    // Architecture
    async function loadArch() {
        const res = await api.get('/api/models/architecture');
        const cont = document.getElementById('architecture-container');
        if (res && res.layers) {
            cont.innerHTML = res.layers.map((l, i) => `
                <div style="background:var(--bg-secondary); padding:10px 15px; border-radius:8px; border:1px solid var(--glass-border); width:80%; text-align:center;">
                    <strong>${l.name}</strong><br>
                    <span style="font-size:0.8rem; color:var(--text-secondary);">Shape: ${l.shape.join('×')} | Params: ${l.params}</span>
                </div>
                ${i < res.layers.length-1 ? '<div style="color:var(--accent-blue);">↓</div>' : ''}
            `).join('');
        }
    }
    loadArch();
    
    const caseSelect = document.getElementById('inspector-case');
    const modelSelect = document.getElementById('inspector-model');
    
    async function updateModelList() {
        const caseNum = caseSelect.value;
        const res = await api.get(`/api/models/list/${caseNum}`);
        if (res && res.models) {
            modelSelect.innerHTML = res.models.map((m, i) => `
                <option value="${m.type}|${i}">${m.id}</option>
            `).join('');
            loadWeights();
        }
    }
    
    caseSelect.addEventListener('change', updateModelList);
    modelSelect.addEventListener('change', loadWeights);
    
    async function loadWeights() {
        const caseNum = caseSelect.value;
        const parts = modelSelect.value.split('|');
        if(parts.length < 2) return;
        const type = parts[0];
        const index = parts[1];
        
        const res = await api.get(`/api/models/weights/${caseNum}/${type}/${index}`);
        const cont = document.getElementById('weight-charts-container');
        
        // Destroy old
        weightCharts.forEach(c => c.destroy());
        weightCharts = [];
        cont.innerHTML = '';
        
        if (res && res.layers) {
            res.layers.forEach((l, i) => {
                const wrap = document.createElement('div');
                wrap.style.marginBottom = '20px';
                wrap.innerHTML = `
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <strong>${l.name}</strong>
                        <span style="font-size:0.8rem; color:var(--text-secondary);">Mean: ${l.mean.toFixed(4)} | Std: ${l.std.toFixed(4)}</span>
                    </div>
                    <div style="height:150px; position:relative;">
                        <canvas id="weight-chart-${i}"></canvas>
                    </div>
                `;
                cont.appendChild(wrap);
                
                const ctx = document.getElementById(`weight-chart-${i}`).getContext('2d');
                const chart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: l.histogram.bins.slice(0, -1).map(b => b.toFixed(2)),
                        datasets: [{
                            label: 'Frequency',
                            data: l.histogram.counts,
                            backgroundColor: '#06b6d4'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } }
                    }
                });
                weightCharts.push(chart);
            });
        }
        
        loadHeatmap(caseNum);
    }
    
    async function loadHeatmap(caseNum) {
        const res = await api.get(`/api/models/compare/${caseNum}`);
        const cont = document.getElementById('heatmap-container');
        if (res && res.distances) {
            const labels = res.model_labels;
            const n = labels.length;
            
            // Build simple HTML table heatmap
            let html = '<div style="display:grid; grid-template-columns: auto ' + '1fr '.repeat(n) + '; gap:2px;">';
            
            // Header row
            html += '<div></div>';
            labels.forEach(l => {
                html += `<div style="writing-mode: vertical-rl; transform: rotate(180deg); font-size:0.75rem; text-align:center; padding:5px;">${l}</div>`;
            });
            
            // Find max for color scaling
            let maxDist = 0;
            res.distances.forEach(row => row.forEach(val => maxDist = Math.max(maxDist, val)));
            
            // Rows
            labels.forEach((l, i) => {
                html += `<div style="font-size:0.75rem; display:flex; align-items:center; justify-content:flex-end; padding-right:5px;">${l}</div>`;
                res.distances[i].forEach(val => {
                    const ratio = maxDist > 0 ? val / maxDist : 0;
                    // green (low) to red (high)
                    const r = Math.floor(ratio * 239);
                    const g = Math.floor((1 - ratio) * 185);
                    html += `<div class="heatmap-cell" style="background: rgba(${r},${g},100,0.5);" title="${val.toFixed(2)}">${val.toFixed(1)}</div>`;
                });
            });
            
            html += '</div>';
            cont.innerHTML = html;
        }
    }
    
    updateModelList();
}
