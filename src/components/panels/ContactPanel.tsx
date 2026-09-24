import { useState } from 'react';

const EMAIL = 'nikhiljatale@gmail.com';

export function ContactPanel() {
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can be unavailable (permissions, insecure context) —
      // the mailto link right next to this still works either way.
    }
  }

  return (
    <div className="flex flex-col items-center text-center gap-5 pt-4">
      <div className="flex items-center gap-2">
        <a href={`mailto:${EMAIL}`} className="text-sm text-[#3A5F8A] hover:underline">
          {EMAIL}
        </a>
        <button
          onClick={copyEmail}
          className="text-[10px] px-2 py-1 rounded bg-white/10 text-[#CCCCCC] hover:bg-white/20 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <a
        href="https://linkedin.com/in/nikhil-jatale"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-[#3A5F8A] hover:underline"
      >
        linkedin.com/in/nikhil-jatale
      </a>
      <a
        href="https://github.com/njtales"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-[#3A5F8A] hover:underline"
      >
        github.com/njtales
      </a>
      <p className="text-sm text-[#AABBCC]">London, UK 🇬🇧</p>
      <a
        href="#"
        className="mt-2 text-sm px-5 py-2.5 rounded-full bg-[#3A5F8A] text-white hover:bg-[#4A6F9A] transition-colors"
      >
        Download CV
      </a>
    </div>
  );
}
