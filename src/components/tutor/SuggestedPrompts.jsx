'use client';

export const PROMPTS_BY_LANG = {
  bugis: [
    'Kuis 10 kata Bugis',
    'Apa arti "siri\'" dalam Bugis?',
    'Bagaimana sistem kasta dalam budaya Bugis?',
    'Cari kata "rumah" dalam Bugis',
  ],
  massenrempulu: [
    'Kuis 10 kata Massenrempulu',
    'Apa arti "to\'" dalam Massenrempulu?',
    'Bagaimana tradisi lisan Massenrempulu diwariskan?',
    'Cari kata "air" dalam Massenrempulu',
  ],
  konjo: [
    'Kuis 10 kata Konjo',
    'Apa arti "tallang sipahua" dalam Konjo?',
    'Bagaimana filosofi "kamase-mase" dalam budaya Konjo?',
    'Cari kata "hutan" dalam Konjo',
  ],
  minang: [
    'Kuis 10 kata Minangkabau',
    'Apa arti "alam takambang jadi guru"?',
    'Bagaimana sistem matrilineal dalam adat Minang?',
    'Cari pantun Minang tentang rantau',
  ],
  melayu: [
    'Kuis 10 kata Melayu Jambi',
    'Apa arti "sayo" dalam Melayu Jambi?',
    'Bagaimana cerita Orang Kayo Hitam dalam sejarah Jambi?',
    'Cari kata "air" dalam Melayu Jambi',
  ],
};

/** @param {{ onSelect: (prompt: string) => void, lang?: string }} props */
export default function SuggestedPrompts({ onSelect, lang = 'bugis' }) {
  const prompts = PROMPTS_BY_LANG[lang] ?? PROMPTS_BY_LANG.bugis;
  return (
    <div className="tutor-prompt-chips">
      {prompts.map((p) => (
        <button key={p} className="tutor-prompt-chip" onClick={() => onSelect(p)}>
          {p}
        </button>
      ))}
    </div>
  );
}
