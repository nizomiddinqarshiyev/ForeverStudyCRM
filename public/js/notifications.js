// Notifications Module
const Notifications = {
  async show() {
    try {
      const [today, overdue] = await Promise.all([
        api.getRemindersToday(),
        api.getOverdueFollowUpsReport()
      ]);

      const allReminders = [
        ...today.map(r => ({ ...r, type: 'today' })),
        ...overdue.map(r => ({ ...r, type: 'overdue' }))
      ];

      this.updateBadge(allReminders.length);

      if (allReminders.length === 0) {
        Toast.success('Hech qanday eslatma yo\'q!');
        return;
      }

      // Show first few
      allReminders.slice(0, 3).forEach(r => {
        const message = `📞 ${r.full_name} - ${r.phone}`;
        if (r.type === 'overdue') {
          Toast.warning(`🔴 KECHIKKAN: ${message}`);
        } else {
          Toast.success(`✅ BUGUN: ${message}`);
        }
      });

      if (allReminders.length > 3) {
        Toast.warning(`Va yana ${allReminders.length - 3} ta eslatma...`);
      }
    } catch (error) {
      Toast.error('Eslatmalar yuklashda xato: ' + error.message);
    }
  },

  updateBadge(count) {
    const badge = document.getElementById('notification-badge');
    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
};
