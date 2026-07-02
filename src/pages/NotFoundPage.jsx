import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import { usePageTitle } from "../hooks/usePageTitle";

export default function NotFoundPage() {
  usePageTitle("Саҳифа ёфт нашуд");
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(160deg, #061A1C 0%, #0A2A2E 45%, #0E3A3F 100%)' }}
    >
      <div className="text-center animate-fade-in">
        <div className="flex justify-center mb-4">
          <Logo size="medium" />
        </div>
        <h1 className="text-5xl font-extrabold mb-2" style={{ color: 'white' }}>404</h1>
        <p className="mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>Саҳифа ёфт нашуд</p>
        <Link
          to="/"
          className="inline-block px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: '#14B8A6', color: '#04231F' }}
        >
          Бозгашт ба саҳифаи асосӣ
        </Link>
      </div>
    </div>
  );
}
