(() => {
  const BRIDGE_PROTOCOL = 'forge-suite-bridge';
  const BRIDGE_VERSION = 1;
  const DEFAULT_CRM_URL = 'https://forge-crm-six.vercel.app';

  function crmUrl() {
    const override = new URLSearchParams(window.location.search).get('forgeCrm');
    if (override) {
      try {
        const url = new URL(override);
        if (url.protocol === 'https:' || url.hostname === 'localhost') return url.origin;
      } catch {}
    }
    return DEFAULT_CRM_URL;
  }

  function bridgePayload() {
    if (typeof current === 'undefined' || !current) return null;
    return {
      protocol: BRIDGE_PROTOCOL,
      version: BRIDGE_VERSION,
      action: 'scope.upsert',
      sourceApp: 'forge-scope',
      sentAt: new Date().toISOString(),
      scope: JSON.parse(JSON.stringify(current))
    };
  }

  function setButtonState(text, disabled = false) {
    const button = document.getElementById('forge-send-crm');
    if (!button) return;
    button.disabled = disabled;
    const label = button.querySelector('[data-label]');
    if (label) label.textContent = text;
    button.classList.toggle('opacity-60', disabled);
    button.classList.toggle('cursor-wait', disabled);
  }

  function sendToCRM() {
    const payload = bridgePayload();
    if (!payload) {
      window.alert('Open or create a Forge Scope first.');
      return;
    }

    if (typeof upsertCurrent === 'function') upsertCurrent();

    const target = crmUrl();
    const targetOrigin = new URL(target).origin;
    let completed = false;
    setButtonState('Opening CRM…', true);

    const crmWindow = window.open(`${target}/#/projects`, 'forge-crm');
    if (!crmWindow) {
      setButtonState('Send to CRM', false);
      window.alert('Your browser blocked the CRM window. Allow pop-ups for Forge Scope and try again.');
      return;
    }

    const readyHandler = (event) => {
      if (event.origin !== targetOrigin) return;
      const message = event.data;
      if (!message || message.protocol !== BRIDGE_PROTOCOL || message.version !== BRIDGE_VERSION || message.action !== 'crm.ready') return;
      completed = true;
      window.removeEventListener('message', readyHandler);
      crmWindow.postMessage(payload, targetOrigin);
      setButtonState('Sent to CRM', false);
      setTimeout(() => setButtonState('Send to CRM', false), 2200);
    };

    window.addEventListener('message', readyHandler);

    setTimeout(() => {
      if (completed) return;
      window.removeEventListener('message', readyHandler);
      setButtonState('Send to CRM', false);
      window.alert('Forge CRM opened, but the bridge did not answer. Refresh the CRM tab and try Send to CRM again.');
    }, 10000);
  }

  function injectButton() {
    if (typeof current === 'undefined' || !current) return;
    if (typeof view !== 'undefined' && !['editor', 'summary', 'ai'].includes(view)) return;
    if (document.getElementById('forge-send-crm')) return;

    const headerActions = document.querySelector('header .flex.items-center.gap-3');
    if (!headerActions) return;

    const button = document.createElement('button');
    button.id = 'forge-send-crm';
    button.type = 'button';
    button.className = 'px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center gap-2 transition';
    button.innerHTML = '<span aria-hidden="true">↗</span><span data-label>Send to CRM</span>';
    button.addEventListener('click', sendToCRM);
    headerActions.prepend(button);
  }

  if (typeof render === 'function') {
    const originalRender = render;
    render = function forgeSuiteRenderWrapper() {
      originalRender();
      injectButton();
    };
  }

  window.sendForgeScopeToCRM = sendToCRM;
  injectButton();
})();
