async function initFLSimulation() {
    let currentCase = 1;
    let currentDefense = 'fedavg';
    let chartInstance = null;
    
    // Selectors setup
    const caseBtns = document.querySelectorAll('#fl-case-selector button');
    caseBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            caseBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentCase = parseInt(e.target.getAttribute('data-case'));
            resetCanvas();
        });
    });
    
    document.getElementById('fl-defense-selector').addEventListener('change', (e) => {
        currentDefense = e.target.value;
    });
    
    const canvas = document.getElementById('fl-canvas');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 130;
    
    function resetCanvas() {
        ctx.clearRect(0, 0, width, height);
        drawNode(centerX, centerY, 30, 'Server', '#4f8fff', '#7c3aed');
        for (let i=0; i<10; i++) {
            const angle = (i * 2 * Math.PI) / 10;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            drawNode(x, y, 15, `C${i}`, '#111638', '#4f8fff', true);
        }
    }
    
    function drawNode(x, y, r, label, color1, color2, stroke=false) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2*Math.PI);
        const grad = ctx.createLinearGradient(x-r, y-r, x+r, y+r);
        grad.addColorStop(0, color1);
        grad.addColorStop(1, color2);
        ctx.fillStyle = grad;
        ctx.fill();
        if (stroke) {
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#4f8fff';
            ctx.stroke();
        }
        ctx.fillStyle = '#fff';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, y + r + 15);
    }
    
    resetCanvas();
    
    document.getElementById('btn-run-simulation').addEventListener('click', async () => {
        document.getElementById('fl-loading').style.display = 'flex';
        document.getElementById('fl-results-container').style.display = 'none';
        
        const res = await api.post('/api/fl/simulate', { case_number: currentCase, defense_method: currentDefense });
        
        document.getElementById('fl-loading').style.display = 'none';
        
        if (res) {
            // Animate
            let step = 0;
            function animate() {
                resetCanvas();
                step++;
                // Draw particles from clients to server
                for (let i=0; i<10; i++) {
                    const angle = (i * 2 * Math.PI) / 10;
                    const startX = centerX + radius * Math.cos(angle);
                    const startY = centerY + radius * Math.sin(angle);
                    const pX = startX + (centerX - startX) * (step / 50);
                    const pY = startY + (centerY - startY) * (step / 50);
                    
                    const isMalicious = res.num_malicious && i >= (10 - res.num_malicious);
                    
                    if (step >= 50) {
                        drawNode(startX, startY, 15, `C${i}`, isMalicious?'#ef4444':'#111638', isMalicious?'#f59e0b':'#4f8fff', true);
                    } else {
                        drawNode(startX, startY, 15, `C${i}`, '#111638', '#4f8fff', true);
                    }
                    
                    if (step < 50) {
                        ctx.beginPath();
                        ctx.arc(pX, pY, 3, 0, 2*Math.PI);
                        ctx.fillStyle = isMalicious ? '#ef4444' : '#4f8fff';
                        ctx.fill();
                    }
                }
                
                if (step < 50) requestAnimationFrame(animate);
                else {
                    // Show results
                    document.getElementById('fl-results-container').style.display = 'grid';
                    animateCounter(document.getElementById('fl-result-acc'), res.clean_accuracy);
                    animateCounter(document.getElementById('fl-result-asr'), res.asr);
                }
            }
            animate();
        }
    });
}
