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
      <div class="sidebar-logo" style="display:flex; align-items:center; gap:10px; padding: 12px 16px; border-bottom: 1px solid var(--border); background: none; box-sizing: border-box;">
        <img src="/logo.png" alt="ForeverStudy Logo" style="height: 46px; max-width: 100%; object-fit: contain; background: white; padding: 4px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); flex-shrink: 0;">
        <div style="display: flex; flex-direction: column; animation: logoFadeIn 0.8s ease-out; line-height: 1.1;">
          <div style="display: flex; font-size: 17px; font-weight: 800; font-family: 'Inter', sans-serif; letter-spacing: -0.5px;">
            <span style="color: #0b53a4;">Forever</span><span style="color: #e52825; margin-left: 2px;">Study</span>
          </div>
          <span style="font-size: 9.5px; color: var(--text-secondary); text-transform: uppercase; font-weight: 600; letter-spacing: 1px; margin-top: 2px;">Education</span>
        </div>
      </div>
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
