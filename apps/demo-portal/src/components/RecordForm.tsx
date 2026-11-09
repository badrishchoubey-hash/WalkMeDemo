import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { readSession, saveSession } from '../mock-data/session-state';
export type Field = {
  key: string;
  label: string;
  guide: string;
  placeholder?: string;
  options?: string[];
  multiline?: boolean;
  required?: boolean;
  pattern?: string;
};
type Props = {
  kind: 'part' | 'change';
  fields: Field[];
  onSave: (values: Record<string, string>) => string | undefined;
  onClose: () => void;
};
export function RecordForm({ kind, fields, onSave, onClose }: Props) {
  const [initial] = useState(
    () => readSession(kind === 'part' ? 'parts' : 'changes')?.draft,
  );
  const [values, setValues] = useState<Record<string, string>>(
    initial?.values ?? {},
  );
  const valuesRef = useRef(values);
  const [review, setReview] = useState(initial?.review ?? false);
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const title = kind === 'part' ? 'Create part' : 'New change request';
  function remember(next: Record<string, string>, reviewing: boolean) {
    const failure = saveSession(kind === 'part' ? 'parts' : 'changes', {
      kind,
      values: next,
      review: reviewing,
    });
    if (failure) setError(failure);
  }
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    element?.showModal();
    return () => {
      element?.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, []);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!review) {
      setError('');
      setReview(true);
      remember(values, true);
      return;
    }
    const failure = onSave(values);
    if (failure) {
      setError(failure);
      setReview(false);
      remember(values, false);
    }
  }
  return (
    <dialog ref={dialog} onCancel={onClose} aria-labelledby="form-title">
      <header className="dialog-header">
        <div>
          <span className="eyebrow">ENGINEERING WORKSPACE</span>
          <h2 id="form-title">{review ? 'Review before creating' : title}</h2>
        </div>
        <button
          className="icon-button"
          aria-label="Close form"
          onClick={onClose}
        >
          ×
        </button>
      </header>
      <p className="muted">
        {review
          ? 'Check the details below. No record is saved until you confirm.'
          : 'Define the record. Required fields are marked with an asterisk.'}
      </p>
      <form onSubmit={submit}>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {review ? (
          <dl className="review">
            {fields.map((field) => (
              <div key={field.key}>
                <dt>{field.label}</dt>
                <dd>{values[field.key] || '—'}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="form-grid">
            {fields.map((field) => {
              const props = {
                id: field.guide,
                'data-guide': field.guide,
                name: field.key,
                required: field.required ?? true,
                value: values[field.key] ?? '',
                onChange: (
                  event: React.ChangeEvent<
                    HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
                  >,
                ) => {
                  const next = {
                    ...valuesRef.current,
                    [field.key]: event.target.value,
                  };
                  valuesRef.current = next;
                  setValues(next);
                  remember(next, false);
                },
              };
              return (
                <label
                  key={field.key}
                  className={field.multiline ? 'full' : ''}
                  htmlFor={field.guide}
                >
                  {field.label}
                  {(field.required ?? true) && ' *'}
                  {field.options ? (
                    <select {...props}>
                      <option value="">Select an option</option>
                      {field.options.map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  ) : field.multiline ? (
                    <textarea
                      {...props}
                      rows={3}
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <input
                      {...props}
                      placeholder={field.placeholder}
                      pattern={field.pattern}
                      maxLength={120}
                    />
                  )}
                </label>
              );
            })}
          </div>
        )}
        <footer className="dialog-footer">
          <button
            type="button"
            className="secondary"
            onClick={() => {
              if (review) {
                setReview(false);
                remember(values, false);
              } else onClose();
            }}
          >
            {review ? 'Back to edit' : 'Cancel'}
          </button>
          <button
            className="primary"
            type="submit"
            data-guide={review ? `confirm-${kind}` : `review-${kind}`}
          >
            {review
              ? 'Confirm create'
              : kind === 'part'
                ? 'Review part'
                : 'Review request'}{' '}
            <span aria-hidden="true">→</span>
          </button>
        </footer>
      </form>
    </dialog>
  );
}
