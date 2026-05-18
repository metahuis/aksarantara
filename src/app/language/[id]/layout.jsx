import { LANGUAGES } from '@/data';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const lang = LANGUAGES.find(l => l.id === id);
  if (!lang) return {};
  return {
    title: `Bahasa ${lang.name}`,
    description: `Arsip bahasa ${lang.name} — ${lang.speakers} penutur, ${lang.region}. Telusuri kata, frasa, peribahasa, dan rekaman suara penutur asli.`,
    openGraph: {
      title: `Bahasa ${lang.name} — Aksarantara`,
      description: `Dokumentasi bahasa ${lang.name} dari ${lang.region} dengan rekaman suara penutur asli.`,
    },
  };
}

export default function LanguageLayout({ children }) { return children; }
