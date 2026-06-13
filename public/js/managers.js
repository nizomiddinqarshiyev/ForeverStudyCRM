window.ManagersPage = {
  table: null,

  async render(container) {
    const isAdmin = App.user && App.user.role === 'admin';
    container.innerHTML = `
      <div class="flex-between mb-4">
        <h2>Menejerlar va Foydalanuvchilar</h2>
        ${isAdmin ? `<button class="btn btn-primary" onclick="ManagersPage.showAddModal()">+ Yangi Menejer</button>` : ''}
      </div>
      <div class="card">
        <div id="managers-table"></div>
      </div>
    `;

    const columns = [
      { key: 'full_name', label: 'F.I.Sh' },
      { key: 'username', label: 'Login' },
      { key: 'role', label: 'Roli', render: v => v === 'admin' ? '<span class="badge" style="background:var(--danger)">Admin</span>' : '<span class="badge" style="background:var(--primary)">Menejer</span>' },
      { key: 'total_leads', label: 'Biriktirilgan Lidlar', render: v => `${v || 0} ta` },
      { key: 'won_leads', label: 'Sotuvlar Soni', render: v => `${v || 0} ta` },
      { key: 'conversion_rate', label: 'Konversiya', render: v => `<b style="color:var(--success)">${v || 0}%</b>` }
    ];

    if (isAdmin) {
      columns.push({
        key: 'id',
        label: 'Amallar',
        render: (v, row) => `
          <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); ManagersPage.showEditModal(${JSON.stringify(row).replace(/"/g, '&quot;')})">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); ManagersPage.deleteManager(${v})">🗑️</button>
        `
      });
    }

    this.table = new Table('#managers-table', {
      columns,
      emptyText: "Hozircha menejerlar yo'q",
      onRowClick: null
    });

    await this.loadData();
  },

  async loadData() {
    try {
      const res = await API.get('/users');
      this.table.updateData(res.data);
    } catch (error) {
      Toast.error("Menejerlarni yuklashda xatolik");
    }
  },

  showAddModal() {
    Modal.show({
      title: "Yangi Menejer Qo'shish",
      content: `
        <div class="form-group"><label>To'liq ism (F.I.Sh)</label><input type="text" id="m-name" class="form-control"></div>
        <div class="form-group"><label>Login</label><input type="text" id="m-user" class="form-control" placeholder="Aziza123"></div>
        <div class="form-group"><label>Parol</label><input type="password" id="m-pass" class="form-control"></div>
        <div class="form-group"><label>Roli</label>
          <select id="m-role" class="form-control">
            <option value="manager">Menejer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="Modal.close()">Bekor qilish</button>
        <button class="btn btn-primary" onclick="ManagersPage.saveManager()">Saqlash</button>
      `
    });
  },

  showEditModal(manager) {
    Modal.show({
      title: "Menejer Ma'lumotlarini Tahrirlash",
      content: `
        <div class="form-group"><label>To'liq ism (F.I.Sh)</label><input type="text" id="m-name" class="form-control" value="${manager.full_name}"></div>
        <div class="form-group"><label>Roli</label>
          <select id="m-role" class="form-control">
            <option value="manager" ${manager.role === 'manager' ? 'selected' : ''}>Menejer</option>
            <option value="admin" ${manager.role === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
        </div>
        <div class="form-group"><label>Yangi Parol (ixtiyoriy)</label><input type="password" id="m-pass" class="form-control" placeholder="O'zgartirmaslik uchun bo'sh qoldiring"></div>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="Modal.close()">Bekor qilish</button>
        <button class="btn btn-primary" onclick="ManagersPage.saveManager(${manager.id})">Saqlash</button>
      `
    });
  },

  async saveManager(id = null) {
    const full_name = document.getElementById('m-name').value;
    const role = document.getElementById('m-role').value;
    const password = document.getElementById('m-pass').value;
    
    let username = '';
    if (!id) {
      username = document.getElementById('m-user').value;
      if (!username || !password || !full_name) {
        return Toast.error("Barcha maydonlar to'ldirilishi shart");
      }
    } else {
      if (!full_name) return Toast.error("Ism bo'sh bo'lishi mumkin emas");
    }

    try {
      if (id) {
        await API.put(`/users/${id}`, { full_name, role, password });
        Toast.success("O'zgartirildi");
      } else {
        await API.post('/users', { username, password, full_name, role });
        Toast.success("Qo'shildi");
      }
      Modal.close();
      this.loadData();
    } catch (err) {
      Toast.error(err.message);
    }
  },

  async deleteManager(id) {
    if (confirm("Haqiqatan ham ushbu menejerni bloklamoqchimisiz?")) {
      try {
        await API.del(`/users/${id}`);
        Toast.success("Bloklandi");
        this.loadData();
      } catch (err) {
        Toast.error(err.message);
      }
    }
  }
};
