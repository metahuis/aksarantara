'use client';
import { useRef, useState } from 'react';

/**
 * Lexicon-card row for a Lontara OCR recognized entry.
 * Includes inline mic-record + save to Supabase.
 * @param {{ entry: object, onSave: (entry:object, audioBlob:Blob|null)=>Promise<void>, savedState: string|null }} props
 */
export default function RecognizedEntryRow({ entry, onSave, savedState }) {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const recorderRef = useRef(null);

  const confPct = Math.round((entry.confidence ?? 0.7) * 100);
  const confCls = confPct >= 75 ? 'lon-conf--high' : confPct >= 50 ? 'lon-conf--med' : 'lon-conf--low';

  async function toggleRec() {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = e => chunks.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: mr.mimeType });
        setAudioBlob(blob);
        stream.getTracks().forEach(t => t.stop());
        setRecording(false);
      };
      recorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      setRecording(false);
    }
  }

  const isSaving = savedState === 'saving';
  const isDone   = savedState === 'done';
  const isErr    = savedState === 'error';

  return (
    <div className="lon-entry-row">
      <div className="lon-entry-meta">
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span className="lon-entry-word">{entry.primary_text}</span>
          <span className={`lon-conf ${confCls}`}>{confPct}%</span>
        </div>
        {entry.phonetic && <div className="lon-entry-ipa">/{entry.phonetic}/</div>}
        {entry.gloss_id && <div className="lon-entry-gloss">{entry.gloss_id}</div>}
        {audioBlob && (
          <div style={{ marginTop: 4 }}>
            <audio controls src={URL.createObjectURL(audioBlob)} style={{ height: 28, width: '100%', maxWidth: 200 }} />
          </div>
        )}
      </div>

      <div className="lon-entry-actions">
        <button
          className={`lon-rec-btn${recording ? ' recording' : ''}`}
          onClick={toggleRec}
          disabled={isDone || isSaving}
        >
          {recording ? '⏹ Selesai' : audioBlob ? '⏺ Rekam ulang' : '⏺ Rekam suara'}
        </button>
        <button
          className="btn-sm"
          onClick={() => onSave(entry, audioBlob)}
          disabled={isSaving || isDone}
          style={isDone ? { background: 'var(--green)', color: '#fff', border: 'none' } : {}}
        >
          {isDone ? '✓ Tersimpan' : isSaving ? '…' : isErr ? 'Gagal, coba lagi' : 'Simpan'}
        </button>
      </div>
    </div>
  );
}
