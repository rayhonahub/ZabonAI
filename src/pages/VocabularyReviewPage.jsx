import { RotateCcw } from "lucide-react";
import Navbar from "../components/Navbar";
import { usePageTitle } from "../hooks/usePageTitle";

export default function VocabularyReviewPage() {
  usePageTitle("Такрор");
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #061A1C 0%, #0A2A2E 45%, #0E3A3F 100%)' }}>
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <RotateCcw size={40} style={{ color: '#2DD4BF', margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: 24, fontWeight: 500, marginBottom: 8, color: 'white' }}>Такрор</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Зуд илова мешавад</p>
        </div>
      </div>
    </div>
  );
}
