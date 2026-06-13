window.Table = class {
  constructor(container, options) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.options = Object.assign({
      columns: [],
      data: [],
      pagination: null, // { page, limit, total, pages }
      onRowClick: null,
      onPageChange: null,
      emptyText: "Ma'lumot topilmadi"
    }, options);
    this.render();
  }

  updateData(data, pagination = null) {
    this.options.data = data;
    if (pagination) this.options.pagination = pagination;
    this.render();
  }

  render() {
    const { columns, data, pagination, emptyText } = this.options;
    
    let html = '<div class="table-container" style="overflow-x: auto"><table class="data-table"><thead><tr>';
    
    columns.forEach(col => {
      html += `<th style="${col.width ? `width:${col.width}` : ''}">${col.label}</th>`;
    });
    
    html += '</tr></thead><tbody>';

    if (!data || data.length === 0) {
      html += `<tr><td colspan="${columns.length}" style="text-align:center;padding:30px;color:var(--text-muted)">${emptyText}</td></tr>`;
    } else {
      data.forEach((row, index) => {
        html += `<tr data-index="${index}">`;
        columns.forEach(col => {
          let val = row[col.key];
          if (col.render) {
            val = col.render(val, row);
          }
          html += `<td>${val !== null && val !== undefined ? val : ''}</td>`;
        });
        html += '</tr>';
      });
    }

    html += '</tbody></table></div>';

    if (pagination && pagination.pages > 1) {
      html += `
        <div class="flex-between mt-4">
          <div class="text-muted" style="font-size:13px">Jami: ${pagination.total} ta</div>
          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm" data-page="${pagination.page - 1}" ${pagination.page <= 1 ? 'disabled' : ''}>&laquo; Oldingi</button>
            <span class="btn btn-secondary btn-sm" style="pointer-events:none">${pagination.page} / ${pagination.pages}</span>
            <button class="btn btn-secondary btn-sm" data-page="${pagination.page + 1}" ${pagination.page >= pagination.pages ? 'disabled' : ''}>Keyingi &raquo;</button>
          </div>
        </div>
      `;
    }

    this.container.innerHTML = html;

    // Events
    if (this.options.onRowClick && data && data.length > 0) {
      this.container.querySelectorAll('tbody tr').forEach(tr => {
        tr.addEventListener('click', () => {
          const idx = tr.getAttribute('data-index');
          if (idx !== null) this.options.onRowClick(data[idx]);
        });
      });
    }

    if (this.options.onPageChange && pagination) {
      this.container.querySelectorAll('[data-page]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const page = parseInt(e.target.getAttribute('data-page'));
          if (!isNaN(page)) this.options.onPageChange(page);
        });
      });
    }
  }
};
