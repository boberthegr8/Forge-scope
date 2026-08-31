(() => {
  // Compatibility bridge for Automatic Scope AI. The legacy Forge Scope shell is
  // rendered directly by the core app and does not expose layoutShell().
  // Automatic Scope expects that helper, so preserve the existing shell and only
  // swap the #content region.
  if (typeof window.layoutShell !== 'function') {
    window.layoutShell = function forgeScopeLayoutShell(content) {
      const app = document.getElementById('app');
      if (!app) return String(content || '');

      const holder = document.createElement('div');
      holder.innerHTML = app.innerHTML;
      const target = holder.querySelector('#content');
      if (target) {
        target.innerHTML = String(content || '');
        return holder.innerHTML;
      }

      // Last-resort shell if the core app has not rendered yet.
      return `<main class="flex-1 min-w-0 overflow-hidden"><div id="content" class="h-full overflow-y-auto p-4 md:p-6">${String(content || '')}</div></main>`;
    };
  }

  // Surface unexpected Automatic Scope failures instead of failing silently.
  window.addEventListener('error', event => {
    if (typeof view === 'undefined' || view !== 'autoScopeAI') return;
    const message = event?.error?.message || event?.message;
    if (!message) return;
    const content = document.getElementById('content');
    if (!content || document.getElementById('auto-scope-runtime-error')) return;
    const box = document.createElement('div');
    box.id = 'auto-scope-runtime-error';
    box.className = 'm-4 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800';
    box.innerHTML = `<b>Automatic Scope error:</b> ${String(message).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}`;
    content.prepend(box);
  });
})();