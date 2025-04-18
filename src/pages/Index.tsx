
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Rediriger automatiquement vers la page Dashboard
    navigate('/');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Chargement en cours...</h1>
        <p className="text-xl text-gray-600">Redirection vers le tableau de bord</p>
      </div>
    </div>
  );
};

export default Index;
