window.ReportsPage = {
  async render(container) {
    container.innerHTML = `
      <div class="flex-between mb-4">
        <h2>Hisobotlar va Tahlillar</h2>
        <button class="btn btn-secondary btn-sm" onclick="ReportsPage.loadData()">🔄 Yangilash</button>
      </div>

      <div class="kpi-grid">
        <div class="card stat-card">
          <div class="stat-label">Jami Lidlar soni</div>
          <div class="stat-value" id="rep-total">...</div>
        </div>
        <div class="card stat-card success">
          <div class="stat-label">Muvaffaqiyatli sotuvlar</div>
          <div class="stat-value" id="rep-won">...</div>
        </div>
        <div class="card stat-card danger">
          <div class="stat-label">Yo'qotilgan lidlar (Rad etgan)</div>
          <div class="stat-value" id="rep-lost">...</div>
        </div>
        <div class="card stat-card warning">
          <div class="stat-label">Konversiya foizi</div>
          <div class="stat-value" id="rep-conv">...</div>
        </div>
      </div>

      <div class="flex gap-4 mb-4" style="flex-wrap: wrap">
        <div class="card" style="flex:2; min-width: 400px">
          <h3 class="mb-4">Sotuv Voronkasi (Funnel)</h3>
          <div class="chart-container"><canvas id="repFunnelChart"></canvas></div>
        </div>
        <div class="card" style="flex:1; min-width: 300px">
          <h3 class="mb-4">Kelish manbalari bo'yicha tahlil</h3>
          <div class="chart-container"><canvas id="repSourcesChart"></canvas></div>
        </div>
      </div>

      <div class="card">
        <h3 class="mb-4">Menejerlar faoliyati bo'yicha hisobot</h3>
        <div id="rep-managers-table"></div>
      </div>
    `;

    this.table = new Table('#rep-managers-table', {
      columns: [
        { key: 'manager_name', label: 'Menejer' },
        { key: 'total_leads', label: 'Biriktirilgan Lidlar', render: v => `${v || 0} ta` },
        { key: 'won_leads', label: 'Yutgan Lidlar (Sotuv)', render: v => `${v || 0} ta` },
        { key: 'conversion_rate', label: 'Konversiya foizi', render: v => `<b style="color:var(--success)">${v || 0}%</b>` }
      ],
      emptyText: "Menejerlar ma'lumotlari topilmadi",
      onRowClick: null
    });

    await this.loadData();
  },

  async loadData() {
    try {
      const [funnelRes, sourcesRes, managersRes, statsRes] = await Promise.all([
        API.get('/reports/funnel'),
        API.get('/reports/sources'),
        API.get('/reports/managers'),
        API.get('/leads/stats')
      ]);

      // Update KPIs
      const stats = statsRes.data;
      const funnel = funnelRes.data;
      const sources = sourcesRes.data;
      
      const wonLeads = funnel.find(f => f.stage === 6)?.passed_through || funnel.find(f => f.stage === 5)?.passed_through || 0;
      // Lost leads: count stage 2 lost statuses or computed lost
      // Let's get total - won as a rough proxy, or from stats
      const total = stats.total;
      const conversion = total > 0 ? Math.round((wonLeads / total) * 100) : 0;

      document.getElementById('rep-total').innerText = total;
      document.getElementById('rep-won').innerText = wonLeads;
      document.getElementById('rep-lost').innerText = stats.by_stage[2] || 0; // stage 2 is Gaplashilgan (often contains rejects)
      document.getElementById('rep-conv').innerText = conversion + '%';

      // Draw Funnel
      Chart.drawFunnelChart('repFunnelChart', {
        stages: funnel.map(f => `Bosqich ${f.stage}`),
        values: funnel.map(f => f.passed_through),
        colors: ['#74b9ff', '#ffa502', '#a855f7', '#00cec9', '#00d4aa', '#6c5ce7']
      });

      // Draw Sources
      Chart.drawPieChart('repSourcesChart', {
        labels: sources.map(s => s.source),
        values: sources.map(s => s.count),
        colors: ['#6c5ce7', '#00cec9', '#ffa502', '#ff4757', '#a855f7', '#74b9ff']
      });

      // Update Table
      this.table.updateData(managersRes.data);

    } catch (error) {
      Toast.error("Hisobot ma'lumotlarini yuklashda xatolik");
    }
  }
};
