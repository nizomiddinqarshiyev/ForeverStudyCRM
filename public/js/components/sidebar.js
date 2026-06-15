window.Sidebar = {
  render(containerId, options) {
    const container = document.getElementById(containerId);
    const { activeRoute, user, onNavigate, notificationCount } = options;
    
    const navItems = [
      { id: 'dashboard', icon: '📊', label: 'Dashboard' },
      { id: 'pipeline', icon: '📋', label: 'Pipeline' },
      { id: 'calendar', icon: '📅', label: 'Kalendar' },
      { id: 'leads', icon: '👤', label: 'Lidlar' },
      { id: 'courses', icon: '📚', label: 'Kurslar' },
      { id: 'managers', icon: '👔', label: 'Menejerlar', adminOnly: true },
      { id: 'reports', icon: '📈', label: 'Hisobotlar' }
    ];

    let navHtml = '';
    navItems.forEach(item => {
      if (item.adminOnly && user.role !== 'admin') return;
      const activeClass = activeRoute === item.id ? 'active' : '';
      let badge = '';
      if (item.id === 'pipeline' && notificationCount > 0) {
        badge = `<span style="background:var(--danger);color:white;border-radius:10px;padding:2px 8px;font-size:10px;margin-left:auto">${notificationCount}</span>`;
      }
      navHtml += `<a href="#${item.id}" class="nav-item ${activeClass}" data-id="${item.id}">
        <span>${item.icon}</span> <span>${item.label}</span> ${badge}
      </a>`;
    });

    container.innerHTML = `
      <div class="sidebar-logo">ForeverStudy CRM</div>
      <div class="sidebar-nav">
        ${navHtml}
      </div>
      <div class="sidebar-footer">
        <div class="flex gap-2" style="align-items:center;margin-bottom:12px">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:bold">${user.full_name.charAt(0)}</div>
          <div>
            <div style="font-weight:600;font-size:14px">${user.full_name}</div>
            <div class="text-muted" style="font-size:12px;text-transform:capitalize">${user.role}</div>
          </div>
        </div>
        <button class="btn btn-secondary" style="width:100%" onclick="App.logout()">Chiqish</button>
      </div>
    `;

    container.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        onNavigate(el.dataset.id);
      });
    });
  }
};
