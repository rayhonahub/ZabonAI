import { Component } from "react";
import { AlertTriangle } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(160deg, #061A1C 0%, #0A2A2E 45%, #0E3A3F 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 6,
            background: 'rgba(251,191,36,0.1)',
            border: '1px solid rgba(251,191,36,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}>
            <AlertTriangle size={28} color="#FBBF24" />
          </div>
          <h1 style={{ color: 'white', fontSize: 22, fontWeight: 500, marginBottom: 8, marginTop: 0 }}>
            Хатогӣ рух дод
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 28, marginTop: 0 }}>
            Мутаасифона, чизе нодуруст шуд
          </p>
          <button
            onClick={() => { window.location.href = '/'; }}
            style={{
              background: '#14B8A6',
              color: '#04231F',
              border: 'none',
              borderRadius: 6,
              padding: '12px 28px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Ба саҳифаи асосӣ
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
