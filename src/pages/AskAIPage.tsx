import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import AskAI from './AskAI';

export default function AskAIPage() {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <AskAI open={true} onClose={() => navigate(-1)} />
    </MainLayout>
  );
}
