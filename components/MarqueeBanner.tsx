
import React from 'react';
import { AppSettings } from '../types';

interface MarqueeBannerProps {
  settings: AppSettings | null;
}

export const MarqueeBanner: React.FC<MarqueeBannerProps> = ({ settings }) => {
  if (!settings?.marqueeText) return null;
  
  // Processa il testo per gestire i ritorni a capo come separatori
  const processedText = settings.marqueeText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '')
    .join(' • ');
  
  // Ripetizione del contenuto per un loop fluido
  // Aumentiamo la ripetizione per assicurarci che sia sempre più largo dello schermo
  const content = `${processedText} • `.repeat(20);

  return (
    <div className="w-full bg-amber-400 text-orange-950 py-2.5 overflow-hidden whitespace-nowrap z-[105] relative border-y border-amber-600/30 min-h-[36px]">
      <div className="animate-marquee whitespace-nowrap inline-block font-black uppercase text-[11px] tracking-widest px-4">
        {content}
      </div>
    </div>
  );
};
