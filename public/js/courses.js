window.CoursesPage = {
  table: null,

  async render(container) {
    container.innerHTML = `
      <div class="flex-between mb-4">
        <h2>Kurslar Ro'yxati</h2>
        <button class="btn btn-primary" onclick="CoursesPage.showAddModal()">+ Yangi Kurs</button>
      </div>
      <div class="card">
        <div id="courses-table"></div>
      </div>
    `;

    this.table = new Table('#courses-table', {
      columns: [
        { key: 'name', label: 'Kurs Nomi' },
        { key: 'description', label: 'Ta\'rifi' },
        { key: 'price', label: 'Narxi', render: v => v ? `${v.toLocaleString('uz-UZ')} UZS` : '0 UZS' },
        { key: 'lead_count', label: 'Lidlar Soni', render: v => `<span class="badge" style="background:var(--bg-primary);color:var(--text-primary)">${v || 0} ta</span>` },
        { key: 'id', label: 'Amallar', render: (v, row) => `
          <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); CoursesPage.showEditModal(${JSON.stringify(row).replace(/"/g, '&quot;')})">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); CoursesPage.deleteCourse(${v})">🗑️</button>
        ` }
      ],
      emptyText: "Hozircha kurslar yo'q",
      onRowClick: null
    });

    await this.loadData();
  },

  async loadData() {
    try {
      const res = await API.get('/courses');
      this.table.updateData(res.data);
    } catch (error) {
      Toast.error("Kurslarni yuklashda xatolik");
    }
  },

  showAddModal() {
    Modal.show({
      title: "Yangi Kurs Qo'shish",
      content: `
        <div class="form-group"><label>Kurs Nomi</label><input type="text" id="c-name" class="form-control"></div>
        <div class="form-group"><label>Ta'rifi</label><textarea id="c-desc" class="form-control" style="min-height:80px"></textarea></div>
        <div class="form-group"><label>Narxi (UZS)</label><input type="number" id="c-price" class="form-control" placeholder="500000"></div>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="Modal.close()">Bekor qilish</button>
        <button class="btn btn-primary" onclick="CoursesPage.saveCourse()">Saqlash</button>
      `
    });
  },

  showEditModal(course) {
    Modal.show({
      title: "Kursni Tahrirlash",
      content: `
        <div class="form-group"><label>Kurs Nomi</label><input type="text" id="c-name" class="form-control" value="${course.name}"></div>
        <div class="form-group"><label>Ta'rifi</label><textarea id="c-desc" class="form-control" style="min-height:80px">${course.description || ''}</textarea></div>
        <div class="form-group"><label>Narxi (UZS)</label><input type="number" id="c-price" class="form-control" value="${course.price || ''}"></div>
      `,
      footer: `
        <button class="btn btn-secondary" onclick="Modal.close()">Bekor qilish</button>
        <button class="btn btn-primary" onclick="CoursesPage.saveCourse(${course.id})">Saqlash</button>
      `
    });
  },

  async saveCourse(id = null) {
    const name = document.getElementById('c-name').value;
    const description = document.getElementById('c-desc').value;
    const price = document.getElementById('c-price').value;

    if (!name) return Toast.error('Kurs nomi majburiy');

    try {
      if (id) {
        await API.put(`/courses/${id}`, { name, description, price: price ? parseFloat(price) : 0 });
        Toast.success("O'zgartirildi");
      } else {
        await API.post('/courses', { name, description, price: price ? parseFloat(price) : 0 });
        Toast.success("Qo'shildi");
      }
      Modal.close();
      this.loadData();
    } catch (err) {
      Toast.error(err.message);
    }
  },

  async deleteCourse(id) {
    if (confirm("Haqiqatan ham ushbu kursni o'chirmoqchimisiz?")) {
      try {
        await API.del(`/courses/${id}`);
        Toast.success("O'chirildi");
        this.loadData();
      } catch (err) {
        Toast.error(err.message);
      }
    }
  }
};
