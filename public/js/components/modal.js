window.Modal = {
  overlay: null,

  init() {
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.className = 'modal-overlay';
      
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.close();
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.overlay.classList.contains('active')) {
          this.close();
        }
      });

      document.body.appendChild(this.overlay);
    }
  },

  show({ title, content, footer, size = 'md', onClose }) {
    this.init();
    this.onCloseCb = onClose;
    
    let maxWidth = '600px';
    if (size === 'lg') maxWidth = '900px';
    if (size === 'sm') maxWidth = '400px';

    this.overlay.innerHTML = `
      <div class="modal" style="max-width: ${maxWidth}">
        <div class="modal-header">
          <h3 style="margin:0">${title}</h3>
          <button class="btn btn-icon btn-secondary" onclick="Modal.close()" style="border:none;background:transparent;cursor:pointer;color:var(--text-secondary);font-size:20px">&times;</button>
        </div>
        <div class="modal-body">
          ${content}
        </div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
      </div>
    `;

    // Trigger reflow for transition
    void this.overlay.offsetWidth;
    this.overlay.classList.add('active');
  },

  close() {
    if (this.overlay) {
      this.overlay.classList.remove('active');
      setTimeout(() => {
        this.overlay.innerHTML = '';
      }, 300);
      if (this.onCloseCb) this.onCloseCb();
    }
  },

  confirm({ title = 'Diqqat', message, onConfirm, confirmText = 'Tasdiqlash', cancelText = 'Bekor qilish' }) {
    this.show({
      title,
      size: 'sm',
      content: `<p>${message}</p>`,
      footer: `
        <button class="btn btn-secondary" onclick="Modal.close()">${cancelText}</button>
        <button class="btn btn-danger" id="confirm-btn">${confirmText}</button>
      `
    });

    document.getElementById('confirm-btn').addEventListener('click', () => {
      onConfirm();
      this.close();
    });
  }
};
