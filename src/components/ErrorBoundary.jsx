import { Component } from "react";

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
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
          <div className="text-center">
            <p className="text-5xl mb-4">😵</p>
            <h1 className="text-xl font-bold text-navy mb-2">Something went wrong</h1>
            <p className="text-slate-500 mb-6">Что-то пошло не так</p>
            <button
              onClick={() => {
                window.location.href = "/";
              }}
              className="px-6 py-3 rounded-xl font-semibold text-navy-dark bg-gradient-to-r from-gold-light to-gold shadow-lg shadow-gold/30 hover:shadow-gold/50 transition-all duration-200"
            >
              Go Home / На главную
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
