import type { GuideWorkflow } from '../../../../packages/shared/workflow-types';

export function createWorkflowFeedback(shadow: ShadowRoot) {
  const style = document.createElement('style');
  style.textContent = `dialog{font:15px/1.5 'Segoe UI',sans-serif;color:#243b4d;border:1px solid #c7d4de;border-radius:12px;padding:24px;width:420px;max-width:calc(100vw - 32px);max-height:calc(100dvh - 32px);overflow:auto;pointer-events:auto;box-shadow:0 12px 40px #102a4030}dialog::backdrop{background:#102a4040}.rating{display:flex;gap:8px;margin:16px 0}.rating label{display:grid;justify-items:center;gap:4px;cursor:pointer}.rating span{font-size:28px;color:#215d46}dialog textarea{display:block;width:100%;min-height:100px;margin:8px 0 16px;padding:10px;font:inherit;border:1px solid #bfced8;border-radius:6px}dialog h2{margin-top:0}dialog .actions{display:flex;justify-content:flex-end;gap:10px}dialog button{color:#215d46}dialog fieldset{border:0;padding:0;margin:16px 0}dialog .feedback-status{margin:12px 0}`;
  const dialog = document.createElement('dialog');
  // Keep native radio keyboard behavior while presenting only the star labels.
  style.textContent +=
    '.rating label{position:relative;display:flex;align-items:center;justify-content:center;min-width:36px;min-height:40px;border-radius:4px}.rating input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer}.rating label:has(input:focus-visible){outline:3px solid #3881b5;outline-offset:3px}';
  dialog.setAttribute('aria-label', 'Workflow feedback');
  shadow.append(style);
  let returnFocus: HTMLElement | undefined;
  dialog.addEventListener('close', () => {
    dialog.remove();
    returnFocus?.focus();
  });
  return {
    get isOpen() {
      return dialog.open;
    },
    open(workflow: GuideWorkflow, trigger: HTMLElement) {
      if (dialog.open) return;
      returnFocus = trigger;
      dialog.replaceChildren();
      const title = document.createElement('h2');
      title.textContent = 'Feedback';
      const description = document.createElement('p');
      description.textContent = `How helpful was “${workflow.title}”?`;
      const form = document.createElement('form');
      const fieldset = document.createElement('fieldset');
      const legend = document.createElement('legend');
      legend.textContent =
        'Rating (optional): 1 = not helpful, 5 = very helpful';
      const ratings = document.createElement('div');
      ratings.className = 'rating';
      fieldset.append(legend, ratings);
      for (let value = 1; value <= 5; value++) {
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'rating';
        input.value = String(value);
        input.setAttribute('aria-label', `${value} out of 5`);
        const star = document.createElement('span');
        star.textContent = '☆';
        star.setAttribute('aria-hidden', 'true');
        label.append(star, input);
        ratings.append(label);
        input.onchange = () => {
          for (const [index, item] of Array.from(
            ratings.querySelectorAll('span'),
          ).entries()) {
            item.textContent = index < value ? '★' : '☆';
          }
        };
      }
      const label = document.createElement('label');
      label.textContent = 'Comments (optional)';
      const comments = document.createElement('textarea');
      comments.maxLength = 1000;
      comments.placeholder =
        'Tell us what worked or could be improved. Avoid confidential information.';
      label.append(comments);
      const privacy = document.createElement('p');
      privacy.textContent = 'Saved only in this browser, not sent to a server.';
      const status = document.createElement('p');
      status.className = 'feedback-status';
      status.setAttribute('role', 'status');
      const actions = document.createElement('div');
      actions.className = 'actions';
      const close = document.createElement('button');
      close.type = 'button';
      close.textContent = 'Skip';
      close.onclick = () => dialog.close();
      const submit = document.createElement('button');
      submit.type = 'submit';
      submit.textContent = 'Save feedback';
      actions.append(close, submit);
      form.append(fieldset, label, privacy, status, actions);
      form.onsubmit = async (event) => {
        event.preventDefault();
        const rating = new FormData(form).get('rating');
        const comment = comments.value.trim();
        if (!rating && !comment) {
          status.textContent =
            'Choose a rating or add a comment before saving.';
          return;
        }
        submit.disabled = true;
        try {
          await chrome.storage.local.set({
            [`guidance:feedback:v1:${workflow.id}`]: {
              workflowId: workflow.id,
              workflowVersion: workflow.version,
              rating: rating ? Number(rating) : null,
              comment,
              savedAt: new Date().toISOString(),
            },
          });
          status.textContent =
            'Thank you! Your feedback is saved in this browser.';
          fieldset.disabled = true;
          comments.disabled = true;
          submit.hidden = true;
          close.textContent = 'Done';
        } catch {
          status.textContent = 'Feedback could not be saved. Please try again.';
          submit.disabled = false;
        }
      };
      dialog.append(title, description, form);
      shadow.append(dialog);
      dialog.showModal();
    },
    close() {
      if (dialog.open) dialog.close();
    },
  };
}
