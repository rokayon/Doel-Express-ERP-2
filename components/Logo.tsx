
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'light' | 'dark';
  siteName?: string;
  siteLogo?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  className = "w-12 h-12", 
  showText = false, 
  variant = 'light',
  siteName = 'Doel Express',
  siteLogo = "https://files.oaiusercontent.com/file-jI6tY5R4u3E2W1Q0P9O8N7M6?se=2025-02-21T12%3A02%3A34Z&sp=r&sv=2024-08-04&sr=b&rscc=max-age%3D604800%2C%20immutable%2C%20private&rscd=attachment%3B%20filename%3D7f7e9b2a-1e3d-4c5b-8a9c-0d1e2f3g4h5i.webp&sig=m2XF8%2B7j/QW3o0RNo8/8GzQJ2/G/Xf/P0VqO8x8r7Y%3D"
}) => {
  const nameParts = siteName.split(' ');
  const firstPart = nameParts[0];
  const restPart = nameParts.slice(1).join(' ');

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative aspect-square h-full flex items-center justify-center bg-white rounded-full p-0.5 shadow-lg border-2 ${variant === 'dark' ? 'border-blue-500/30' : 'border-slate-100'}`}>
        <img 
          src={siteLogo} 
          alt={siteName} 
          className="w-full h-full object-contain rounded-full"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/3448/3448339.png";
          }}
        />
      </div>
      {showText && (
        <div className={`flex flex-col border-l pl-3 ${variant === 'dark' ? 'border-slate-700' : 'border-slate-200'}`}>
          <span className={`font-black text-sm leading-tight tracking-tighter uppercase italic ${variant === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            {firstPart} <span className="text-blue-500">{restPart}</span>
          </span>
          <span className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em]">Fleet Management</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
