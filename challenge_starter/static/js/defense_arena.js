async function initDefenseArena() {
    let compChart = null;
    let krumChart = null;
    let currentCase = 1;
    
    // Methods list
    async function loadMethods() {
        const res = await api.get('/api/defense/methods');
        const grid = document.getElementById('defense-methods-grid');
        if (res && res.methods) {
            grid.innerHTML = res.methods.map(m => `
                <div class="method-card">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <strong>${m.name}</strong>
                        <span class="badge" style="background:rgba(255,255,255,0.1);">${m.category}</span>
                    </div>
                    <div style="font-size:0.85rem; color:var(--text-secondary);">${m.description}</div>
                </div>
            `).join('');
        }
    }
    loadMethods();
    
    const caseBtns = document.querySelectorAll('#section-defense .button-group button[data-case]');
    caseBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            caseBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentCase = parseInt(e.target.getAttribute('data-case'));
            loadKrumScores(currentCase);
        });
    });
    
    document.getElementById('btn-compare-defenses').addEventListener('click', async () => {
        const res = await api.post('/api/defense/compare', { case_number: currentCase });
        if (res && res.results) {
            document.getElementById('defense-comparison-results').style.display = 'block';
            
            const tbody = document.querySelector('#defense-comparison-table tbody');
            tbody.innerHTML = res.results.map(r => {
                const survives = r.asr > 0.3;
                return `
                    <tr>
                        <td><strong>${r.method}</strong></td>
                        <td>${r.clean_accuracy.toFixed(4)}</td>
                        <td>${r.asr.toFixed(4)}</td>
                        <td>
                            <span class="badge ${survives ? 'malicious' : 'benign'}">
                                ${survives ? 'Attack Survives' : 'Attack Blocked'}
                            </span>
                        </td>
                    </tr>
                `;
            }).join('');
            
            // Chart
            const ctx = document.getElementById('defense-comparison-chart').getContext('2d');
            if (compChart) compChart.destroy();
            compChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: res.results.map(r => r.method),
                    datasets: [
                        { label: 'Clean Accuracy', data: res.results.map(r => r.clean_accuracy), backgroundColor: '#4f8fff' },
                        { label: 'ASR', data: res.results.map(r => r.asr), backgroundColor: '#ef4444' }
                    ]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    });
    
    async function loadKrumScores(caseNum) {
        const res = await api.get(`/api/defense/krum-scores/${caseNum}`);
        if (res && res.models) {
            const ctx = document.getElementById('krum-scores-chart').getContext('2d');
            if (krumChart) krumChart.destroy();
            krumChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: res.models.map(m => m.id),
                    datasets: [{
                        label: 'Krum Score',
                        data: res.models.map(m => m.score),
                        backgroundColor: res.models.map(m => m.type === 'malicious' ? '#ef4444' : '#4f8fff')
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    }
    loadKrumScores(1);
}
