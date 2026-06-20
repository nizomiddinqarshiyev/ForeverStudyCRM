window.LeadsPage = {
  currentFilters: { page: 1, limit: 10 },
  stageColors: { 1: 'stage-1', 2: 'stage-2', 3: 'stage-3', 4: 'stage-4', 5: 'stage-5', 6: 'stage-6' },

  async render(container) {
    container.innerHTML = `
      <div class="flex-between mb-4" style="flex-wrap: wrap; gap: 16px;">
        <h2>Lidlar Ro'yxati</h2>
        <div class="flex gap-2" style="flex-wrap: wrap;">
          <button class="btn btn-secondary" onclick="LeadsPage.triggerImport()">📥 Import (Excel)</button>
          <button class="btn btn-secondary" onclick="LeadsPage.exportToExcel()">📤 Export (Excel)</button>
          <button class="btn btn-primary" onclick="LeadModal.showAddModal()">+ Yangi Lead</button>
          <input type="file" id="excel-import-file" accept=".xlsx, .xls, .csv" style="display:none;" onchange="LeadsPage.handleImport(event)">
        </div>
      </div>

      <div class="filters-bar" id="leads-filters">
        <div class="filter-group">
          <input type="text" id="filter-search" class="form-control" placeholder="Ism yoki telefon...">
        </div>
        <div class="filter-group">
          <select id="filter-stage" class="form-control">
            <option value="">Barcha bosqichlar</option>
            <option value="1">1. Yangi leadlar</option>
            <option value="2">2. Gaplashilgan</option>
            <option value="3">3. Rozi bo'lganlar</option>
            <option value="4">4. Markazga kelganlar</option>
            <option value="5">5. To'lov</option>
            <option value="6">6. Faol o'quvchi</option>
          </select>
        </div>
        <div class="filter-group">
          <select id="filter-course" class="form-control"><option value="">Barcha kurslar</option></select>
        </div>
        <div class="filter-group flex gap-2">
          <button class="btn btn-secondary" onclick="LeadsPage.setFilter('follow_up_today', true)">Bugun ⚠️</button>
          <button class="btn btn-secondary" onclick="LeadsPage.setFilter('follow_up_overdue', true)">Kechikkan 🔴</button>
          <button class="btn btn-secondary" onclick="LeadsPage.resetFilters()">Tozalash</button>
        </div>
      </div>

      <div class="card">
        <div id="leads-table"></div>
      </div>
    `;

    this.table = new Table('#leads-table', {
      columns: [
        { key: 'full_name', label: 'Ism' },
        { key: 'phone', label: 'Telefon', render: v => window.formatPhone(v) },
        { key: 'course_name', label: 'Kurs', render: v => v ? `<span class="badge" style="background:var(--bg-secondary)">${v}</span>` : '-' },
        { key: 'stage', label: 'Bosqich', render: v => `<span class="badge badge-${this.stageColors[v]}">Bosqich ${v}</span>` },
        { key: 'status', label: 'Holat' },
        { key: 'manager_name', label: 'Menejer' },
        { key: 'next_contact_date', label: 'Keyingi aloqa', render: (v, row) => {
          if (!v) return '-';
          let color = 'var(--text-secondary)';
          const today = new Date().toISOString().split('T')[0];
          if (v < today) color = 'var(--danger)';
          else if (v === today) color = 'var(--warning)';
          return `<span style="color:${color};font-weight:500">${v}</span>`;
        }}
      ],
      onRowClick: (row) => LeadModal.show(row.id),
      onPageChange: (page) => {
        this.currentFilters.page = page;
        this.loadLeads();
      }
    });

    // Setup filters
    document.getElementById('filter-search').addEventListener('input', this.debounce(() => {
      this.currentFilters.search = document.getElementById('filter-search').value;
      this.currentFilters.page = 1;
      this.loadLeads();
    }, 500));

    document.getElementById('filter-stage').addEventListener('change', (e) => {
      this.currentFilters.stage = e.target.value;
      this.currentFilters.page = 1;
      this.loadLeads();
    });

    // Load filter options
    this.loadFilterOptions();
    
    // Load data
    this.loadLeads();
  },

  async loadFilterOptions() {
    try {
      const res = await API.get('/courses');
      const select = document.getElementById('filter-course');
      res.data.forEach(c => {
        select.innerHTML += `<option value="${c.id}">${c.name}</option>`;
      });
      select.addEventListener('change', (e) => {
        this.currentFilters.course_id = e.target.value;
        this.currentFilters.page = 1;
        this.loadLeads();
      });
    } catch(e) {}
  },

  setFilter(key, value) {
    if(key === 'follow_up_today') {
      this.currentFilters.follow_up_today = true;
      delete this.currentFilters.follow_up_overdue;
    }
    if(key === 'follow_up_overdue') {
      this.currentFilters.follow_up_overdue = true;
      delete this.currentFilters.follow_up_today;
    }
    this.currentFilters.page = 1;
    this.loadLeads();
  },

  resetFilters() {
    this.currentFilters = { page: 1, limit: 10 };
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-stage').value = '';
    document.getElementById('filter-course').value = '';
    this.loadLeads();
  },

  async loadLeads() {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(this.currentFilters).forEach(([k, v]) => {
        if(v) queryParams.append(k, v);
      });
      
      const res = await API.get(`/leads?${queryParams.toString()}`);
      this.table.updateData(res.data, res.pagination);
    } catch (error) {
      Toast.error('Leadlarni yuklashda xatolik');
    }
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => { clearTimeout(timeout); func(...args); };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  triggerImport() {
    document.getElementById('excel-import-file').click();
  },

  async handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
          Toast.error("Excel faylda ma'lumotlar topilmadi");
          return;
        }

        // Map column headers intelligently
        const mappedLeads = json.map(row => {
          const findKey = (keys) => {
            const match = Object.keys(row).find(k => keys.includes(k.toLowerCase().trim()));
            return match ? row[match] : null;
          };

          return {
            full_name: findKey(['ism', 'f.i.sh', 'fish', 'name', 'full name', 'full_name']),
            phone: findKey(['telefon', 'tel', 'phone', 'phone number', 'phone_number']),
            telegram: findKey(['telegram', 'tg', 'user']),
            source: findKey(['manba', 'source']),
            age: findKey(['yoshi', 'yosh', 'age']),
            inquiry_for: findKey(['kim uchun', 'inquiry', 'inquiry_for']),
            address: findKey(['manzil', 'manzili', 'address']),
            notes: findKey(['izoh', 'notes', 'note', 'comment'])
          };
        });

        // Send to backend bulk endpoint
        const res = await API.post('/leads/bulk', mappedLeads);
        Toast.success(res.message || "Import yakunlandi");
        this.loadLeads();
      } catch (err) {
        console.error(err);
        Toast.error("Faylni o'qishda yoki import qilishda xatolik yuz berdi");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; // Reset file input
  },

  async exportToExcel() {
    try {
      const res = await API.get('/leads?limit=10000');
      const leads = res.data || [];

      if (leads.length === 0) {
        Toast.error("Eksport qilish uchun lidlar mavjud emas");
        return;
      }

      const exportData = leads.map(l => ({
        "Ism (F.I.Sh)": l.full_name,
        "Telefon": window.formatPhone(l.phone),
        "Telegram": l.telegram || '',
        "Manba": l.source || '',
        "Kurs": l.course_name || '',
        "Bosqich": `Bosqich ${l.stage}`,
        "Holat": l.status || '',
        "Menejer": l.manager_name || '',
        "Yoshi": l.age || '',
        "Kim uchun": l.inquiry_for || '',
        "Manzili": l.address || '',
        "Izoh": l.notes || '',
        "Yaratilgan sana": l.created_at ? new Date(l.created_at).toLocaleDateString('uz-UZ') : ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Lidlar");

      // Set nice column widths automatically
      const maxLens = {};
      exportData.forEach(row => {
        Object.keys(row).forEach(key => {
          const val = String(row[key] || '');
          maxLens[key] = Math.max(maxLens[key] || 10, val.length, key.length);
        });
      });
      worksheet['!cols'] = Object.keys(maxLens).map(key => ({ wch: maxLens[key] + 2 }));

      XLSX.writeFile(workbook, "ForeverStudy_Lidlar.xlsx");
      Toast.success("Muvaffaqiyatli yuklab olindi");
    } catch (err) {
      console.error(err);
      Toast.error("Eksport qilishda xatolik yuz berdi");
    }
  }
};
