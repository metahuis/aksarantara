'use client';
import { useState, useRef } from 'react';
import { LANGUAGES } from '@/data';

const REQUIRED_COLS  = ['lang', 'type', 'primary_text', 'gloss_id'];
const OPTIONAL_COLS  = ['pos', 'phonetic', 'gloss', 'dialect', 'contextual_meaning', 'usage_example', 'speaker_name', 'speaker_age', 'speaker_village'];
const ALL_COLS       = [...REQUIRED_COLS, ...OPTIONAL_COLS];
const VALID_TYPES    = ['word', 'phrase', 'peribahasa', 'story', 'song', 'pantun'];
const VALID_LANGS    = LANGUAGES.map(l => l.id);
const VALID_POS      = ['noun', 'verb', 'adjective', 'numeral', 'other', ''];

const TEMPLATE_HEADER = ALL_COLS.join(',');
const TEMPLATE_ROW    = 'bugis,word,mappoji,makan,verb,/mapˈpod͡ʒi/,to eat,Sinjai,,,,La Akmale,35,"Sinjai, Sulawesi Selatan"';
const TEMPLATE_CSV    = `${TEMPLATE_HEADER}\n${TEMPLATE_ROW}\n`;

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map(line => {
    const vals = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQ = !inQ; }
      else if (line[i] === ',' && !inQ) { vals.push(cur.trim()); cur = ''; }
      else { cur += line[i]; }
    }
    vals.push(cur.trim());
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = vals[idx] ?? ''; });
    return obj;
  });
  return { headers, rows };
}

function validateRow(row, idx) {
  const errors = [];
  if (!row.lang)         errors.push('lang wajib diisi');
  else if (!VALID_LANGS.includes(row.lang)) errors.push(`lang "${row.lang}" tidak dikenal`);
  if (!row.type)         errors.push('type wajib diisi');
  else if (!VALID_TYPES.includes(row.type)) errors.push(`type "${row.type}" tidak valid`);
  if (!row.primary_text) errors.push('primary_text wajib diisi');
  if (!row.gloss_id)     errors.push('gloss_id wajib diisi');
  if (row.pos && !VALID_POS.includes(row.pos)) errors.push(`pos "${row.pos}" tidak valid`);
  return errors;
}

export default function BulkPage() {
  const [rows, setRows]         = useState(null);
  const [headers, setHeaders]   = useState([]);
  const [validation, setValidation] = useState([]); // errors per row
  const [importing, setImporting]   = useState(false);
  const [result, setResult]         = useState(null);
  const fileRef = useRef(null);

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'aksarantara_bulk_template.csv';
    a.click(); URL.revokeObjectURL(url);
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const { headers: h, rows: r } = parseCSV(ev.target.result ?? '');
      setHeaders(h);
      setRows(r);
      setValidation(r.map((row, i) => validateRow(row, i)));
      setResult(null);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!rows) return;
    const validRows = rows.filter((_, i) => validation[i].length === 0);
    setImporting(true);
    setResult(null);
    const res = await fetch('/api/admin/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: validRows }),
    });
    const data = await res.json();
    setResult(data);
    setImporting(false);
  }

  const hasErrors    = validation.some(e => e.length > 0);
  const validCount   = rows ? validation.filter(e => e.length === 0).length : 0;
  const invalidCount = rows ? validation.filter(e => e.length > 0).length : 0;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', margin: '0 0 4px' }}>Unggah Massal</h1>
        <p style={{ color: 'var(--n-500)', fontSize: 14, margin: 0 }}>Import banyak entri sekaligus dari file CSV.</p>
      </div>

      {/* Template download */}
      <div style={{ background: 'var(--white)', border: '1.5px solid var(--n-100)', borderRadius: 'var(--radius-lg)', padding: 24, marginBottom: 24, boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>Template CSV</div>
            <div style={{ fontSize: 13, color: 'var(--n-500)', lineHeight: 1.6 }}>
              Kolom wajib: <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--n-50)', padding: '1px 5px', borderRadius: 4 }}>{REQUIRED_COLS.join(', ')}</code>
            </div>
            <div style={{ fontSize: 13, color: 'var(--n-400)', lineHeight: 1.6, marginTop: 2 }}>
              Kolom opsional: <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--n-50)', padding: '1px 5px', borderRadius: 4 }}>{OPTIONAL_COLS.join(', ')}</code>
            </div>
          </div>
          <button onClick={downloadTemplate} className="btn-ghost" style={{ flexShrink: 0 }}>
            ↓ Unduh Template
          </button>
        </div>

        <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--n-50)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--n-700)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          <div style={{ color: 'var(--n-400)', marginBottom: 2 }}># Bahasa valid: {VALID_LANGS.join(', ')}</div>
          <div style={{ color: 'var(--n-400)', marginBottom: 2 }}># Tipe valid: {VALID_TYPES.join(', ')}</div>
          <div style={{ color: 'var(--n-400)' }}># POS valid (hanya untuk word): {['noun','verb','adjective','numeral','other'].join(', ')}</div>
        </div>
      </div>

      {/* Upload */}
      <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={handleFile} />

      {!rows ? (
        <label
          onClick={() => fileRef.current?.click()}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '48px 32px', border: '2px dashed var(--n-200)', borderRadius: 'var(--radius-xl)', cursor: 'pointer', transition: 'border-color 160ms', background: 'var(--white)' }}
        >
          <div style={{ fontSize: 32 }}>📄</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>Pilih atau seret file CSV</div>
          <div style={{ fontSize: 13, color: 'var(--n-400)' }}>Format: UTF-8, header baris pertama</div>
        </label>
      ) : (
        <>
          {/* Summary */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 140, padding: '14px 18px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#166534' }}>{validCount}</div>
              <div style={{ fontSize: 13, color: '#166534' }}>baris valid</div>
            </div>
            {invalidCount > 0 && (
              <div style={{ flex: 1, minWidth: 140, padding: '14px 18px', borderRadius: 10, background: '#fff1f2', border: '1px solid #fecdd3' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--red)' }}>{invalidCount}</div>
                <div style={{ fontSize: 13, color: 'var(--red)' }}>baris bermasalah (akan dilewati)</div>
              </div>
            )}
            <div style={{ alignSelf: 'flex-end', marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button onClick={() => { setRows(null); setResult(null); if (fileRef.current) fileRef.current.value = ''; }} className="btn-ghost">Ganti File</button>
              <button onClick={handleImport} disabled={importing || validCount === 0} className="btn-primary" style={{ opacity: importing || validCount === 0 ? 0.6 : 1 }}>
                {importing ? 'Mengimpor…' : `Import ${validCount} Entri`}
              </button>
            </div>
          </div>

          {result && (
            <div style={{ padding: '14px 18px', borderRadius: 12, marginBottom: 20, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 14, color: '#166534' }}>
              ✅ {result.inserted} entri berhasil diimpor.
              {result.failed?.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--red)' }}>
                  {result.failed.map((f, i) => <div key={i}>{f.row}: {f.error}</div>)}
                </div>
              )}
            </div>
          )}

          {/* Preview table */}
          <div style={{ background: 'var(--white)', border: '1.5px solid var(--n-100)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', overflow: 'auto', maxHeight: 480 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
              <thead style={{ position: 'sticky', top: 0 }}>
                <tr style={{ borderBottom: '1.5px solid var(--n-100)', background: 'var(--n-50)' }}>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--n-500)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Status</th>
                  {headers.filter(h => ALL_COLS.includes(h)).map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--n-500)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const errs = validation[i];
                  return (
                    <tr key={i} style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--n-100)' : 'none', background: errs.length ? '#fff8f8' : 'transparent' }}>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        {errs.length
                          ? <span title={errs.join('; ')} style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', cursor: 'help' }}>✗ {errs[0]}{errs.length > 1 ? ` +${errs.length - 1}` : ''}</span>
                          : <span style={{ fontSize: 11, fontWeight: 700, color: '#166534' }}>✓</span>
                        }
                      </td>
                      {headers.filter(h => ALL_COLS.includes(h)).map(h => (
                        <td key={h} style={{ padding: '9px 12px', fontSize: 13, color: 'var(--n-700)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row[h] || <span style={{ color: 'var(--n-200)' }}>—</span>}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
