import React from 'react';
// Fix: Added .js extension to import.
import { PlusIcon } from '../Icons.js';

interface FABProps {
  onClick: () => void;
  ariaLabel: string;
}

const FAB: React.FC<FABProps> = ({ onClick, ariaLabel }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gradient-to-br from-teal-500 to-cyan-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-cyan-300 z-10 fab-to-hide"
      aria-label={ariaLabel}
    >
      <PlusIcon className="h-8 w-8" />
    </button>
  );
};

export default FAB;