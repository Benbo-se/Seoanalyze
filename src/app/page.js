import Header from '@/components/common/Header';
import HeroSection from '@/components/common/HeroSection';
import FeaturesSections from '@/components/common/FeaturesSections';

// Tillfällig statusbanner - ta bort när problemen är lösta
function StatusBanner() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      borderBottom: '1px solid #f59e0b',
      padding: '12px 20px',
      textAlign: 'center',
      fontSize: '14px',
      color: '#92400e'
    }}>
      <strong>Hej!</strong> Vi har nyligen haft tekniska problem som nu är åtgärdade.
      Om du upplever några problem, vänligen försök igen eller kontakta oss.
      Tack för ditt tålamod.
    </div>
  );
}

export default function Home() {
  return (
    <div>
      <StatusBanner />
      <Header />
      <HeroSection />
      <FeaturesSections />
    </div>
  );
}