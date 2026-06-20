window.Kanban = class {
  constructor(container, options) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.options = Object.assign({
      columns: [],
      onCardMove: null,
      onCardClick: null,
      onColumnClick: null
    }, options);
    this.render();
  }

  updateData(columns) {
    this.options.columns = columns;
    this.render();
  }

  render() {
    const getStatusClassificationColor = (status) => {
      const positive = [
        "Yangi lead", "Yangi", "Qiziqdi", "Darsga taklif qilindi", "Kelish sanasi belgilandi", 
        "Tasdiqladi", "Uchrashuvga keldi", "Sinov darsida qatnashdi", "Kurs tanladi", 
        "Guruhga biriktirildi", "Hujjat topshirdi", "To'lov qildi", "Bo'lib-bo'lib to'laydi", 
        "Darsga qatnayapti", "Kursni tugatdi"
      ];
      const negative = [
        "Ko'tarmadi", "Noto'g'ri raqam", "Adashib tushgan", "Aloqaga chiqib bo'lmadi", 
        "Boshqa markazni tanladi", "Mablag'i yetmaydi", "Vaqti yo'q", "Kerak emas", 
        "Rad etdi", "Kelmadi", "To'lov muddati o'tdi", "To'lov qilmadi", "Kursni tark etdi"
      ];
      
      if (positive.includes(status)) {
        return '#2ed573'; // Green
      } else if (negative.includes(status)) {
        return '#ff4757'; // Red
      } else {
        return '#ffa502'; // Yellow/Orange
      }
    };

    let html = '<div class="kanban-board">';
    
    this.options.columns.forEach(col => {
      const clickableStyle = this.options.onColumnClick ? 'style="cursor:pointer;" title="Batafsil ko\'rish"' : '';
      html += `
        <div class="kanban-column" data-stage="${col.id}" style="border-top: 4px solid ${col.color}">
          <div class="kanban-header" ${clickableStyle}>
            <span>${col.title}</span>
            <span class="badge" style="background:var(--bg-card);color:var(--text-secondary)">${col.cards.length}</span>
          </div>
          <div class="kanban-cards">
        `;
      
      col.cards.forEach(card => {
        const isOverdue = card.is_overdue ? 'overdue' : '';
        
        let dateStr = '';
        if (card.updated_at) {
          try {
            // Convert SQLite datetime format (YYYY-MM-DD HH:MM:SS) to ISO format
            const isoStr = card.updated_at.replace(' ', 'T') + 'Z';
            const d = new Date(isoStr);
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const hour = String(d.getHours()).padStart(2, '0');
            const min = String(d.getMinutes()).padStart(2, '0');
            dateStr = `${day}.${month} ${hour}:${min}`;
          } catch (e) {
            console.error('Error parsing date:', e);
          }
        }

        const statusBadge = card.show_status 
          ? `<span class="badge badge-stage-${col.id}">${card.status}</span>` 
          : '';
        const courseBadge = card.show_course 
          ? `<span class="badge" style="background:var(--bg-primary);color:var(--text-secondary);font-size:10px;padding:2px 8px;border-radius:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:110px;" title="${card.course}">${card.course}</span>` 
          : '';
        const badgeHtml = statusBadge || courseBadge;
        const borderColor = getStatusClassificationColor(card.status);

        html += `
          <div class="kanban-card ${isOverdue}" draggable="true" data-id="${card.id}" data-stage="${col.id}" style="padding: 6px 8px; border-left: 3.5px solid ${borderColor};">
            <div class="flex-between" style="align-items: center; gap: 8px; margin-bottom: 2px;">
              <span class="kanban-card-title" style="margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px;">${card.title}</span>
              ${badgeHtml}
            </div>
            <div class="flex-between" style="align-items: center; gap: 8px; font-size: 11.5px; color: var(--text-secondary);">
              <span class="kanban-card-phone" style="font-size: 11.5px;">${card.subtitle}</span>
              ${dateStr ? `<span style="font-size:10.5px;display:inline-flex;align-items:center;gap:2px;white-space:nowrap;">🕒 ${dateStr}</span>` : ''}
            </div>
          </div>
        `;
      });
      
      html += `</div></div>`;
    });
    
    html += '</div>';
    this.container.innerHTML = html;
    this.attachEvents();
  }

  attachEvents() {
    const cards = this.container.querySelectorAll('.kanban-card');
    const cols = this.container.querySelectorAll('.kanban-column');

    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.setData('text/plain', card.dataset.id);
        e.dataTransfer.setData('stage', card.dataset.stage);
      });
      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
      });
      card.addEventListener('click', () => {
        if (this.options.onCardClick) this.options.onCardClick(card.dataset.id);
      });
    });

    cols.forEach(col => {
      const header = col.querySelector('.kanban-header');
      if (header && this.options.onColumnClick) {
        header.addEventListener('click', (e) => {
          if (e.target.closest('.kanban-card')) return;
          this.options.onColumnClick(col.dataset.stage);
        });
      }

      col.addEventListener('dragover', e => {
        e.preventDefault();
        col.style.background = 'rgba(255,255,255,0.05)';
      });
      col.addEventListener('dragleave', e => {
        col.style.background = 'rgba(255,255,255,0.02)';
      });
      col.addEventListener('drop', e => {
        e.preventDefault();
        col.style.background = 'rgba(255,255,255,0.02)';
        const cardId = e.dataTransfer.getData('text/plain');
        const fromStage = e.dataTransfer.getData('stage');
        const toStage = col.dataset.stage;
        
        if (fromStage !== toStage && this.options.onCardMove) {
          this.options.onCardMove(cardId, fromStage, toStage);
        }
      });
    });
  }
};
