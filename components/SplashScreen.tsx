import React from 'react';

interface SplashScreenProps {
  onDismiss: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onDismiss }) => {

  const handleGetStartedClick = () => {
    onDismiss();
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-cyan-600 via-teal-500 to-emerald-400 text-white p-8 justify-around text-center animate-fade-in-scale">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to Mayra Khata</h1>
        <p className="mt-4 text-base text-cyan-100 max-w-xs mx-auto">
          Your complete solution for managing customers, stock, and daily finances.
        </p>
      </div>

      <div className="pb-8">
        <button
          onClick={handleGetStartedClick}
          className="w-full max-w-xs mx-auto py-3 px-6 bg-white text-teal-600 font-semibold rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out focus:outline-none focus:ring-4 focus:ring-teal-200"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default SplashScreen;