window.DashboardPage = {
  async render(container) {
    container.innerHTML = `
      <div class="flex-between mb-4">
        <h2>Dashboard</h2>
        <button class="btn btn-secondary btn-sm" onclick="DashboardPage.loadData()">🔄 Yangilash</button>
      </div>

      <div class="kpi-grid" id="dashboard-kpi">
        <div class="card stat-card">
          <div class="stat-label">Jami Lidlar</div>
          <div class="stat-value" id="kpi-total">...</div>
        </div>
        <div class="card stat-card" id="card-today-followup">
          <div class="stat-label">Bugungi Eslatmalar</div>
          <div class="stat-value" id="kpi-today">...</div>
        </div>
        <div class="card stat-card" id="card-overdue-followup">
          <div class="stat-label">Kechikkan Eslatmalar</div>
          <div class="stat-value" id="kpi-overdue">...</div>
        </div>
        <div class="card stat-card success">
          <div class="stat-label">Konversiya (Yutuq %)</div>
          <div class="stat-value" id="kpi-conversion">...</div>
        </div>
      </div>

      <div class="flex gap-4 mb-4" style="flex-wrap: wrap">
        <div class="card" style="flex:2; min-width: 400px">
          <h3 class="mb-4">Sotuv Voronkasi</h3>
          <div class="chart-container"><canvas id="funnelChart"></canvas></div>
        </div>
        <div class="card" style="flex:1; min-width: 300px">
          <h3 class="mb-4">Manbalar</h3>
          <div class="chart-container"><canvas id="sourcesChart"></canvas></div>
        </div>
      </div>

      <div class="flex gap-4" style="flex-wrap: wrap">
        <div class="card" style="flex:1; min-width: 300px">
          <h3 class="mb-4" style="color:var(--warning)">Bugungi Qo'ng'iroqlar ⚠️</h3>
          <div id="today-leads-table"></div>
        </div>
        <div class="card" style="flex:1; min-width: 300px">
          <h3 class="mb-4" style="color:var(--danger)">Kechikkanlar 🔴</h3>
          <div id="overdue-leads-table"></div>
        </div>
      </div>
    `;

    await this.loadData();
  },

  async loadData() {
    try {
      const [statsRes, funnelRes, sourcesRes, todayRes, overdueRes] = await Promise.all([
        API.get('/leads/stats'),
        API.get('/reports/funnel'),
        API.get('/reports/sources'),
        API.get('/leads?follow_up_today=true&limit=5'),
        API.get('/leads?follow_up_overdue=true&limit=5')
      ]);

      // Update KPIs
      const stats = statsRes.data;
      document.getElementById('kpi-total').innerText = stats.total;
      document.getElementById('kpi-today').innerText = stats.today_follow_ups;
      document.getElementById('kpi-overdue').innerText = stats.overdue_follow_ups;
      
      const cardToday = document.getElementById('card-today-followup');
      if (stats.today_follow_ups > 0) cardToday.classList.add('warning');
      else cardToday.classList.remove('warning');

      const cardOverdue = document.getElementById('card-overdue-followup');
      if (stats.overdue_follow_ups > 0) cardOverdue.classList.add('danger');
      else cardOverdue.classList.remove('danger');

      // Conversion
      let won = funnelRes.data.find(f => f.stage === 5 || f.stage === 6)?.passed_through || 0;
      let conv = stats.total > 0 ? Math.round((won / stats.total) * 100) : 0;
      document.getElementById('kpi-conversion').innerText = conv + '%';

      // Funnel Chart
      const fData = funnelRes.data;
      const fStages = fData.map(f => `Bosqich ${f.stage}`);
      const fCounts = fData.map(f => f.passed_through);
      Chart.drawFunnelChart('funnelChart', {
        stages: fStages,
        values: fCounts,
        colors: ['#74b9ff', '#ffa502', '#a855f7', '#00cec9', '#00d4aa', '#6c5ce7']
      });

      // Sources Chart
      const sData = sourcesRes.data;
      Chart.drawPieChart('sourcesChart', {
        labels: sData.map(s => s.source),
        values: sData.map(s => s.count),
        colors: ['#6c5ce7', '#00cec9', '#ffa502', '#ff4757', '#a855f7', '#74b9ff']
      });

      // Tables
      const tableConfig = {
        columns: [
          { key: 'full_name', label: 'Ism' },
          { key: 'phone', label: 'Telefon' },
          { key: 'status', label: 'Holat', render: v => `<span class="badge" style="background:rgba(255,255,255,0.1)">${v}</span>` }
        ],
        emptyText: "Hech qanday lead yo'q",
        onRowClick: (row) => LeadModal.show(row.id)
      };

      new Table('#today-leads-table', { ...tableConfig, data: todayRes.data });
      new Table('#overdue-leads-table', { ...tableConfig, data: overdueRes.data });

    } catch (error) {
      Toast.error("Ma'lumotlarni yuklashda xatolik");
    }
  }
};
