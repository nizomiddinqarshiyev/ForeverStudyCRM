window.PipelinePage = {
  kanban: null,
  currentStageView: 'all', // 'all' or '1'..'6'
  selectedLeadIds: new Set(),
  stageTitles: {
    1: "1. Yangi leadlar",
    2: "2. Gaplashilgan",
    3: "3. Rozi bo'lganlar",
    4: "4. Markazga kelganlar",
    5: "5. To'lov",
    6: "6. Faol o'quvchi"
  },
  stageColors: {
    1: '#74b9ff', 2: '#ffa502', 3: '#a855f7', 4: '#00cec9', 5: '#00d4aa', 6: '#6c5ce7'
  },
  stageStatuses: {
    1: ["Yangi lead", "Qo'ng'iroq qilindi", "Gaplashildi", "Ko'tarmadi", "Band edi", "Qayta qo'ng'iroq qilish kerak", "Noto'g'ri raqam", "Adashib tushgan", "Aloqaga chiqib bo'lmadi"],
    2: ["Qiziqdi", "O'ylab ko'radi", "Ota-onasi bilan maslahatlashadi", "Keyinroq boshlaydi", "Boshqa markazni tanladi", "Mablag'i yetmaydi", "Vaqti yo'q", "Kerak emas", "Rad etdi"],
    3: ["Darsga taklif qilindi", "Kelish sanasi belgilandi", "Tasdiqladi", "Kelmadi", "Qayta chaqirish kerak"],
    4: ["Uchrashuvga keldi", "Sinov darsida qatnashdi", "Kurs tanladi", "Guruhga biriktirildi", "Hujjat topshirdi"],
    5: ["To'lov qildi", "Bo'lib-bo'lib to'laydi", "Va'da berdi", "To'lov muddati o'tdi", "To'lov qilmadi"],
    6: ["Darsga qatnayapti", "Davomati past", "Ogohlantirildi", "Ta'tilda", "Kursni tark etdi", "Kursni tugatdi"]
  },

  async render(container) {
    // Clear selection when rendering the page
    this.selectedLeadIds.clear();
    this.renderBulkActionsBar();

    let backButton = '';
    if (this.currentStageView !== 'all') {
      backButton = `<button class="btn btn-secondary" onclick="PipelinePage.changeView('all')" style="margin-right: 12px; padding: 10px 16px;">◀ Ortga</button>`;
    }

    container.innerHTML = `
      <div class="flex-between mb-4" style="flex-wrap: wrap; gap: 16px;">
        <div class="flex gap-3" style="align-items: center; flex-wrap: wrap;">
          <h2 id="pipeline-title" style="margin: 0;">Sotuv Pipeline</h2>
          <div class="flex" style="align-items: center; margin-left: 20px;">
            ${backButton}
            <select id="stage-view-select" class="form-control" style="width: 250px;" onchange="PipelinePage.changeView(this.value)">
              <option value="all">Barcha bosqichlar (Umumiy)</option>
              <option value="1">1. Yangi leadlar (Batafsil)</option>
              <option value="2">2. Gaplashilgan (Batafsil)</option>
              <option value="3">3. Rozi bo'lganlar (Batafsil)</option>
              <option value="4">4. Markazga kelganlar (Batafsil)</option>
              <option value="5">5. To'lov (Batafsil)</option>
              <option value="6">6. Faol o'quvchi (Batafsil)</option>
            </select>
          </div>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-primary" onclick="LeadModal.showAddModal()">+ Yangi Lid</button>
          <button class="btn btn-secondary" onclick="PipelinePage.loadData()">🔄 Yangilash</button>
        </div>
      </div>
      <div id="pipeline-board"></div>
    `;

    this.kanban = new Kanban('#pipeline-board', {
      columns: [],
      onCardMove: this.handleCardMove.bind(this),
      onCardClick: (id, event) => this.handleCardClick(id, event),
      onColumnClick: this.handleColumnClick.bind(this)
    });

    document.getElementById('stage-view-select').value = this.currentStageView;

    await this.loadData();
  },

  changeView(val) {
    this.currentStageView = val;
    this.render(document.getElementById('page-content'));
  },

  handleColumnClick(columnId) {
    const stageNum = parseInt(columnId);
    if (!isNaN(stageNum) && stageNum >= 1 && stageNum <= 6) {
      this.currentStageView = String(stageNum);
      this.render(document.getElementById('page-content'));
    }
  },

  async loadData() {
    try {
      const today = new Date().toISOString().split('T')[0];

      if (this.currentStageView === 'all') {
        const res = await API.get('/leads/pipeline');
        const data = res.data;
        const columns = [];

        for (let i = 1; i <= 6; i++) {
          const leads = data[i] || [];
          columns.push({
            id: i,
            title: this.stageTitles[i],
            color: this.stageColors[i],
            cards: leads.map(l => ({
              id: l.id,
              title: l.full_name,
              subtitle: window.formatPhone(l.phone),
              status: l.status,
              course: l.course_name || 'Kurs tanlanmagan',
              next_action: l.next_action,
              updated_at: l.updated_at,
              is_overdue: l.next_contact_date && l.next_contact_date < today,
              show_status: true
            }))
          });
        }
        this.kanban.updateData(columns);
      } else {
        const stageNum = parseInt(this.currentStageView);
        const res = await API.get(`/leads?stage=${stageNum}&limit=200`);
        const leads = res.data;
        const statuses = this.stageStatuses[stageNum];
        const color = this.stageColors[stageNum];
        
        const columns = statuses.map(status => {
          const statusLeads = leads.filter(l => l.status === status);
          return {
            id: status,
            title: status,
            color: color,
            cards: statusLeads.map(l => ({
              id: l.id,
              title: l.full_name,
              subtitle: window.formatPhone(l.phone),
              status: l.status,
              course: l.course_name || 'Kurs tanlanmagan',
              next_action: l.next_action,
              updated_at: l.updated_at,
              is_overdue: l.next_contact_date && l.next_contact_date < today,
              show_course: true
            }))
          };
        });
        this.kanban.updateData(columns);
      }
    } catch (error) {
      Toast.error("Kanban ma'lumotlarini yuklashda xatolik");
    }
  },

  handleCardMove(cardId, fromCol, toCol) {
    if (this.currentStageView === 'all') {
      const toStage = parseInt(toCol);
      const statuses = this.stageStatuses[toStage];
      let optionsHtml = statuses.map(s => `<option value="${s}">${s}</option>`).join('');

      Modal.show({
        title: "Bosqichni o'zgartirish",
        content: `
          <div class="form-group">
            <label>Yangi holat</label>
            <select id="move-status" class="form-control">${optionsHtml}</select>
          </div>
          <div class="form-group">
            <label>Izoh</label>
            <textarea id="move-comment" class="form-control" placeholder="Ixtiyoriy izoh..."></textarea>
          </div>
        `,
        footer: `
          <button class="btn btn-secondary" onclick="Modal.close(); PipelinePage.loadData()">Bekor qilish</button>
          <button class="btn btn-primary" onclick="PipelinePage.saveMove(${cardId}, ${toStage})">Saqlash</button>
        `
      });
    } else {
      const stage = parseInt(this.currentStageView);
      const status = toCol;
      this.saveStatusChange(cardId, stage, status);
    }
  },

  async saveStatusChange(cardId, stage, status) {
    try {
      await API.put(`/leads/${cardId}/stage`, { stage, status, comment: "Holat kanbada o'zgartirildi" });
      Toast.success("Holat yangilandi");
      this.loadData();
    } catch (error) {
      Toast.error(error.message);
      this.loadData();
    }
  },

  async saveMove(cardId, toStage) {
    const status = document.getElementById('move-status').value;
    const comment = document.getElementById('move-comment').value;

    try {
      await API.put(`/leads/${cardId}/stage`, { stage: toStage, status, comment });
      Toast.success("Bosqich o'zgartirildi");
      Modal.close();
      this.loadData();
    } catch (error) {
      Toast.error(error.message);
    }
  },

  handleCardClick(id, event) {
    if (event && (event.ctrlKey || event.metaKey)) {
      // Toggle selection
      const leadId = parseInt(id);
      const cardEl = document.querySelector(`.kanban-card[data-id="${id}"]`);
      if (this.selectedLeadIds.has(leadId)) {
        this.selectedLeadIds.delete(leadId);
        if (cardEl) cardEl.classList.remove('selected');
      } else {
        this.selectedLeadIds.add(leadId);
        if (cardEl) cardEl.classList.add('selected');
      }
      this.renderBulkActionsBar();
    } else {
      LeadModal.show(id);
    }
  },

  renderBulkActionsBar() {
    let bar = document.getElementById('pipeline-bulk-bar');
    if (this.selectedLeadIds.size === 0) {
      if (bar) bar.remove();
      return;
    }

    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'pipeline-bulk-bar';
      bar.style.position = 'fixed';
      bar.style.bottom = '24px';
      bar.style.left = '50%';
      bar.style.transform = 'translateX(-50%)';
      bar.style.background = 'var(--bg-secondary)';
      bar.style.border = '1.5px solid var(--primary)';
      bar.style.borderRadius = '12px';
      bar.style.padding = '12px 24px';
      bar.style.display = 'flex';
      bar.style.alignItems = 'center';
      bar.style.gap = '16px';
      bar.style.boxShadow = '0 10px 30px rgba(0,0,0,0.3)';
      bar.style.zIndex = '9999';
      bar.style.animation = 'slideIn 0.3s ease-out';
      document.body.appendChild(bar);
    }

    bar.innerHTML = `
      <span style="font-weight: 600; font-size: 14.5px; color: var(--text-primary);">
        🟢 ${this.selectedLeadIds.size} ta lead belgilandi
      </span>
      <button class="btn btn-primary" onclick="PipelinePage.showBulkMoveModal()" style="font-size: 13px; padding: 8px 16px;">
        Guruhli bosqichni o'zgartirish
      </button>
      <button class="btn btn-secondary" onclick="PipelinePage.clearSelection()" style="font-size: 13px; padding: 8px 16px;">
        Bekor qilish
      </button>
    `;
  },

  clearSelection() {
    this.selectedLeadIds.clear();
    document.querySelectorAll('.kanban-card.selected').forEach(c => c.classList.remove('selected'));
    this.renderBulkActionsBar();
  },

  showBulkMoveModal() {
    const firstStage = 1;
    const statuses = this.stageStatuses[firstStage];
    let stageOptions = '';
    for (let i = 1; i <= 6; i++) {
      stageOptions += `<option value="${i}">${this.stageTitles[i]}</option>`;
    }
    let statusOptions = statuses.map(s => `<option value="${s}">${s}</option>`).join('');

    Modal.show({
      title: "Guruhli bosqichni o'zgartirish",
      content: `
        <div class="form-group" style="margin-bottom: 16px;">
          <label>Yangi Bosqich</label>
          <select id="bulk-move-stage" class="form-control" onchange="PipelinePage.handleBulkStageChange(this.value)">
            ${stageOptions}
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 16px;">
          <label>Yangi holat</label>
          <select id="bulk-move-status" class="form-control">
            ${statusOptions}
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 16px;">
          <label>Izoh</label>
          <textarea id="bulk-move-comment" class="form-control" placeholder="Guruhli o'zgartirish uchun izoh..."></textarea>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="Modal.close()">Bekor qilish</button>
        <button class="btn btn-primary" onclick="PipelinePage.saveBulkMove()">Guruhli saqlash</button>
      `
    });
  },

  handleBulkStageChange(val) {
    const stage = parseInt(val);
    const statuses = this.stageStatuses[stage] || [];
    const select = document.getElementById('bulk-move-status');
    if (select) {
      select.innerHTML = statuses.map(s => `<option value="${s}">${s}</option>`).join('');
    }
  },

  async saveBulkMove() {
    const stage = parseInt(document.getElementById('bulk-move-stage').value);
    const status = document.getElementById('bulk-move-status').value;
    const comment = document.getElementById('bulk-move-comment').value;
    const leadIds = Array.from(this.selectedLeadIds);

    try {
      const res = await API.put('/leads/bulk/stage', { leadIds, stage, status, comment });
      Toast.success(res.data?.message || "Guruhli holat yangilandi");
      Modal.close();
      this.clearSelection();
      this.loadData();
    } catch (error) {
      Toast.error(error.message || "Xatolik yuz berdi");
    }
  }
};
