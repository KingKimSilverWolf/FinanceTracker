/**
 * Bank card design themes for groups
 * Each theme includes gradient colors and a visual identity
 */

export interface CardDesign {
  id: string;
  name: string;
  gradient: string; // Tailwind gradient classes
  textColor: string; // Text color class for card
  accentColor: string; // Accent color for chip/icons
}

export const CARD_DESIGNS: CardDesign[] = [
  {
    id: 'sunset',
    name: 'Sunset',
    gradient: 'bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600',
    textColor: 'text-white',
    accentColor: 'bg-white/20',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    gradient: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600',
    textColor: 'text-white',
    accentColor: 'bg-white/20',
  },
  {
    id: 'forest',
    name: 'Forest',
    gradient: 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600',
    textColor: 'text-white',
    accentColor: 'bg-white/20',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    gradient: 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900',
    textColor: 'text-white',
    accentColor: 'bg-white/20',
  },
  {
    id: 'aurora',
    name: 'Aurora',
    gradient: 'bg-gradient-to-br from-purple-400 via-pink-400 to-rose-500',
    textColor: 'text-white',
    accentColor: 'bg-white/20',
  },
  {
    id: 'royal',
    name: 'Royal',
    gradient: 'bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700',
    textColor: 'text-white',
    accentColor: 'bg-white/20',
  },
  {
    id: 'fire',
    name: 'Fire',
    gradient: 'bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500',
    textColor: 'text-white',
    accentColor: 'bg-white/20',
  },
  {
    id: 'mint',
    name: 'Mint',
    gradient: 'bg-gradient-to-br from-teal-300 via-cyan-400 to-blue-400',
    textColor: 'text-white',
    accentColor: 'bg-white/20',
  },
  {
    id: 'rose',
    name: 'Rose Gold',
    gradient: 'bg-gradient-to-br from-pink-300 via-rose-400 to-amber-400',
    textColor: 'text-white',
    accentColor: 'bg-white/20',
  },
  {
    id: 'carbon',
    name: 'Carbon',
    gradient: 'bg-gradient-to-br from-gray-800 via-gray-900 to-black',
    textColor: 'text-white',
    accentColor: 'bg-white/20',
  },
];

export const DEFAULT_CARD_DESIGN = 'sunset';

export function getCardDesign(designId: string): CardDesign {
  return CARD_DESIGNS.find((d) => d.id === designId) || CARD_DESIGNS[0];
}
