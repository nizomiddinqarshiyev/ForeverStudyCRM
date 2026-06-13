window.LeadModal = {
  currentLeadId: null,

  stageTitles: {
    1: "1. Yangi leadlar",
    2: "2. Gaplashilgan",
    3: "3. Rozi bo'lganlar",
    4: "4. Markazga kelganlar",
    5: "5. To'lov",
    6: "6. Faol o'quvchi"
  },

  stageStatuses: {
    1: ["Yangi lead", "Qo'ng'iroq qilindi", "Gaplashildi", "Ko'tarmadi", "Band edi", "Qayta qo'ng'iroq qilish kerak", "Noto'g'ri raqam", "Adashib tushgan", "Aloqaga chiqib bo'lmadi"],
    2: ["Qiziqdi", "O'ylab ko'radi", "Ota-onasi bilan maslahatlashadi", "Keyinroq boshlaydi", "Boshqa markazni tanladi", "Mablag'i yetmaydi", "Vaqti yo'q", "Kerak emas", "Rad etdi"],
    3: ["Darsga taklif qilindi", "Kelish sanasi belgilandi", "Tasdiqladi", "Kelmadi", "Qayta chaqirish kerak"],
    4: ["Uchrashuvga keldi", "Sinov darsida qatnashdi", "Kurs tanladi", "Guruhga biriktirildi", "Hujjat topshirdi"],
    5: ["To'lov qildi", "Bo'lib-bo'lib to'laydi", "Va'da berdi", "To'lov muddati o'tdi", "To'lov qilmadi"],
    6: ["Darsga qatnayapti", "Davomati past", "Ogohlantirildi", "Ta'tilda", "Kursni tark etdi", "Kursni tugatdi"]
  },

  updateStatusDropdown(stageId, selectedStatus = '') {
    const statuses = this.stageStatuses[stageId] || [];
    const select = document.getElementById('lm-status');
    if (!select) return;
    select.innerHTML = statuses.map(s => `<option value="${s}">${s}</option>`).join('');
    if (selectedStatus && statuses.includes(selectedStatus)) {
      select.value = selectedStatus;
    }
  },

  async show(leadId) {
    this.currentLeadId = leadId;
    try {
      const [leadRes, historyRes, coursesRes, usersRes] = await Promise.all([
        API.get(`/leads/${leadId}`),
        API.get(`/leads/${leadId}/history`),
        API.get('/courses'),
        API.get('/users')
      ]);
      const lead = leadRes.data;
      const history = historyRes.data;
      const courses = coursesRes.data;
      const managers = usersRes.data;

      const stageColors = { 1: 'stage-1', 2: 'stage-2', 3: 'stage-3', 4: 'stage-4', 5: 'stage-5', 6: 'stage-6' };

      // History activity feed
      let historyHtml = '<div class="activity-feed" style="margin-top:20px;max-height:300px;overflow-y:auto">';
      history.forEach(h => {
        let act = '';
        if (h.action_type === 'status_change') {
          act = `<b>${h.user_name}</b> holatni o'zgartirdi: <span class="badge" style="background:rgba(255,255,255,0.1)">${h.new_status}</span>`;
        } else if (h.action_type === 'call') {
          act = `<b>${h.user_name}</b> qo'ng'iroq qildi.`;
        } else if (h.action_type === 'payment') {
          act = `<b style="color:var(--success)">To'lov:</b> ${h.comment}`;
        } else {
          act = `<b>${h.user_name}</b> izoh qoldirdi.`;
        }
        
        historyHtml += `
          <div style="padding:12px;border-left:2px solid var(--border);margin-bottom:8px;background:var(--bg-primary);border-radius:0 var(--radius-sm) var(--radius-sm) 0">
            <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px">${new Date(h.created_at).toLocaleString('uz-UZ')}</div>
            <div style="font-size:14px">${act}</div>
            ${h.comment && h.action_type !== 'payment' ? `<div style="margin-top:6px;font-size:13px;color:var(--text-secondary);font-style:italic">"${h.comment}"</div>` : ''}
          </div>
        `;
      });
      historyHtml += '</div>';

      // Dropdown Options
      let coursesHtml = '<option value="">Kurs tanlanmagan</option>';
      courses.forEach(c => {
        coursesHtml += `<option value="${c.id}" ${lead.course_id == c.id ? 'selected' : ''}>${c.name}</option>`;
      });

      let managersHtml = '<option value="">Menejer tanlanmagan</option>';
      managers.forEach(m => {
        managersHtml += `<option value="${m.id}" ${lead.manager_id == m.id ? 'selected' : ''}>${m.full_name}</option>`;
      });

      const sources = ['instagram', 'telegram', 'youtube', 'referral', 'website', 'other'];
      let sourcesHtml = '';
      sources.forEach(s => {
        sourcesHtml += `<option value="${s}" ${lead.source === s ? 'selected' : ''}>${s.toUpperCase()}</option>`;
      });

      let stagesHtml = '';
      for (let i = 1; i <= 6; i++) {
        stagesHtml += `<option value="${i}" ${lead.stage == i ? 'selected' : ''}>${this.stageTitles[i]}</option>`;
      }

      const content = `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px">
          <div>
            <h2 style="margin:0 0 8px 0">${lead.full_name}</h2>
            <div class="flex gap-2">
              <span class="badge badge-${stageColors[lead.stage]}">Bosqich ${lead.stage}</span>
              <span class="badge" style="background:var(--bg-secondary)">${lead.status}</span>
            </div>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-primary btn-sm" onclick="LeadModal.logAction('call')">📞 Qo'ng'iroq</button>
            <button class="btn btn-secondary btn-sm" onclick="LeadModal.logAction('note')">📝 Izoh</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;background:var(--bg-primary);padding:20px;border-radius:var(--radius)">
          <div><div class="text-muted" style="font-size:12px">Telefon</div><div style="font-weight:500"><a href="tel:${lead.phone}" style="color:var(--primary);text-decoration:none">${lead.phone}</a></div></div>
          <div><div class="text-muted" style="font-size:12px">Telegram</div><div style="font-weight:500">${lead.telegram || '-'}</div></div>
          <div><div class="text-muted" style="font-size:12px">Manba</div><div style="font-weight:500;text-transform:capitalize">${lead.source}</div></div>
          <div><div class="text-muted" style="font-size:12px">Kurs</div><div style="font-weight:500">${lead.course_name || '-'}</div></div>
          <div><div class="text-muted" style="font-size:12px">Yoshi</div><div style="font-weight:500">${lead.age || '-'}</div></div>
          <div><div class="text-muted" style="font-size:12px">Kim uchun</div><div style="font-weight:500">${lead.inquiry_for || '-'}</div></div>
          <div><div class="text-muted" style="font-size:12px">Manzili</div><div style="font-weight:500">${lead.address || '-'}</div></div>
          <div><div class="text-muted" style="font-size:12px">Menejer</div><div style="font-weight:500">${lead.manager_name || '-'}</div></div>
          <div style="grid-column: span 2"><div class="text-muted" style="font-size:12px">Oxirgi aloqa</div><div style="font-weight:500">${lead.last_contact_date ? new Date(lead.last_contact_date).toLocaleString('uz-UZ') : '-'}</div></div>
        </div>

        <div style="border-top:1px solid var(--border);padding-top:20px;margin-bottom:20px">
          <h4 style="margin-bottom:16px">Ma'lumotlarni tahrirlash</h4>
          
          <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
            <div class="form-group">
              <label>F.I.Sh</label>
              <input type="text" id="lm-name" class="form-control" value="${lead.full_name}">
            </div>
            <div class="form-group">
              <label>Telefon raqami</label>
              <input type="text" id="lm-phone" class="form-control" value="${lead.phone}">
            </div>
          </div>

          <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
            <div class="form-group">
              <label>Telegram</label>
              <input type="text" id="lm-telegram" class="form-control" value="${lead.telegram || ''}">
            </div>
            <div class="form-group">
              <label>Manba</label>
              <select id="lm-source" class="form-control">
                ${sourcesHtml}
              </select>
            </div>
          </div>

          <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
            <div class="form-group">
              <label>Kurs</label>
              <select id="lm-course" class="form-control">
                ${coursesHtml}
              </select>
            </div>
            <div class="form-group">
              <label>Mas'ul menejer</label>
              <select id="lm-manager" class="form-control">
                ${managersHtml}
              </select>
            </div>
          </div>

          <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
            <div class="form-group">
              <label>Bosqich</label>
              <select id="lm-stage" class="form-control" onchange="LeadModal.updateStatusDropdown(this.value)">
                ${stagesHtml}
              </select>
            </div>
            <div class="form-group">
              <label>Holati</label>
              <select id="lm-status" class="form-control">
              </select>
            </div>
          </div>

          <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-bottom:16px">
            <div class="form-group">
              <label>Yoshi</label>
              <input type="number" id="lm-age" class="form-control" value="${lead.age || ''}">
            </div>
            <div class="form-group">
              <label>Kim uchun</label>
              <input type="text" id="lm-inquiry-for" class="form-control" value="${lead.inquiry_for || ''}">
            </div>
            <div class="form-group">
              <label>Manzili</label>
              <input type="text" id="lm-address" class="form-control" value="${lead.address || ''}">
            </div>
          </div>

          <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
            <div class="form-group">
              <label>Keyingi harakat</label>
              <input type="text" id="lm-next-action" class="form-control" value="${lead.next_action || ''}">
            </div>
            <div class="form-group">
              <label>Keyingi aloqa sanasi</label>
              <input type="date" id="lm-next-date" class="form-control" value="${lead.next_contact_date || ''}">
            </div>
          </div>

          <div class="form-group">
            <label>Izoh</label>
            <textarea id="lm-notes" class="form-control" style="min-height:60px">${lead.notes || ''}</textarea>
          </div>
          <div class="flex" style="justify-content:flex-end">
            <button class="btn btn-primary" onclick="LeadModal.saveDetails()">Saqlash</button>
          </div>
        </div>

        <div style="border-top:1px solid var(--border);padding-top:20px">
          <h4 style="margin-bottom:16px">Harakatlar Tarixi</h4>
          ${historyHtml}
        </div>
      `;

      Modal.show({
        title: 'Lead Profili',
        size: 'lg',
        content,
        footer: `
          <button class="btn btn-danger" onclick="LeadModal.deleteLead()">O'chirish</button>
          <button class="btn btn-secondary" onclick="Modal.close()">Yopish</button>
        `
      });

      this.updateStatusDropdown(lead.stage, lead.status);

    } catch (error) {
      console.error(error);
      Toast.error("Lead ma'lumotlarini yuklashda xatolik");
    }
  },

  async saveDetails() {
    const full_name = document.getElementById('lm-name').value;
    const phone = document.getElementById('lm-phone').value;
    const telegram = document.getElementById('lm-telegram').value;
    const source = document.getElementById('lm-source').value;
    const course_id = document.getElementById('lm-course').value || null;
    const manager_id = document.getElementById('lm-manager').value || null;
    const stage = document.getElementById('lm-stage').value;
    const status = document.getElementById('lm-status').value;
    const next_action = document.getElementById('lm-next-action').value;
    const next_contact_date = document.getElementById('lm-next-date').value;
    const age = document.getElementById('lm-age').value;
    const inquiry_for = document.getElementById('lm-inquiry-for').value;
    const address = document.getElementById('lm-address').value;
    const notes = document.getElementById('lm-notes').value;

    if (!full_name || !phone) {
      return Toast.error('F.I.Sh va Telefon raqami majburiy');
    }

    try {
      await API.put(`/leads/${this.currentLeadId}`, {
        full_name,
        phone,
        telegram,
        source,
        course_id,
        manager_id,
        stage,
        status,
        next_action,
        next_contact_date,
        notes,
        age,
        inquiry_for,
        address
      });
      Toast.success('Saqlandi');
      this.show(this.currentLeadId);
      if (window.DashboardPage && location.hash === '#dashboard') DashboardPage.loadData();
      if (window.PipelinePage && location.hash === '#pipeline') PipelinePage.loadData();
      if (window.LeadsPage && location.hash === '#leads') LeadsPage.loadLeads();
    } catch (error) {
      Toast.error(error.message);
    }
  },

  async logAction(type) {
    const actionName = type === 'call' ? "Qo'ng'iroq" : "Izoh";
    const comment = prompt(`${actionName} uchun izoh kiriting:`);
    if (comment === null) return;

    try {
      await API.post(`/leads/${this.currentLeadId}/action`, { action_type: type, comment });
      Toast.success("Qo'shildi");
      this.show(this.currentLeadId);
    } catch (error) {
      Toast.error(error.message);
    }
  },

  deleteLead() {
    if (confirm("Haqiqatan ham bu leadni o'chirmoqchimisiz? Barcha tarix o'chib ketadi.")) {
      API.del(`/leads/${this.currentLeadId}`).then(() => {
        Toast.success("O'chirildi");
        Modal.close();
        if (location.hash === '#pipeline') PipelinePage.loadData();
        if (location.hash === '#leads') LeadsPage.loadLeads();
      }).catch(err => Toast.error(err.message));
    }
  },

  showAddModal() {
    Modal.show({
      title: "Yangi Lead Qo'shish",
      content: `
        <div class="form-group"><label>Ismi</label><input type="text" id="add-name" class="form-control" placeholder="F.I.Sh"></div>
        <div class="form-group"><label>Telefon raqami</label><input type="text" id="add-phone" class="form-control" value="+998"></div>
        <div class="form-group"><label>Yoshi</label><input type="number" id="add-age" class="form-control" placeholder="Yoshi"></div>
        <div class="form-group"><label>Bu kursni kim uchun so'rayotganligi</label><input type="text" id="add-inquiry-for" class="form-control" placeholder="O'zi uchun, farzandi uchun va hk."></div>
        <div class="form-group"><label>Manzili</label><input type="text" id="add-address" class="form-control" placeholder="Manzil"></div>
        <div class="form-group"><label>Manba</label>
          <select id="add-source" class="form-control">
            <option value="instagram">Instagram</option>
            <option value="telegram">Telegram</option>
            <option value="referral">Tavsiya</option>
            <option value="website">Sayt</option>
            <option value="other">Boshqa</option>
          </select>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="Modal.close()">Bekor qilish</button>
        <button class="btn btn-primary" onclick="LeadModal.saveNewLead()">Qo'shish</button>
      `
    });
  },

  async saveNewLead() {
    const full_name = document.getElementById('add-name').value;
    const phone = document.getElementById('add-phone').value;
    const age = document.getElementById('add-age').value;
    const inquiry_for = document.getElementById('add-inquiry-for').value;
    const address = document.getElementById('add-address').value;
    const source = document.getElementById('add-source').value;

    if (!full_name || !phone) return Toast.error('Ism va telefon kerak');

    try {
      await API.post('/leads', { full_name, phone, age, inquiry_for, address, source });
      Toast.success("Qo'shildi");
      Modal.close();
      if (location.hash === '#pipeline') PipelinePage.loadData();
      if (location.hash === '#leads') LeadsPage.loadLeads();
    } catch (err) {
      Toast.error(err.message);
    }
  }
};
