// src/ui/loaders/Spinner.tsx
import React from 'react';

const Spinner: React.FC = () => (
  <div className="flex justify-center items-center">
    <div
      className="w-8 h-8 border-4 border-t-transparent border-blue-600 rounded-full animate-spin"
      role="status"
      aria-label="Loading"
    />
  </div>
);

export { Spinner };
export default Spinner;