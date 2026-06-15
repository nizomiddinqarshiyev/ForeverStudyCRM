// Calendar Module
window.CalendarPage = {
  currentDate: new Date(),
  leads: [],
  allLeads: [],

  async render(container) {
    container.innerHTML = `
      <div class="flex-between mb-4" style="flex-wrap: wrap; gap: 16px;">
        <div class="flex gap-3" style="align-items: center; flex-wrap: wrap;">
          <h2 id="calendar-month-title" style="margin: 0; font-family:'Outfit',sans-serif; font-size: 24px;">Kalendar</h2>
          <div class="flex gap-2" style="margin-left: 20px;">
            <button class="btn btn-secondary" onclick="CalendarPage.prevMonth()" style="padding: 8px 12px;">◀</button>
            <button class="btn btn-secondary" onclick="CalendarPage.today()" style="padding: 8px 16px; font-size: 13px;">Bugun</button>
            <button class="btn btn-secondary" onclick="CalendarPage.nextMonth()" style="padding: 8px 12px;">▶</button>
          </div>
        </div>
        <button class="btn btn-secondary" onclick="CalendarPage.loadData()">🔄 Yangilash</button>
      </div>
      
      <div class="card" style="padding: 20px; overflow-x: auto; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius);">
        <div class="calendar-grid-header" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; text-align: center; font-weight: 600; min-width: 800px; margin-bottom: 12px; color: var(--text-secondary); font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">
          <div>Dushanba</div>
          <div>Seshanba</div>
          <div>Chorshanba</div>
          <div>Payshanba</div>
          <div>Juma</div>
          <div>Shanba</div>
          <div>Yakshanba</div>
        </div>
        <div class="calendar-grid-cells" id="calendar-cells" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 10px; min-width: 800px; min-height: 550px;">
          <!-- Cells will be generated here -->
        </div>
      </div>
    `;

    await this.loadData();
  },

  async loadData() {
    try {
      const res = await API.get('/leads?limit=1000');
      this.allLeads = res.data || [];
      this.leads = this.allLeads.filter(l => l.next_contact_date);
      this.drawCalendar();
    } catch (e) {
      Toast.error("Kalendar ma'lumotlarini yuklashda xatolik");
    }
  },

  prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.drawCalendar();
  },

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.drawCalendar();
  },

  today() {
    this.currentDate = new Date();
    this.drawCalendar();
  },

  drawCalendar() {
    const cellsContainer = document.getElementById('calendar-cells');
    const title = document.getElementById('calendar-month-title');
    if (!cellsContainer || !title) return;

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const monthNames = [
      "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
      "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
    ];
    title.textContent = `${monthNames[month]} ${year}`;

    // Get first day of the month (0 = Sunday, 1 = Monday, etc.)
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Adjust for Monday starting index (0 = Monday, 6 = Sunday)
    const startDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    // Get total days in month
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Get total days in previous month
    const prevTotalDays = new Date(year, month, 0).getDate();

    cellsContainer.innerHTML = '';

    const todayStr = new Date().toISOString().split('T')[0];

    // Previous month's trailing days
    for (let i = startDay - 1; i >= 0; i--) {
      const dayNum = prevTotalDays - i;
      const cell = document.createElement('div');
      cell.style = 'background: rgba(255,255,255,0.01); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 12px; min-height: 100px; color: var(--text-muted); opacity: 0.3; pointer-events: none;';
      cell.innerHTML = `<div style="font-size:12px; font-weight:600; margin-bottom:4px;">${dayNum}</div>`;
      cellsContainer.appendChild(cell);
    }

    // Current month's days
    for (let day = 1; day <= totalDays; day++) {
      const cell = document.createElement('div');
      
      const currentMonthStr = String(month + 1).padStart(2, '0');
      const currentDayStr = String(day).padStart(2, '0');
      const cellDateStr = `${year}-${currentMonthStr}-${currentDayStr}`;

      const isToday = cellDateStr === todayStr;
      const todayStyle = isToday ? 'border: 2px solid var(--primary); background: rgba(108, 92, 231, 0.04);' : 'background: rgba(255,255,255,0.02); border: 1px solid var(--border);';
      
      cell.style = `border-radius: var(--radius-sm); padding: 10px; min-height: 100px; display: flex; flex-direction: column; transition: var(--transition); cursor: pointer; ${todayStyle}`;
      cell.onclick = () => CalendarPage.showDayModal(cellDateStr);
      cell.onmouseover = () => { cell.style.borderColor = 'var(--primary-light)'; };
      cell.onmouseout = () => { cell.style.borderColor = isToday ? 'var(--primary)' : 'var(--border)'; };

      let dayHtml = `
        <div style="font-size:12px; font-weight:700; margin-bottom:8px; display:flex; justify-content:space-between; align-items:center;">
          <span style="${isToday ? 'background:var(--primary); color:white; border-radius:50%; width:22px; height:22px; display:inline-flex; align-items:center; justify-content:center;' : ''}">${day}</span>
        </div>
      `;

      // Find leads for this date
      const dayLeads = this.leads.filter(l => l.next_contact_date === cellDateStr);
      let tasksHtml = '<div style="flex:1; display:flex; flex-direction:column; gap:6px; overflow-y:auto; max-height: 80px;">';
      
      dayLeads.forEach(l => {
        const stageColors = {
          1: '#74b9ff', 2: '#ffa502', 3: '#a855f7', 4: '#00cec9', 5: '#00d4aa', 6: '#6c5ce7'
        };
        const color = stageColors[l.stage] || 'var(--primary)';
        const taskText = l.next_action || 'Qo\'ng\'iroq qilish';
        
        tasksHtml += `
          <div onclick="event.stopPropagation(); LeadModal.show(${l.id})" title="${l.full_name}: ${taskText}" style="font-size:10px; padding:4px 8px; background:${color}15; color:${color}; border-left:3.5px solid ${color}; border-radius:3px; cursor:pointer; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:600; transition:var(--transition); line-height:1.2;" onmouseover="this.style.background='${color}25'" onmouseout="this.style.background='${color}15'">
            ${l.full_name.split(' ')[0]}: ${taskText}
          </div>
        `;
      });
      tasksHtml += '</div>';

      cell.innerHTML = dayHtml + tasksHtml;
      cellsContainer.appendChild(cell);
    }
  },

  showDayModal(dateStr) {
    const dayLeads = this.leads.filter(l => l.next_contact_date === dateStr);
    
    let tasksHtml = '';
    if (dayLeads.length > 0) {
      tasksHtml = '<div style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px; max-height:220px; overflow-y:auto; padding-right:4px;">';
      dayLeads.forEach(l => {
        tasksHtml += `
          <div class="flex-between" style="padding:12px; background:var(--bg-primary); border:1px solid var(--border); border-radius:var(--radius-sm);">
            <div>
              <strong style="font-size:13px; color:var(--text-primary);">${l.full_name}</strong>
              <div style="font-size:11px; color:var(--text-secondary); margin-top:2px;">📞 ${l.phone}</div>
              <div style="font-size:11px; color:var(--warning); margin-top:4px; font-style:italic;">Topshiriq: ${l.next_action || 'Qo\'ng\'iroq qilish'}</div>
            </div>
            <button class="btn btn-secondary" style="padding:6px 12px; font-size:12px;" onclick="Modal.close(); LeadModal.show(${l.id})">Boshqarish</button>
          </div>
        `;
      });
      tasksHtml += '</div>';
    } else {
      tasksHtml = `<div style="padding:20px; text-align:center; color:var(--text-secondary); margin-bottom:20px; font-size:13px;">Ushbu kunda hech qanday topshiriqlar rejalashtirilmagan.</div>`;
    }

    let optionsHtml = '<option value="">Mijozni tanlang...</option>';
    this.allLeads.forEach(l => {
      optionsHtml += `<option value="${l.id}">${l.full_name} (${l.phone})</option>`;
    });

    Modal.show({
      title: `📅 ${dateStr} topshiriqlari`,
      content: `
        <h4 style="margin-bottom:12px; font-size:14px; color:var(--text-primary);">Belgilangan topshiriqlar</h4>
        ${tasksHtml}
        
        <hr style="border:0; border-top:1px solid var(--border); margin:20px 0;">
        
        <h4 style="margin-bottom:12px; font-size:14px; color:var(--text-primary);">Yangi topshiriq qo'shish</h4>
        <form id="calendar-add-task-form" onsubmit="CalendarPage.saveNewTask(event, '${dateStr}')">
          <div class="form-group">
            <label>Mijoz (Lid)</label>
            <select id="calendar-task-lead-id" class="form-control" required style="width: 100%;">
              ${optionsHtml}
            </select>
          </div>
          <div class="form-group">
            <label>Topshiriq tavsifi</label>
            <input type="text" id="calendar-task-action" class="form-control" placeholder="Masalan: Qayta qo'ng'iroq qilish, suhbatlashish" required>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%; padding:12px;">Vazifani rejalashtirish</button>
        </form>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="Modal.close()">Yopish</button>
      `
    });
  },

  async saveNewTask(e, dateStr) {
    e.preventDefault();
    const leadId = document.getElementById('calendar-task-lead-id').value;
    const next_action = document.getElementById('calendar-task-action').value;

    if (!leadId) {
      Toast.error("Lidni tanlang");
      return;
    }

    try {
      await API.put(`/leads/${leadId}`, {
        next_contact_date: dateStr,
        next_action: next_action
      });
      Toast.success("Vazifa muvaffaqiyatli rejalashtirildi");
      Modal.close();
      await this.loadData();
    } catch (err) {
      Toast.error(err.message || "Vazifani saqlashda xatolik");
    }
  }
};
