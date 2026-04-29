'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    'welcome_back': 'Welcome Back',
    'create_account': 'Create Account',
    'farmer': 'Farmer',
    'buyer': 'Buyer',
    'email_address': 'Email Address',
    'password': 'Password',
    'log_in': 'Log In',
    'sign_up': 'Sign Up',
    'forgot_password': 'Forgot Password?',
    'or_continue_with': 'Or continue with',
    'trusted_by': 'Trusted by 12,000+ farmers',
    'market_trends': 'Market Trends',
    'smart_insights': 'Smart Farm Insights',
    'activity_center': 'Activity Center',
    'view_details': 'View Details',
    'mark_all_read': 'Mark all read',
    'loading_alerts': 'Loading Alerts...',
  },
  fr: {
    'welcome_back': 'Bon retour',
    'create_account': 'Créer un compte',
    'farmer': 'Agriculteur',
    'buyer': 'Acheteur',
    'email_address': 'Adresse Email',
    'password': 'Mot de passe',
    'log_in': 'Se connecter',
    'sign_up': 'S\'inscrire',
    'forgot_password': 'Mot de passe oublié?',
    'or_continue_with': 'Ou continuer avec',
    'trusted_by': 'Approuvé par plus de 12 000 agriculteurs',
    'market_trends': 'Tendances du Marché',
    'smart_insights': 'Conseils Agricoles',
    'activity_center': 'Centre d\'Activités',
    'view_details': 'Voir Détails',
    'mark_all_read': 'Tout marquer comme lu',
    'loading_alerts': 'Chargement des alertes...',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('app_language') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'fr')) {
      setLanguage(savedLang);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string): string => {
    return (translations[language] as any)[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
