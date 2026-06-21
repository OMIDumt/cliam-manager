import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthProvider } from "@/legacy/contexts/AuthContext";
import { ThemeProvider } from "@/legacy/contexts/ThemeContext";
import App from "@/legacy/App";
import "@/legacy/legacy.css";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClaimAI Manager — سامانه هوشمند تحلیل ادعا و تأخیر پروژه" },
      { name: "description", content: "ClaimAI Manager پلتفرم تخصصی تحلیل ادعا، تأخیر و مدیریت دعاوی پروژه‌های عمرانی با هوش مصنوعی — تهیه لایحه فنی-حقوقی، تحلیل خسارت و بررسی قرارداد." },
      { property: "og:title", content: "ClaimAI Manager — تحلیل هوشمند ادعا و تأخیر پروژه" },
      { property: "og:description", content: "تحلیل ادعا، تأخیر و خسارت پروژه‌های ساخت با هوش مصنوعی؛ تولید لایحه فنی-حقوقی و بررسی قرارداد." },
      { property: "og:url", content: "https://bright-night-manager.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://bright-night-manager.lovable.app/" }],
  }),
  component: Index,
});

function Index() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    document.documentElement.lang = "fa";
    document.documentElement.dir = "rtl";
    document.body.classList.add("theme-ultraPro", "noise-overlay");
    // Tailwind CDN (legacy app relies on utility classes generated at runtime)
    if (!document.getElementById("tw-cdn")) {
      const s = document.createElement("script");
      s.id = "tw-cdn";
      s.src = "https://cdn.tailwindcss.com";
      document.head.appendChild(s);
    }
    if (!document.getElementById("vazir-font")) {
      const l = document.createElement("link");
      l.id = "vazir-font";
      l.rel = "stylesheet";
      l.href =
        "https://fonts.googleapis.com/css2?family=Vazirmatn:wght@100;300;400;500;600;700;800;900&display=swap";
      document.head.appendChild(l);
    }
    // Estedad — modern IRANSans-like Persian font (primary)
    if (!document.getElementById("estedad-font")) {
      const l = document.createElement("link");
      l.id = "estedad-font";
      l.rel = "stylesheet";
      l.href =
        "https://cdn.jsdelivr.net/gh/aminabbasi/estedad-font@1.0.0/dist/Farsi-Digits/Estedad-FD.css";
      document.head.appendChild(l);
    }
    // Sahel — secondary IRANSans-like fallback
    if (!document.getElementById("sahel-font")) {
      const l = document.createElement("link");
      l.id = "sahel-font";
      l.rel = "stylesheet";
      l.href =
        "https://cdn.jsdelivr.net/gh/rastikerdar/sahel-font@v3.4.0/dist/font-face.css";
      document.head.appendChild(l);
    }
  }, []);

  if (!mounted) return null;

  return (
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  );
}
