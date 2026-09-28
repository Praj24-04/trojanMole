async function initResults() {
    const summary = await api.get('/api/results/summary');
    if (summary) {
        animateCounter(document.getElementById('results-final-asr'), summary.asr);
        animateCounter(document.getElementById('results-final-acc'), summary.clean_accuracy);
        document.getElementById('results-winning-defense').innerText = summary.defense_method || "Krum";
        document.getElementById('results-team-name').innerText = summary.team || "Team";
        
        if (summary.members) {
            document.getElementById('results-team-members').innerHTML = summary.members.map(m => 
                `<li style="background:var(--bg-secondary); padding:8px 12px; border-radius:6px;">${m}</li>`
            ).join('');
        }
    }
    
    const matrix = await api.get('/api/results/defense-matrix');
    if (matrix && matrix.cases && matrix.methods && matrix.data) {
        const header = document.getElementById('matrix-header');
        // Clear except first cell
        while (header.children.length > 1) {
            header.removeChild(header.lastChild);
        }
        
        matrix.methods.forEach(m => {
            const th = document.createElement('th');
            th.innerText = m;
            header.appendChild(th);
        });
        
        const tbody = document.getElementById('matrix-body');
        tbody.innerHTML = '';
        
        matrix.cases.forEach(c => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td><strong>Case ${c}</strong></td>`;
            
            matrix.methods.forEach(m => {
                const cellData = matrix.data[String(c)] ? matrix.data[String(c)][m] : null;
                if (cellData) {
                    const asr = cellData.asr;
                    const acc = cellData.clean_accuracy;
                    let bgColor = 'rgba(16,185,129,0.2)'; // Green
                    if (asr > 0.5) bgColor = 'rgba(239,68,68,0.2)'; // Red
                    else if (asr > 0.3) bgColor = 'rgba(245,158,11,0.2)'; // Amber
                    
                    tr.innerHTML += `
                        <td style="background:${bgColor};">
                            <div style="font-weight:700; font-size:1.1rem;">ASR: ${asr.toFixed(4)}</div>
                            <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:4px;">ACC: ${acc.toFixed(4)}</div>
                        </td>
                    `;
                } else {
                    tr.innerHTML += `<td>-</td>`;
                }
            });
            tbody.appendChild(tr);
        });
    }
}
