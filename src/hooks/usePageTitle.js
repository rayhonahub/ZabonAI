import { useEffect } from "react";

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — ZaboniAI` : "ZaboniAI — Learn English with AI";
  }, [title]);
}
