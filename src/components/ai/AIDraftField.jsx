'use client';
import { useState, useEffect } from 'react';

/**
 * Text field with gradient left-strip and DRAFT badge.
 * Strip + badge fade out when user edits the value.
 * @param {{ label: string, value: string, onChange: (v:string)=>void, isDraft?: boolean, multiline?: boolean, placeholder?: string }} props
 */
export default function AIDraftField({ label, value, onChange, isDraft = false, multiline = false, placeholder = '' }) {
  const [wasEdited, setWasEdited] = useState(false);

  useEffect(() => {
    if (!isDraft) setWasEdited(false);
  }, [isDraft]);

  function handleChange(e) {
    setWasEdited(true);
    onChange(e.target.value);
  }

  const showStrip = isDraft && !wasEdited;

  return (
    <div className="ai-draft-field">
      <div className={`ai-draft-field-strip${showStrip ? '' : ' cleared'}`} />
      <div className="ai-draft-field-header">
        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--n-500)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </label>
        <span className={`ai-draft-mini-badge${showStrip ? '' : ' hidden'}`}>
          Draft
        </span>
      </div>
      {multiline ? (
        <textarea
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          rows={3}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}
