/**
 * KodNest Premium Build System — main.js
 * Handles: copy prompt, status badge sync, proof checklist, button feedback, toasts
 */

'use strict';

/* ═══════════════════════════════════════
   TOAST SYSTEM
═══════════════════════════════════════ */

function createToastContainer() {
  const existing = document.getElementById('kn-toast-container');
  if (existing) return existing;

  const container = document.createElement('div');
  container.className = 'toast-container';
  container.id = 'kn-toast-container';
  document.body.appendChild(container);
  return container;
}

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'default'|'success'|'error'} type
 * @param {number} duration  - ms before auto-dismiss
 */
function showToast(message, type = 'default', duration = 3000) {
  const container = createToastContainer();

  const toast = document.createElement('div');
  toast.className = 'toast';
  if (type === 'success') toast.classList.add('toast--success');
  if (type === 'error')   toast.classList.add('toast--error');
  toast.textContent = message;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast--exit');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}


/* ═══════════════════════════════════════
   COPY PROMPT
═══════════════════════════════════════ */

function initCopyPrompt() {
  const copyBtn  = document.getElementById('copy-prompt-btn');
  const promptEl = document.getElementById('prompt-text');
  const promptBox = document.getElementById('prompt-box-step-1');

  if (!copyBtn || !promptEl) return;

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(promptEl.textContent.trim());

      // Visual feedback
      promptBox?.classList.add('prompt-box--copied');
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 8l4 4 6-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Copied!
      `;
      copyBtn.style.color = 'var(--color-success)';

      showToast('Prompt copied to clipboard.', 'success');

      setTimeout(() => {
        copyBtn.innerHTML = originalText;
        copyBtn.style.color = '';
        promptBox?.classList.remove('prompt-box--copied');
      }, 2000);

    } catch {
      showToast('Could not copy. Please select and copy manually.', 'error');
    }
  });
}


/* ═══════════════════════════════════════
   STATUS PILL → TOP BAR BADGE SYNC
═══════════════════════════════════════ */

function initStatusSync() {
  const pills  = document.querySelectorAll('.status-pill__input[name="step-status"]');
  const badge  = document.getElementById('global-status-badge');

  if (!badge || !pills.length) return;

  const labelMap = {
    'not-started': { text: 'Not Started', cls: 'status-badge--not-started' },
    'in-progress':  { text: 'In Progress',  cls: 'status-badge--in-progress' },
    'shipped':      { text: 'Shipped',       cls: 'status-badge--shipped' },
  };

  pills.forEach(pill => {
    pill.addEventListener('change', () => {
      const val = pill.value;
      const map = labelMap[val];
      if (!map) return;

      // Remove all state classes
      Object.values(labelMap).forEach(m => badge.classList.remove(m.cls));
      badge.classList.add(map.cls);
      badge.textContent = map.text;

      showToast(`Step status updated to "${map.text}".`, 'default');
    });
  });
}


/* ═══════════════════════════════════════
   PROOF CHECKLIST — COMPLETENESS CHECK
═══════════════════════════════════════ */

function initProofChecklist() {
  const submitBtn     = document.getElementById('submit-proof-btn');
  const checkboxes    = document.querySelectorAll('#proof-footer .checkbox-input');
  const proofInputs   = document.querySelectorAll('.proof-input');

  if (!submitBtn) return;

  submitBtn.addEventListener('click', () => {
    let allComplete = true;
    const unchecked = [];

    checkboxes.forEach(cb => {
      if (!cb.checked) {
        allComplete = false;
        const label = cb.closest('.proof-item')?.querySelector('.checkbox-text');
        if (label) unchecked.push(label.textContent);
      }
    });

    if (!allComplete) {
      showToast(
        `Missing: ${unchecked.join(', ')}. Check all items before advancing.`,
        'error',
        4000
      );
      return;
    }

    // Check proof inputs are non-empty
    let hasEmptyProof = false;
    proofInputs.forEach(input => {
      if (!input.value.trim()) hasEmptyProof = true;
    });

    if (hasEmptyProof) {
      showToast('Please fill in all proof fields before submitting.', 'error', 4000);
      return;
    }

    showToast('Proof submitted. Advancing to next step…', 'success', 3500);
    submitBtn.classList.add('btn--loading');
    setTimeout(() => submitBtn.classList.remove('btn--loading'), 3500);
  });
}


/* ═══════════════════════════════════════
   "IT WORKED" + "ERROR" PANEL BUTTONS
═══════════════════════════════════════ */

function initPanelButtons() {
  const itWorkedBtn = document.getElementById('it-worked-btn');
  const errorBtn    = document.getElementById('error-btn');
  const buildBtn    = document.getElementById('build-in-lovable-btn');

  itWorkedBtn?.addEventListener('click', () => {
    showToast('Marked as working. Continue to the next step.', 'success');
  });

  errorBtn?.addEventListener('click', () => {
    showToast('Error logged. Use the screenshot button to share context.', 'error');
  });

  buildBtn?.addEventListener('click', () => {
    // In production, this would open the Lovable builder.
    showToast('Opening Build in Lovable…', 'default');
  });

  // Add screenshot buttons
  document.getElementById('add-screenshot-btn')?.addEventListener('click', () => {
    showToast('Screenshot upload coming soon.', 'default');
  });

  document.getElementById('add-screenshot-panel-btn')?.addEventListener('click', () => {
    showToast('Screenshot upload coming soon.', 'default');
  });
}


/* ═══════════════════════════════════════
   SAVE STEP / RESET STEP
═══════════════════════════════════════ */

function initStepControls() {
  const saveBtn  = document.getElementById('save-step-1-btn');
  const resetBtn = document.getElementById('reset-step-1-btn');
  const nameInput  = document.getElementById('project-name-input');
  const stackSelect = document.getElementById('tech-stack-select');

  saveBtn?.addEventListener('click', () => {
    const name  = nameInput?.value.trim();
    const stack = stackSelect?.value;

    if (!name) {
      nameInput?.classList.add('field-input--error');
      // insert error message if not already present
      if (!document.getElementById('name-error-msg')) {
        const msg = document.createElement('p');
        msg.className = 'field-error-msg';
        msg.id = 'name-error-msg';
        msg.textContent = 'Project name is required.';
        nameInput?.insertAdjacentElement('afterend', msg);
      }
      showToast('Please enter a project name before saving.', 'error');
      nameInput?.focus();
      return;
    }

    if (!stack) {
      showToast('Please choose a tech stack before saving.', 'error');
      stackSelect?.focus();
      return;
    }

    // Clear errors
    nameInput?.classList.remove('field-input--error');
    document.getElementById('name-error-msg')?.remove();
    nameInput?.classList.add('field-input--valid');

    showToast(`Step 1 saved — "${name}" with ${stack}.`, 'success');
    saveBtn.classList.add('btn--loading');
    setTimeout(() => {
      saveBtn.classList.remove('btn--loading');
    }, 1500);
  });

  resetBtn?.addEventListener('click', () => {
    if (nameInput)   nameInput.value  = '';
    if (stackSelect) stackSelect.value = '';
    nameInput?.classList.remove('field-input--valid', 'field-input--error');
    document.getElementById('name-error-msg')?.remove();
    showToast('Step 1 reset.', 'default');
  });

  // Live validation clear on valid input
  nameInput?.addEventListener('input', () => {
    if (nameInput.value.trim()) {
      nameInput.classList.remove('field-input--error');
      document.getElementById('name-error-msg')?.remove();
    }
  });
}


/* ═══════════════════════════════════════
   RETRY BUTTON (error card)
═══════════════════════════════════════ */

function initRetryButton() {
  const retryBtn = document.getElementById('retry-btn');
  retryBtn?.addEventListener('click', () => {
    retryBtn.classList.add('btn--loading');
    showToast('Retrying…', 'default');
    setTimeout(() => {
      retryBtn.classList.remove('btn--loading');
      showToast('Connection restored. Please re-run your prompt.', 'success');
    }, 2000);
  });
}


/* ═══════════════════════════════════════
   "BEGIN STEP 1" (empty state)
═══════════════════════════════════════ */

function initEmptyState() {
  const beginBtn = document.getElementById('start-first-step-btn');
  beginBtn?.addEventListener('click', () => {
    document.getElementById('project-name-input')?.scrollIntoView({
      behavior: 'smooth', block: 'center'
    });
    setTimeout(() => document.getElementById('project-name-input')?.focus(), 400);
  });
}


/* ═══════════════════════════════════════
   INIT ALL
═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  initCopyPrompt();
  initStatusSync();
  initProofChecklist();
  initPanelButtons();
  initStepControls();
  initRetryButton();
  initEmptyState();
});
