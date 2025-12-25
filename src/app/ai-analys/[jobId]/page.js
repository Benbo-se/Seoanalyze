import Header from '@/components/common/Header';
import AiAnalysisResults from '@/components/ai-analysis/AiAnalysisResults';

export const metadata = {
  title: 'AI SEO-Analys Resultat | SEO Analyze',
  description: 'Din professionella SEO-rapport med konkurrentjämförelse och AI-genererade rekommendationer.',
};

export default function AiAnalysisResultPage({ params }) {
  return (
    <div>
      <Header />
      <AiAnalysisResults jobId={params.jobId} />
    </div>
  );
}
