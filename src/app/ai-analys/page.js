import Header from '@/components/common/Header';
import AiAnalysisLanding from '@/components/ai-analysis/AiAnalysisLanding';

export const metadata = {
  title: 'AI-Driven SEO Analys | SEO Analyze',
  description: 'Få en professionell SEO-rapport med konkurrentjämförelse och AI-genererad handlingsplan. Helt gratis under beta.',
};

export default function AiAnalysPage() {
  return (
    <div>
      <Header />
      <AiAnalysisLanding />
    </div>
  );
}
