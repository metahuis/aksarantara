'use client';
import { useRef } from 'react';
import Topbar from '../components/Topbar.jsx';
import Hero from '../components/Hero.jsx';
import Regions from '../components/Regions.jsx';
import ImpactDashboard from '../components/ImpactDashboard.jsx';
import Methodology from '../components/Methodology.jsx';
import DigitalInclusion from '../components/DigitalInclusion.jsx';
import Mitra from '../components/Mitra.jsx';
import Foundation from '../components/Foundation.jsx';
import Contribute from '../components/Contribute.jsx';
import EditorialFeed from '../components/EditorialFeed.jsx';
import FeatureStrip from '../components/FeatureStrip.jsx';
import Footer from '../components/Footer.jsx';

export default function HomePage() {
  const contribRef = useRef();

  return (
    <>
      <Topbar />
      <main>
        <Hero onContribute={() => {
          const el = contribRef.current;
          if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
        }} />
        <EditorialFeed />
        <FeatureStrip />
        <Regions />
        <ImpactDashboard />
        <DigitalInclusion />
        <Methodology />
        <Mitra />
        <Foundation />
        <Contribute ref={contribRef} />
      </main>
      <Footer />
    </>
  );
}
