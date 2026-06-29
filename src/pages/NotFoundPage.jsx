import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import { usePageTitle } from "../hooks/usePageTitle";

export default function NotFoundPage() {
  usePageTitle("Page Not Found");
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center animate-fade-in">
        <div className="flex justify-center mb-4">
          <Logo size="medium" />
        </div>
        <h1 className="text-5xl font-extrabold text-navy mb-2">404</h1>
        <p className="text-slate-500 mb-8">Page not found / Страница не найдена</p>
        <Link
          to="/"
          className="inline-block px-6 py-3 rounded-xl font-semibold text-navy-dark bg-gradient-to-r from-gold-light to-gold shadow-lg shadow-gold/30 hover:shadow-gold/50 hover:-translate-y-0.5 transition-all duration-200"
        >
          Go Home / На главную
        </Link>
      </div>
    </div>
  );
}
