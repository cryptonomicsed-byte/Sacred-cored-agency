
import React from 'react';
import { useStore } from '../store';
import { Dna, ChevronDown, CheckCircle2 } from 'lucide-react';

export const BrandSelector: React.FC = () => {
  const { brands, currentBrand, setBrand } = useStore();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (brands.length === 0) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-black/40 border border-zinc-800 rounded-xl hover:border-brand-500/40 transition-all shadow-inner group"
      >
        <Dna className="w-4 h-4 text-brand-500" />
        <span className="text-xs font-black text-white uppercase tracking-tight truncate max-w-[120px]">
          {currentBrand?.name || 'Select Project'}
        </span>
        <ChevronDown className={`w-4 h-4 text-zinc-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 max-w-[calc(100vw-2rem)] bg-dark-surface border border-dark-border rounded-2xl shadow-2xl z-[100] p-2 animate-in fade-in slide-in-from-top-2 origin-top-right">
          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-3 py-2 border-b border-zinc-800/50 mb-1">Active DNA Sequence</p>
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {brands.map(b => (
              <button 
                key={b.id}
                onClick={() => { setBrand(b); setIsOpen(false); }}
                className={`w-full p-3 text-left rounded-xl text-xs font-bold uppercase flex items-center justify-between hover:bg-brand-900/10 transition-colors ${currentBrand?.id === b.id ? 'text-brand-400 bg-brand-900/5' : 'text-zinc-500'}`}
              >
                <span className="truncate">{b.name}</span>
                {currentBrand?.id === b.id && <CheckCircle2 className="w-4 h-4 text-brand-500" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
