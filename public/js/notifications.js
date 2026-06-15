// Notifications Module
const Notifications = {
  container: null,
  active: false,
  reminders: [],

  async init(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    // Render basic bell template
    this.container.innerHTML = `
      <div class="notifications-wrapper" style="position: relative; display: inline-block;">
        <button class="btn btn-secondary" id="notification-bell" onclick="Notifications.toggle()" style="padding: 10px; border-radius: 50%; width: 42px; height: 42px; position: relative; display: flex; align-items: center; justify-content: center;">
          🔔
          <span id="notification-badge" class="badge danger hidden" style="position: absolute; top: -5px; right: -5px; padding: 2px 6px; font-size: 10px; border-radius: 50%; background: var(--danger); color: white;">0</span>
        </button>
        <div id="notifications-dropdown" class="notifications-dropdown hidden">
          <div class="notifications-header">
            <h4 style="margin: 0; font-size: 14px;">Qo'ng'iroq va eslatmalar</h4>
          </div>
          <div class="notifications-list" id="notifications-list">
            <div style="padding: 16px; text-align: center; color: var(--text-secondary);">Yuklanmoqda...</div>
          </div>
        </div>
      </div>
    `;

    // Click outside to close
    document.addEventListener('click', (e) => {
      const wrapper = document.querySelector('.notifications-wrapper');
      if (wrapper && !wrapper.contains(e.target)) {
        this.close();
      }
    });

    // Initial load and periodic refresh every 60 seconds
    await this.fetchReminders();
    setInterval(() => this.fetchReminders(), 60000);
  },

  async fetchReminders() {
    try {
      const [todayRes, overdueRes] = await Promise.all([
        API.get('/leads?follow_up_today=true&limit=100'),
        API.get('/leads?follow_up_overdue=true&limit=100')
      ]);

      const today = todayRes.data || [];
      const overdue = overdueRes.data || [];

      this.reminders = [
        ...overdue.map(r => ({ ...r, type: 'overdue' })),
        ...today.map(r => ({ ...r, type: 'today' }))
      ];

      this.updateBadge(this.reminders.length);
      this.renderList();
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  },

  updateBadge(count) {
    const badge = document.getElementById('notification-badge');
    if (badge) {
      if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  },

  toggle() {
    const dropdown = document.getElementById('notifications-dropdown');
    if (!dropdown) return;
    this.active = !this.active;
    if (this.active) {
      dropdown.classList.remove('hidden');
      this.fetchReminders();
    } else {
      dropdown.classList.add('hidden');
    }
  },

  close() {
    const dropdown = document.getElementById('notifications-dropdown');
    if (dropdown) {
      dropdown.classList.add('hidden');
      this.active = false;
    }
  },

  renderList() {
    const list = document.getElementById('notifications-list');
    if (!list) return;

    if (this.reminders.length === 0) {
      list.innerHTML = `
        <div style="padding: 24px; text-align: center; color: var(--text-secondary); font-size: 13px;">
          🎉 Bugungi yoki kechikkan vazifalar yo'q!
        </div>
      `;
      return;
    }

    let html = '';
    this.reminders.forEach(r => {
      const isOverdue = r.type === 'overdue';
      const indicatorColor = isOverdue ? 'var(--danger)' : 'var(--success)';
      const typeLabel = isOverdue ? 'KECHIKKAN' : 'BUGUN';
      const actionText = r.next_action || 'Qo\'ng\'iroq qilish';

      html += `
        <div class="notification-item" onclick="Notifications.handleItemClick(${r.id})" style="padding: 12px 16px; border-bottom: 1px solid var(--border); cursor: pointer; transition: var(--transition); position: relative;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; padding-right: 20px;">
            <strong style="font-size: 13px;">${r.full_name}</strong>
            <span class="badge" style="font-size: 9px; padding: 2px 6px; background:${indicatorColor}20; color:${indicatorColor}">${typeLabel}</span>
          </div>
          <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">📞 ${r.phone}</div>
          <div style="font-size: 11px; color: var(--warning); font-style: italic;">↳ ${actionText}</div>
          <button onclick="Notifications.markAsRead(event, ${r.id})" style="position: absolute; right: 12px; bottom: 12px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 4px; cursor: pointer; padding: 4px 6px; font-size: 10px; color: var(--text-primary); display: flex; align-items: center; justify-content: center; gap: 3px;" title="O'qildi deb belgilash">
            ✓ O'qildi
          </button>
        </div>
      `;
    });

    list.innerHTML = html;
  },

  handleItemClick(leadId) {
    this.close();
    LeadModal.show(leadId);
  },

  async markAsRead(e, leadId) {
    if (e) e.stopPropagation();
    try {
      await API.put(`/leads/${leadId}`, { reminder_read: 1 });
      await this.fetchReminders();
      if (window.Dashboard && typeof window.Dashboard.loadStats === 'function') {
        window.Dashboard.loadStats();
      }
    } catch (err) {
      console.error('Failed to mark reminder as read:', err);
    }
  }
};
