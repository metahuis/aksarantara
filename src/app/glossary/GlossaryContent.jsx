'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Topbar from '../../components/Topbar.jsx';
import Footer from '../../components/Footer.jsx';
import Icon from '../../components/Icon.jsx';

/* ── Data ──────────────────────────────────────────────────────── */

const SECTIONS = [
  { id: 'pengantar',   label: 'Pengantar' },
  { id: 'glosarium',  label: 'Glosarium' },
  { id: 'kontribusi', label: 'Panduan Kontribusi' },
  { id: 'standar',    label: 'Standar Data' },
  { id: 'contoh',     label: 'Contoh Entri' },
  { id: 'ipa',        label: 'Panduan IPA' },
];

const IPA_VOWELS = [
  { sym: '/a/', desc: 'Vokal depan rendah, seperti "a" dalam apa', ex: 'ana\' (Bugis/Konjo) · bapa (ayah)' },
  { sym: '/i/', desc: 'Vokal depan tinggi, seperti "i" dalam ini', ex: 'iko\' (kamu, Konjo) · siri\' (Bugis)' },
  { sym: '/u/', desc: 'Vokal belakang tinggi, seperti "u" dalam ulu', ex: 'uwae (air, Bugis) · urang (orang, Minang)' },
  { sym: '/e/', desc: 'Vokal depan sedang, seperti "e" dalam enak', ex: 'wenni (malam, Bugis) · elok (cantik, Melayu Jambi)' },
  { sym: '/ɛ/', desc: 'Vokal depan rendah-sedang, seperti "e" dalam ekor', ex: 'Banyak pada vokal pinjaman' },
  { sym: '/o/', desc: 'Vokal belakang sedang, seperti "o" dalam obat', ex: 'olokolok (hewan, Bugis) · tigo (tiga, Melayu Jambi)' },
  { sym: '/ə/', desc: 'Vokal tengah (pepet), seperti "e" dalam empat', ex: 'Ditemukan dalam kata serapan Melayu' },
];

const IPA_CONSONANTS = [
  { sym: '/ʔ/', desc: 'Glottal stop (hamzah) — penghentian di tenggorokan, ditulis \'', ex: 'siri\' /siɾiʔ/ (Bugis) · ana\' (Konjo) · doi\' (uang, Massenrempulu)' },
  { sym: '/ŋ/', desc: 'Bunyi "ng" seperti dalam nganga', ex: 'nganre /ŋanɾe/ (makan, Konjo) · ngapo (kenapa, Melayu Jambi)' },
  { sym: '/ɲ/', desc: 'Bunyi "ny" seperti dalam nyaman', ex: 'nyai (nenek, Melayu Jambi) · nyimas (nama penutur)' },
  { sym: '/ɾ/', desc: 'R getar tunggal (flap), seperti "r" Spanyol dalam "pero"', ex: 'siri\' /siɾiʔ/ · urang /uɾaŋ/ (Minang)' },
  { sym: '/d͡ʒ/', desc: 'Bunyi "j" seperti dalam jalan (afrikat)', ex: 'mappoji /mapˈpod͡ʒi/ (Bugis) · majo (pergi, Minang)' },
  { sym: '/t͡ʃ/', desc: 'Bunyi "c" seperti dalam cinta (afrikat tak bersuara)', ex: 'pacak /pat͡ʃak/ (bisa, Melayu Jambi)' },
  { sym: '/β/', desc: 'Bunyi antara "b" dan "v", geseran bilabial bersuara', ex: 'Ditemukan dalam beberapa dialek Bugis dan Konjo' },
];

const IPA_MARKERS = [
  { sym: 'ˈ', desc: 'Tekanan utama — letak di depan suku kata yang ditekan', ex: '/mapˈpod͡ʒi/ → suku kata "po" ditekan' },
  { sym: 'ː', desc: 'Bunyi dipanjangkan (vokal atau konsonan panjang)', ex: '/aː/ = bunyi "a" yang lebih panjang dari biasa' },
  { sym: '/ /', desc: 'Tanda transkripsi fonemik (fonem, bukan bunyi persisnya)', ex: '/siɾiʔ/ — cara paling umum mencatat pelafalan' },
  { sym: '[ ]', desc: 'Tanda transkripsi fonetik (bunyi persis, termasuk alofon)', ex: '[siɾiʔ] — lebih detail, biasanya untuk riset akademik' },
];

const CATEGORIES = ['Semua', 'Linguistik Dasar', 'Fonologi', 'Semantik', 'Morfologi'];

const GLOSSARY = [
  {
    id: 'bahasa',
    term: 'Bahasa',
    term_en: 'Language',
    category: 'Linguistik Dasar',
    definition: 'Sistem komunikasi terstruktur yang digunakan oleh suatu kelompok masyarakat, terdiri dari tata bahasa, kosakata, dan pola pengucapan yang disepakati bersama.',
    example: 'Bahasa Bugis dituturkan oleh sekitar 5 juta penutur di Sulawesi Selatan dan beberapa wilayah perantauan.',
    note: 'Sebuah isolek diklasifikasikan sebagai "bahasa" (bukan dialek) jika persentase perbedaan dialektometrinya ≥ 81% dibanding isolek lain.',
  },
  {
    id: 'dialek',
    term: 'Dialek',
    term_en: 'Dialect',
    category: 'Linguistik Dasar',
    definition: 'Variasi regional atau sosial dari sebuah bahasa yang berbeda dalam pengucapan, kosakata, atau tata bahasa, namun masih dapat saling dipahami antar penuturnya.',
    example: 'Bahasa Massenrempulu memiliki lima dialek: Endekan, Maroangin, Bungin, Duri, dan Maiwa — masing-masing dengan ciri khas bunyi yang berbeda.',
    note: 'Batas antara "bahasa" dan "dialek" tidak selalu murni linguistik — faktor politik dan identitas budaya juga berperan.',
  },
  {
    id: 'kelas-kata',
    term: 'Kelas Kata',
    term_en: 'Part of Speech',
    category: 'Linguistik Dasar',
    definition: 'Kategorisasi kata berdasarkan fungsi dan perilaku gramatikalnya dalam kalimat. Delapan kelas utama: (1) Kata Benda / Nomina — orang, tempat, benda, konsep; (2) Kata Kerja / Verba — tindakan atau keadaan; (3) Kata Sifat / Adjektiva — sifat atau kualitas; (4) Kata Ganti / Pronomina — pengganti kata benda (saya, kamu, mereka); (5) Kata Bilangan / Numeralia — angka dan urutan; (6) Kata Keterangan / Adverbia — memodifikasi verba atau adjektiva (sudah, sangat, tidak); (7) Partikel — kata fungsi gramatikal tanpa kategori kelas yang tegas, sangat umum dalam bahasa Austronesia; (8) Kata Seru / Interjeksi — ungkapan ekspresif (oh!, aduh!, hei!).',
    example: 'Distribusi 50 kata Bugis (La Akmale): ~19 nomina (ambo\', bale, janci), ~10 adjektiva (barani, mabelo, acca), ~9 numeralia (siddi s.d. seppulo), ~8 verba (lao, manre, cemme), ~4 pronomina & adverbia (iko, dena\'). Target distribusi Aksarantara per bahasa: 18 nomina · 15 verba · 12 adjektiva · 5 numeralia.',
    note: 'Bahasa Austronesia seperti Bugis, Minangkabau, dan Konjo memiliki sistem pronomina dan partikel yang kaya — mencatat kelas kata dengan tepat membantu peneliti membandingkan tata bahasa antar bahasa.',
  },
  {
    id: 'penutur-asli',
    term: 'Penutur Asli',
    term_en: 'Native Speaker',
    category: 'Linguistik Dasar',
    definition: 'Seseorang yang memperoleh dan menggunakan sebuah bahasa sejak kecil sebagai bahasa pertamanya (bahasa ibu), sehingga memiliki intuisi alami terhadap tata bahasa dan nuansanya.',
    example: 'Rekaman "kumande" (makan) dikontribusikan oleh Puang Tato, 68 tahun, penutur asli Massenrempulu dari Baraka, Enrekang.',
    note: null,
  },
  {
    id: 'pelafalan',
    term: 'Pelafalan',
    term_en: 'Pronunciation',
    category: 'Fonologi',
    definition: 'Cara sebuah kata atau bahasa diucapkan, mencakup bunyi, tekanan suku kata, dan intonasi. Dalam arsip ini, pelafalan dicatat menggunakan simbol IPA (International Phonetic Alphabet).',
    example: 'Kata "mappoji" dilafalkan /mapˈpod͡ʒi/ — bukan /ma-po-ji/ sebagaimana terbaca secara harfiah.',
    note: 'Jika kamu tidak familiar dengan IPA, cukup tuliskan pelafalan seperti cara kamu mengucapkannya dalam tanda kurung, mis. (map-PO-ji).',
  },
  {
    id: 'fonem',
    term: 'Fonem',
    term_en: 'Phoneme',
    category: 'Fonologi',
    definition: 'Unit bunyi terkecil dalam sebuah bahasa yang mampu membedakan makna kata. Bukan semua bunyi adalah fonem — hanya bunyi yang mengubah makna.',
    example: 'Dalam Bahasa Bugis, /ŋ/ (seperti bunyi "ng" dalam "nganga") adalah fonem tersendiri yang membedakan kata "nganre" (makan, Konjo) dari bunyi lainnya.',
    note: 'Fonem berbeda dari "huruf" — satu huruf bisa mewakili beberapa fonem, dan satu fonem bisa ditulis dengan beberapa huruf.',
  },
  {
    id: 'suku-kata',
    term: 'Suku Kata',
    term_en: 'Syllable',
    category: 'Fonologi',
    definition: 'Unit pengucapan yang terdiri dari satu bunyi vokal, dengan atau tanpa konsonan di sekitarnya. Setiap suku kata mengandung tepat satu puncak bunyi (vokal).',
    example: 'Kata "mappoji" terdiri dari tiga suku kata: map · po · ji. Kata "sipakatau" terdiri dari lima: si · pa · ka · ta · u.',
    note: null,
  },
  {
    id: 'glottal-stop',
    term: 'Konsonan Hamzah',
    term_en: 'Glottal Stop',
    category: 'Fonologi',
    definition: 'Bunyi yang dihasilkan dengan menutup sejenak aliran udara di tenggorokan (glotis), lalu melepaskannya secara tiba-tiba. Ditandai dengan simbol /ʔ/ dalam IPA, atau apostrof (ʼ) dalam penulisan.',
    example: "Kata \"siri'\" dalam Bahasa Bugis dan Konjo diakhiri dengan glottal stop — bunyi penghentian yang terasa di tenggorokan, bukan di bibir.",
    note: 'Glottal stop sangat umum dalam bahasa-bahasa daerah Indonesia dan sering terlewat oleh pencatat non-penutur asli, padahal perubahannya bisa mengubah makna kata.',
  },
  {
    id: 'intonasi',
    term: 'Intonasi',
    term_en: 'Intonation',
    category: 'Fonologi',
    definition: 'Pola naik-turunnya nada suara dalam tuturan yang menyampaikan makna, emosi, atau struktur gramatikal — seperti membedakan pernyataan dari pertanyaan.',
    example: 'Dalam Bahasa Minangkabau, kalimat tanya sering ditandai dengan intonasi naik di akhir tuturan tanpa kata tanya tambahan.',
    note: null,
  },
  {
    id: 'tekanan',
    term: 'Tekanan',
    term_en: 'Stress',
    category: 'Fonologi',
    definition: 'Penekanan pada suku kata tertentu dalam sebuah kata, membuatnya terdengar lebih keras, lebih panjang, atau lebih tinggi nadanya dibanding suku kata lain.',
    example: 'Dalam kata "kumande" (makan, Massenrempulu), tekanan jatuh pada suku kata kedua: ku·MAN·de.',
    note: null,
  },
  {
    id: 'makna',
    term: 'Makna',
    term_en: 'Meaning',
    category: 'Semantik',
    definition: 'Apa yang dikomunikasikan oleh sebuah kata atau ungkapan. Makna terbagi dua: (1) Denotatif — makna kamus/harfiah; (2) Kontekstual — makna yang dipahami dari situasi budaya, sosial, atau percakapan.',
    example: "Kata \"siri'\" secara denotatif berarti 'malu', namun secara kontekstual mencakup seluruh sistem nilai kehormatan, harga diri, dan tanggung jawab sosial dalam masyarakat Bugis dan Makassar.",
    note: 'Dalam arsip ini, selalu sertakan makna kontekstual jika kata memiliki beban budaya yang tidak tertangkap oleh terjemahan harfiah.',
  },
  {
    id: 'contoh-penggunaan',
    term: 'Contoh Penggunaan',
    term_en: 'Usage Example',
    category: 'Semantik',
    definition: 'Kalimat atau frasa yang menunjukkan bagaimana sebuah kata digunakan dalam konteks alaminya — bukan hanya definisi, tapi cara nyata penutur menggunakannya dalam percakapan.',
    example: 'Alih-alih hanya mencatat "mappoji = makan", sertakan contoh: "Iko mappoji ki?" (Apakah Anda sudah makan?) — memperlihatkan penggunaan bentuk halus dalam pertanyaan.',
    note: 'Contoh penggunaan adalah salah satu data paling berharga dalam arsip bahasa. Tanpanya, kita hanya mendokumentasikan kata, bukan bahasa.',
  },
  {
    id: 'register',
    term: 'Formal vs Informal',
    term_en: 'Register',
    category: 'Semantik',
    definition: 'Tingkat kesopanan atau konteks sosial dalam penggunaan bahasa. Bahasa formal digunakan dalam situasi resmi atau kepada orang yang dihormati; informal untuk percakapan sehari-hari.',
    example: 'Dalam Bahasa Bugis, "mappoji" adalah bentuk halus (formal) yang digunakan saat berbicara kepada orang yang lebih tua. Bentuk netralnya berbeda berdasarkan hierarki sosial pembicara.',
    note: 'Banyak bahasa daerah Indonesia memiliki sistem register yang sangat halus. Mencatat register dengan tepat adalah bagian dari dokumentasi yang bertanggung jawab.',
  },
  {
    id: 'kata-serapan',
    term: 'Kata Serapan',
    term_en: 'Loanword',
    category: 'Morfologi',
    definition: 'Kata yang diadopsi dari bahasa lain dengan sedikit atau tanpa perubahan bentuk. Kata serapan mencerminkan sejarah kontak budaya antar masyarakat.',
    example: 'Kata "buku" dalam Bahasa Indonesia diserap dari bahasa Belanda "boek". Banyak bahasa daerah menyerap kata dari bahasa Arab, Melayu, Portugis, dan Belanda sesuai sejarah masing-masing.',
    note: null,
  },
  {
    id: 'reduplikasi',
    term: 'Reduplikasi',
    term_en: 'Reduplication',
    category: 'Morfologi',
    definition: 'Proses pembentukan kata dengan mengulangi seluruh atau sebagian bentuk dasar kata untuk menghasilkan makna baru — seperti jamak, intensitas, ketidakpastian, atau keserupaan.',
    example: '"Buku-buku" (banyak buku) adalah reduplikasi penuh dalam Bahasa Indonesia. Dalam bahasa daerah, reduplikasi sering menghasilkan makna yang jauh lebih kaya dan bernuansa.',
    note: 'Reduplikasi adalah fitur morfologis yang sangat umum dalam rumpun bahasa Austronesia — termasuk hampir semua bahasa daerah Indonesia.',
  },
];

const DO_LIST = [
  'Rekam langsung dari penutur asli, bukan dari ingatan atau sumber sekunder.',
  'Sertakan contoh kalimat nyata yang pernah diucapkan penutur.',
  'Catat dialek dan desa/wilayah asal penutur secara spesifik.',
  'Cantumkan usia penutur — variasi antar generasi adalah data penting.',
  'Jelaskan nuansa budaya jika kata tidak bisa diterjemahkan secara harfiah.',
  'Gunakan IPA untuk pelafalan jika memungkinkan, atau notasi fonetik sederhana jika tidak.',
];

const DONT_LIST = [
  'Jangan andalkan Google Translate sebagai sumber utama atau satu-satunya.',
  'Jangan hanya mencatat makna harfiah jika kata memiliki beban budaya.',
  'Jangan menebak pelafalan — jika tidak yakin, biarkan kolom kosong.',
  'Jangan menghilangkan glottal stop (ʼ) atau simbol bunyi lain dalam penulisan.',
  'Jangan kirim tanpa izin dari penutur — rekaman adalah milik komunitas.',
  'Jangan campurkan dialek berbeda dalam satu entri tanpa keterangan.',
];

const QUALITY_STANDARDS = [
  { icon: 'check', title: 'Validasi Penutur Asli', desc: 'Setiap entri idealnya dikonfirmasi oleh minimal satu penutur asli dari dialek yang sama. Koordinator wilayah kami melakukan tinjauan sebelum entri dipublikasikan.' },
  { icon: 'waveform', title: 'Audio Lebih Berharga dari Teks', desc: 'Rekaman suara asli penutur jauh lebih akurat dari transliterasi tertulis. Prioritaskan audio kapanpun memungkinkan.' },
  { icon: 'pin', title: 'Spesifisitas Geografis', desc: 'Cantumkan lokasi sedetail mungkin: provinsi, kabupaten, kecamatan, desa. Variasi antardesa dalam satu dialek adalah data linguistik yang berharga.' },
  { icon: 'arrow', title: 'Konteks Lebih Penting dari Terjemahan', desc: 'Terjemahan adalah pintu masuk, bukan tujuan. Sertakan konteks budaya, sosial, dan situasional — terutama untuk kata yang tidak ada padanannya dalam Bahasa Indonesia.' },
];

const PERFECT_ENTRY = {
  word: "siri'",
  phonetic: '/siɾiʔ/',
  language: 'Bugis',
  dialect: 'Wajo',
  region: 'Sengkang, Kab. Wajo, Sulawesi Selatan',
  type: 'Kata (Noun / Konsep Abstrak)',
  meaning_den: 'Rasa malu; perasaan tidak enak karena melanggar norma sosial.',
  meaning_ctx: 'Sistem nilai kehormatan, harga diri, dan tanggung jawab sosial yang menjadi landasan etika masyarakat Bugis-Makassar. Melindungi siri\' adalah kewajiban kolektif.',
  usage: "\"Narekko de\\'na isseng siri\\', de\\'na tauwe.\" — Jika seseorang tidak mengenal siri\\', ia bukan manusia lagi. (peribahasa Bugis)",
  speaker: 'Puang Hamid, 66 tahun',
  register: 'Formal / Seremonial',
  notes: 'Konsep siri\' tidak dapat diterjemahkan secara utuh ke dalam satu kata Bahasa Indonesia. Ia mencakup kehormatan, rasa malu, harga diri, dan tanggung jawab kolektif sekaligus. Dokumentasi konsep seperti ini memerlukan konteks budaya yang mendalam.',
};

/* ── Components ────────────────────────────────────────────────── */

function TermCard({ term }) {
  const [open, setOpen] = useState(false);
  const CAT_COLORS = {
    'Linguistik Dasar': 'var(--blue)',
    'Fonologi': 'var(--purple)',
    'Semantik': 'var(--green)',
    'Morfologi': 'var(--orange)',
  };
  const color = CAT_COLORS[term.category] ?? 'var(--n-300)';

  return (
    <motion.div
      className="glos-term"
      style={{ borderLeftColor: color }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
    >
      <button className="glos-term-head" onClick={() => setOpen(o => !o)}>
        <div className="gth-left">
          <span className="gth-term">{term.term}</span>
          <span className="gth-en">{term.term_en}</span>
          <span className="gth-cat" style={{ color, background: color + '18', borderColor: color + '40' }}>{term.category}</span>
        </div>
        <span className={`gth-chevron ${open ? 'open' : ''}`}>
          <Icon name="arrow" size={14} style={{ transform: open ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 200ms' }} />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="glos-term-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <p className="gtb-def">{term.definition}</p>
            <div className="gtb-example">
              <span className="gtb-ex-label">Contoh</span>
              <span>{term.example}</span>
            </div>
            {term.note && (
              <div className="gtb-note">
                <Icon name="info" size={13} />
                <span>{term.note}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Page content ───────────────────────────────────────────────── */

export default function GlossaryContent() {
  const [activeSection, setActiveSection] = useState('pengantar');
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('Semua');

  const filteredTerms = GLOSSARY.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.term.toLowerCase().includes(q) || t.term_en.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q);
    const matchCat = activeCat === 'Semua' || t.category === activeCat;
    return matchSearch && matchCat;
  });

  const scrollTo = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <Topbar />
      <main>

        {/* Hero */}
        <div className="glos-hero">
          <div className="container">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="kicker"><span className="k-num">—</span> Panduan & Referensi</div>
              <h1 className="glos-title">Glosarium & <span className="hl-green">Panduan Kontribusi</span></h1>
              <p className="glos-sub">
                Referensi istilah linguistik, standar penulisan entri, dan panduan untuk kontributor.
                Dirancang agar mudah dipahami — tanpa latar belakang akademis sekalipun.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Sticky Nav */}
        <div className="glos-nav-wrap">
          <div className="container">
            <nav className="glos-nav">
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  className={`glos-nav-btn ${activeSection === s.id ? 'active' : ''}`}
                  onClick={() => scrollTo(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="container glos-body">

          {/* ── Section A: Pengantar ── */}
          <section id="pengantar" className="glos-section">
            <div className="gs-head">
              <div className="gs-num">A</div>
              <h2 className="gs-title">Mengapa Bahasa Daerah Penting?</h2>
            </div>

            <div className="glos-intro-grid">
              <div className="glos-intro-text">
                <p>Indonesia adalah rumah bagi lebih dari <strong>700 bahasa daerah</strong> — salah satu kekayaan linguistik terbesar di dunia. Namun setiap tahun, puluhan bahasa ini kehilangan penutur terakhir mereka. Ketika sebuah bahasa punah, yang hilang bukan sekadar kosakata — melainkan cara pandang, sistem nilai, dan pengetahuan lokal yang tidak bisa direkonstruksi.</p>
                <p>Aksarantara hadir untuk mendokumentasikan bahasa-bahasa ini sebelum terlambat: merekam suara penutur asli, menyimpan kata dan makna, serta membuka arsip ini untuk semua orang.</p>
              </div>
              <div className="glos-role-cards">
                <div className="glos-role-card">
                  <div className="grc-icon" style={{ background: 'var(--blue)' + '18', color: 'var(--blue)' }}>
                    <Icon name="waveform" size={20} />
                  </div>
                  <div className="grc-title">Pengguna Umum</div>
                  <ul className="grc-list">
                    <li>Jelajahi kata dan frasa dari 5 bahasa pilot</li>
                    <li>Dengarkan rekaman suara penutur asli</li>
                    <li>Temukan makna budaya di balik setiap kata</li>
                    <li>Bagikan entri yang kamu temukan</li>
                  </ul>
                </div>
                <div className="glos-role-card">
                  <div className="grc-icon" style={{ background: 'var(--green)' + '18', color: 'var(--green)' }}>
                    <Icon name="mic" size={20} />
                  </div>
                  <div className="grc-title">Kontributor</div>
                  <ul className="grc-list">
                    <li>Kirim kata baru dari bahasa yang kamu kuasai</li>
                    <li>Rekam pengucapan langsung dari penutur asli</li>
                    <li>Lengkapi konteks budaya dan contoh kalimat</li>
                    <li>Validasi entri yang sudah ada</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* ── Section B: Glosarium ── */}
          <section id="glosarium" className="glos-section">
            <div className="gs-head">
              <div className="gs-num">B</div>
              <h2 className="gs-title">Glosarium Linguistik</h2>
            </div>
            <p className="gs-desc">Definisi istilah yang digunakan dalam arsip ini. Klik setiap istilah untuk membaca penjelasan lengkapnya.</p>

            {/* Search + Filter */}
            <div className="glos-controls">
              <div className="glos-search-wrap">
                <Icon name="search" size={16} />
                <input
                  className="glos-search"
                  placeholder="Cari istilah…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="glos-cats">
                {CATEGORIES.map(c => (
                  <button key={c} className={`chip sm ${activeCat === c ? 'active' : ''}`} onClick={() => setActiveCat(c)}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Terms */}
            <div className="glos-terms">
              <AnimatePresence mode="popLayout">
                {filteredTerms.length > 0 ? filteredTerms.map(t => (
                  <TermCard key={t.id} term={t} />
                )) : (
                  <motion.p key="empty" className="glos-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    Tidak ada istilah yang cocok dengan pencarian ini.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* ── Section C: Panduan Kontribusi ── */}
          <section id="kontribusi" className="glos-section">
            <div className="gs-head">
              <div className="gs-num">C</div>
              <h2 className="gs-title">Panduan Kontribusi</h2>
            </div>
            <p className="gs-desc">Cara menulis entri yang baik, akurat, dan bermanfaat bagi peneliti, pelajar, dan komunitas penutur.</p>

            <div className="glos-step-grid">
              {[
                { n: '01', title: 'Tulis kata dengan ejaan yang tepat', body: 'Gunakan ejaan yang paling umum digunakan penutur asli. Jika ada variasi ejaan, cantumkan alternatifnya. Untuk bunyi yang tidak ada padanannya dalam alfabet Latin, gunakan simbol IPA atau apostrof (ʼ) untuk glottal stop.' },
                { n: '02', title: 'Catat pelafalan', body: 'Tuliskan cara pengucapan menggunakan IPA jika kamu familiar, atau notasi fonetik sederhana dalam tanda kurung, misalnya (map-PO-ji). Rekaman audio jauh lebih berharga — gunakan fitur rekam jika memungkinkan.' },
                { n: '03', title: 'Berikan makna yang kaya, bukan terjemahan literal', body: 'Terjemahan adalah pintu masuk, bukan tujuan. Jelaskan nuansa budaya, register (formal/informal), dan konteks penggunaan. Kata "siri\'" tidak cukup diterjemahkan sebagai "malu" — ia butuh penjelasan budaya.' },
                { n: '04', title: 'Sertakan contoh kalimat nyata', body: 'Gunakan kalimat yang benar-benar pernah diucapkan penutur, bukan kalimat buatan. Contoh nyata jauh lebih berharga untuk penelitian linguistik dan pembelajaran bahasa.' },
                { n: '05', title: 'Cantumkan dialek dan wilayah asal', body: 'Bahasa yang sama bisa berbeda signifikan antar dialek. Catat wilayah asal penutur sedetail mungkin: provinsi, kabupaten, kecamatan, desa. Ini data geografis yang penting untuk pemetaan bahasa.' },
                { n: '06', title: 'Dapatkan izin dari penutur', body: 'Rekaman suara dan informasi budaya adalah milik komunitas. Pastikan kamu mendapatkan izin lisan dari penutur sebelum mengirimkan kontribusi. Arsip ini beroperasi di bawah lisensi CC-BY-SA.' },
              ].map((s, i) => (
                <motion.div
                  key={s.n}
                  className="glos-step-card"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                >
                  <div className="gsc-num">{s.n}</div>
                  <div className="gsc-title">{s.title}</div>
                  <p className="gsc-body">{s.body}</p>
                </motion.div>
              ))}
            </div>

            {/* Do / Don't */}
            <div className="do-dont-grid">
              <div className="dd-col do">
                <div className="dd-head">
                  <Icon name="check" size={16} />
                  Lakukan
                </div>
                <ul>
                  {DO_LIST.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
              <div className="dd-col dont">
                <div className="dd-head">
                  <Icon name="close" size={16} />
                  Hindari
                </div>
                <ul>
                  {DONT_LIST.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
            </div>
          </section>

          {/* ── Section D: Standar Data ── */}
          <section id="standar" className="glos-section">
            <div className="gs-head">
              <div className="gs-num">D</div>
              <h2 className="gs-title">Standar Kualitas Data</h2>
            </div>
            <p className="gs-desc">Setiap entri yang masuk ke arsip ini melewati tinjauan koordinator wilayah. Berikut prinsip yang kami pegang.</p>

            <div className="glos-qual-grid">
              {QUALITY_STANDARDS.map((q, i) => (
                <motion.div
                  key={i}
                  className="glos-qual-card"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <div className="gqc-icon">
                    <Icon name={q.icon} size={20} />
                  </div>
                  <div className="gqc-title">{q.title}</div>
                  <p className="gqc-desc">{q.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="glos-pipeline">
              <div className="gp-label">Alur tinjauan entri</div>
              <div className="gp-steps">
                {['Dikirim kontributor', 'Tinjauan koordinator', 'Validasi penutur', 'Dipublikasikan'].map((s, i, arr) => (
                  <div key={i} className="gp-step">
                    <div className="gps-dot">{i + 1}</div>
                    <div className="gps-label">{s}</div>
                    {i < arr.length - 1 && <div className="gps-line" />}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Section E: Contoh Entri Sempurna ── */}
          <section id="contoh" className="glos-section">
            <div className="gs-head">
              <div className="gs-num">E</div>
              <h2 className="gs-title">Contoh Entri Sempurna</h2>
            </div>
            <p className="gs-desc">Inilah tampilan entri berkualitas tinggi — lengkap dengan makna kontekstual, pelafalan, contoh penggunaan, dan catatan budaya.</p>

            <div className="perfect-entry">
              <div className="pe-header">
                <div className="pe-word">{PERFECT_ENTRY.word}</div>
                <div className="pe-phonetic">{PERFECT_ENTRY.phonetic}</div>
                <div className="pe-tags">
                  <span className="pe-tag blue">{PERFECT_ENTRY.language}</span>
                  <span className="pe-tag purple">Dialek {PERFECT_ENTRY.dialect}</span>
                  <span className="pe-tag green">{PERFECT_ENTRY.type}</span>
                </div>
              </div>

              <div className="pe-body">
                <div className="pe-row">
                  <span className="pe-key">Wilayah</span>
                  <span className="pe-val">{PERFECT_ENTRY.region}</span>
                </div>
                <div className="pe-row">
                  <span className="pe-key">Makna Denotatif</span>
                  <span className="pe-val">{PERFECT_ENTRY.meaning_den}</span>
                </div>
                <div className="pe-row highlight">
                  <span className="pe-key">Makna Kontekstual</span>
                  <span className="pe-val">{PERFECT_ENTRY.meaning_ctx}</span>
                </div>
                <div className="pe-row">
                  <span className="pe-key">Contoh Penggunaan</span>
                  <span className="pe-val pe-quote">{PERFECT_ENTRY.usage}</span>
                </div>
                <div className="pe-row">
                  <span className="pe-key">Penutur</span>
                  <span className="pe-val">{PERFECT_ENTRY.speaker}</span>
                </div>
                <div className="pe-row">
                  <span className="pe-key">Register</span>
                  <span className="pe-val">{PERFECT_ENTRY.register}</span>
                </div>
                <div className="pe-row">
                  <span className="pe-key">Catatan</span>
                  <span className="pe-val pe-note">{PERFECT_ENTRY.notes}</span>
                </div>
              </div>
            </div>

            <div className="glos-cta">
              <p>Siap berkontribusi? Ikuti panduan di atas dan kirimkan entri pertamamu.</p>
              <Link href="/contribute" className="btn-primary">
                <Icon name="mic" size={16} /> Mulai Kontribusi
              </Link>
              <Link href="/archive" className="btn-ghost">
                Jelajahi Arsip <Icon name="arrow" size={14} />
              </Link>
            </div>
          </section>

          {/* ── Section F: Panduan IPA ── */}
          <section id="ipa" className="glos-section">
            <div className="gs-head">
              <div className="gs-num">F</div>
              <h2 className="gs-title">Panduan IPA</h2>
            </div>
            <p className="gs-desc">Simbol fonetik yang paling sering digunakan dalam bahasa-bahasa daerah pilot Aksarantara. Tidak perlu hafal semuanya — fokus pada simbol yang relevan dengan bahasa yang kamu dokumentasikan.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

              {/* Vowels */}
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Vokal</div>
                <div style={{ border: '1.5px solid var(--n-100)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  {IPA_VOWELS.map((row, i) => (
                    <div key={i} className="glos-ipa-row" style={{ borderBottom: i < IPA_VOWELS.length - 1 ? '1px solid var(--n-100)' : 'none', background: i % 2 === 0 ? 'var(--white)' : 'var(--n-50)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--purple)' }}>{row.sym}</span>
                      <span style={{ fontSize: 13, color: 'var(--n-700)', paddingRight: 16 }}>{row.desc}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--n-500)' }}>{row.ex}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special consonants */}
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Konsonan Khusus</div>
                <div style={{ border: '1.5px solid var(--n-100)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  {IPA_CONSONANTS.map((row, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 0, borderBottom: i < IPA_CONSONANTS.length - 1 ? '1px solid var(--n-100)' : 'none', padding: '10px 16px', background: i % 2 === 0 ? 'var(--white)' : 'var(--n-50)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--purple)' }}>{row.sym}</span>
                      <span style={{ fontSize: 13, color: 'var(--n-700)', paddingRight: 16 }}>{row.desc}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--n-500)' }}>{row.ex}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Markers */}
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Penanda Tekanan & Panjang</div>
                <div style={{ border: '1.5px solid var(--n-100)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
                  {IPA_MARKERS.map((row, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr', gap: 0, borderBottom: i < IPA_MARKERS.length - 1 ? '1px solid var(--n-100)' : 'none', padding: '10px 16px', background: i % 2 === 0 ? 'var(--white)' : 'var(--n-50)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--purple)' }}>{row.sym}</span>
                      <span style={{ fontSize: 13, color: 'var(--n-700)', paddingRight: 16 }}>{row.desc}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--n-500)' }}>{row.ex}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tip box */}
              <div style={{ padding: '16px 20px', borderRadius: 'var(--radius)', background: 'var(--purple)' + '0d', border: '1.5px solid ' + 'var(--purple)' + '30', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <Icon name="info" size={15} style={{ color: 'var(--purple)', flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 13, color: 'var(--n-700)', lineHeight: 1.7 }}>
                  <strong style={{ color: 'var(--ink)' }}>Tidak familiar dengan IPA?</strong> Tidak apa-apa. Tuliskan pelafalan seperti cara kamu mengucapkannya dalam tanda kurung — mis. <span style={{ fontFamily: 'var(--font-mono)' }}>(map-PO-ji)</span> atau <span style={{ fontFamily: 'var(--font-mono)' }}>(si-RI-prime)</span>. Rekaman audio selalu lebih berharga dari notasi tertulis.
                </div>
              </div>

            </div>
          </section>

        </div>
      </main>
      <Footer />
    </>
  );
}
