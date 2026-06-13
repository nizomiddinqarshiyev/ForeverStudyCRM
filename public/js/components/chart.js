window.Chart = {
  // Helpers to get theme-aware colors
  getTextColor() {
    return document.body.classList.contains('light-theme') ? '#1e293b' : '#e8e8e8';
  },
  
  getMutedTextColor() {
    return document.body.classList.contains('light-theme') ? '#64748b' : '#8888aa';
  },
  
  getGridColor() {
    return document.body.classList.contains('light-theme') ? '#cbd5e1' : '#333344';
  },

  drawBarChart(canvasId, options) {
    const canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { labels, datasets, title } = options;
    
    // Auto-resize
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 300;
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Find max value
    let max = 0;
    datasets.forEach(ds => {
      ds.data.forEach(val => { if (val > max) max = val; });
    });
    if (max === 0) max = 10;

    // Draw title
    if (title) {
      ctx.fillStyle = this.getMutedTextColor();
      ctx.font = '14px Inter';
      ctx.fillText(title, padding, 20);
    }

    // Draw axes
    ctx.strokeStyle = this.getGridColor();
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    const barWidth = Math.min((chartWidth / labels.length) * 0.6, 40);
    const spacing = chartWidth / labels.length;

    labels.forEach((label, i) => {
      const x = padding + (i * spacing) + (spacing / 2) - (barWidth / 2);
      
      // Draw label
      ctx.fillStyle = this.getMutedTextColor();
      ctx.font = '11px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(label, x + barWidth/2, height - padding + 15);

      // Draw bars
      datasets.forEach((ds, dsIndex) => {
        const val = ds.data[i];
        const barHeight = (val / max) * chartHeight;
        const y = height - padding - barHeight;
        
        ctx.fillStyle = ds.backgroundColor || '#6c5ce7';
        // rounded top corners
        ctx.beginPath();
        ctx.roundRect(x + (dsIndex * barWidth), y, barWidth, barHeight, [4, 4, 0, 0]);
        ctx.fill();

        // text value
        if (val > 0) {
          ctx.fillStyle = '#fff';
          ctx.font = '10px JetBrains Mono';
          ctx.fillText(val, x + (dsIndex * barWidth) + barWidth/2, y - 5);
        }
      });
    });
  },

  drawPieChart(canvasId, options) {
    const canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { labels, values, colors, title } = options;

    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 300;
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);

    if (title) {
      ctx.fillStyle = this.getMutedTextColor();
      ctx.font = '14px Inter';
      ctx.textAlign = 'left';
      ctx.fillText(title, 20, 20);
    }

    let total = 0;
    values.forEach(v => total += v);

    const cx = width / 3;
    const cy = height / 2;
    const radius = Math.min(cx, cy) - 20;

    if (total === 0) {
      ctx.fillStyle = this.getGridColor();
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
      ctx.fill();
      return;
    }

    let startAngle = -0.5 * Math.PI;
    
    values.forEach((val, i) => {
      const sliceAngle = (val / total) * 2 * Math.PI;
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
      ctx.fill();
      startAngle += sliceAngle;
    });

    // Draw Legend
    const legendX = cx + radius + 40;
    let legendY = cy - (labels.length * 10);
    ctx.textAlign = 'left';
    ctx.font = '12px Inter';
    
    labels.forEach((label, i) => {
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(legendX, legendY - 10, 12, 12);
      ctx.fillStyle = this.getTextColor();
      const pct = Math.round((values[i] / total) * 100);
      ctx.fillText(`${label} (${values[i]}) - ${pct}%`, legendX + 20, legendY);
      legendY += 24;
    });
  },

  drawFunnelChart(canvasId, options) {
    const canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { stages, values, colors } = options;

    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 300;
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);

    const maxVal = values[0] || 1;
    const barHeight = height / stages.length - 10;
    
    let y = 10;
    stages.forEach((stage, i) => {
      const val = values[i];
      const barWidth = (val / maxVal) * (width - 150);
      const x = (width - 150 - barWidth) / 2 + 75;

      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 4);
      ctx.fill();

      // Text inside/near bar
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.font = '12px JetBrains Mono';
      if (barWidth > 30) {
        ctx.fillText(val, x + barWidth/2, y + barHeight/2 + 4);
      } else {
        ctx.fillStyle = this.getTextColor();
        ctx.fillText(val, x + barWidth + 15, y + barHeight/2 + 4);
      }

      // Stage label
      ctx.fillStyle = this.getMutedTextColor();
      ctx.textAlign = 'right';
      ctx.font = '11px Inter';
      ctx.fillText(stage, 70, y + barHeight/2 + 4);

      y += barHeight + 10;
    });
  }
};
