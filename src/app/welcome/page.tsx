'use client';

import Link from 'next/link';
import ResponsiveImage from '@/components/ui/ResponsiveImage';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { motion } from 'motion/react';

export default function LandingPage() {
  const { user, isAuthReady } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isAuthReady && user) {
      router.replace('/');
    }
  }, [user, isAuthReady, router]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring' as const,
        damping: 25,
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-background-dark transition-colors duration-300 overflow-x-hidden">
      <motion.nav 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="h-20 px-4 sm:px-8 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 transition-colors bg-white/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-50"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg sm:rounded-xl flex items-center justify-center text-white">
            <span className="material-symbols-outlined fill-1 text-sm sm:text-base">potted_plant</span>
          </div>
          <h1 className="font-bold text-lg sm:text-xl tracking-tight dark:text-white">AgriTech Pro</h1>
        </div>
        <div className="hidden lg:flex items-center gap-8">
          <a href="#features" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">Features</a>
          <a href="#marketplace" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">Marketplace</a>
          <a href="#about" className="text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">About Us</a>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/login" className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white px-2 sm:px-4 py-2 transition-colors">Sign In</Link>
          <Link href="/login" className="bg-primary text-white px-4 sm:px-6 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
            Get Started
          </Link>
        </div>
      </motion.nav>

      <motion.section 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="py-12 sm:py-24 px-4 sm:px-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center"
      >
        <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 text-primary rounded-full mx-auto lg:mx-0 transition-colors">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">New: AI Diagnosis v2.0</span>
          </motion.div>
          <motion.h2 variants={itemVariants} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[1.1] lg:leading-[0.9] dark:text-white transition-colors">
            The Future of <span className="text-primary">Farming</span> is Here.
          </motion.h2>
          <motion.p variants={itemVariants} className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg mx-auto lg:mx-0 transition-colors">
            Empower your farm with AI-driven insights, real-time health monitoring, and a global marketplace for verified produce.
          </motion.p>
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link href="/login" className="bg-primary text-white px-8 py-4 rounded-2xl text-lg font-black shadow-2xl shadow-primary/30 hover:scale-105 transition-all text-center">
              Start Your Farm
            </Link>
            <button className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 px-8 py-4 rounded-2xl text-lg font-black dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center">
              Watch Demo
            </button>
          </motion.div>
          <motion.div variants={itemVariants} className="flex flex-wrap items-center justify-center lg:justify-start gap-6 sm:gap-8 pt-8 border-t border-slate-100 dark:border-slate-800 transition-colors">
            <div>
              <p className="text-2xl sm:text-3xl font-black dark:text-white transition-colors">12k+</p>
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Active Farmers</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black dark:text-white transition-colors">98%</p>
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Diagnosis Accuracy</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black dark:text-white transition-colors">$45M</p>
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Produce Traded</p>
            </div>
          </motion.div>
        </div>
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative mt-8 lg:mt-0"
        >
          <div className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-[2rem] sm:rounded-[4rem] overflow-hidden shadow-2xl relative transition-colors">
            <ResponsiveImage 
              src="https://picsum.photos/seed/agri-hero/1000/1000" 
              alt="Modern farmer using a tablet in a lush green field" 
              className="w-full h-full object-cover"
              baseWidth={1000}
              baseHeight={1000}
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent"></div>
          </div>
          {/* Decorative cards */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="hidden sm:block absolute -bottom-10 -left-10 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 max-w-xs space-y-4 animate-bounce-slow transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 text-primary rounded-xl flex items-center justify-center transition-colors">
                <span className="material-symbols-outlined fill-1">eco</span>
              </div>
              <div>
                <p className="text-sm font-black dark:text-white transition-colors">Crop Health: 94%</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest transition-colors">Field Sector A</p>
              </div>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden transition-colors">
              <div className="h-full bg-primary w-[94%]"></div>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="hidden sm:block absolute -top-10 -right-10 bg-background-dark text-white p-6 rounded-3xl shadow-2xl max-w-xs space-y-4"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-yellow-400 fill-1">wb_sunny</span>
              <p className="text-sm font-black">24°C - Perfect Conditions</p>
            </div>
          </motion.div>
        </motion.div>
      </motion.section>

      <section id="features" className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-900/50 px-4 sm:px-8 transition-colors">
        <div className="max-w-7xl mx-auto space-y-12 sm:space-y-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-4"
          >
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight dark:text-white transition-colors">Everything you need to grow.</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-sm sm:text-base transition-colors">Advanced tools designed for modern agriculture, from soil to sale.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {[
              { title: 'AI Diagnosis', desc: 'Instant identification of pests and diseases using advanced computer vision.', icon: 'biotech', color: 'bg-blue-500' },
              { title: 'Marketplace', desc: 'Direct-to-consumer platform with health-verified produce listings.', icon: 'storefront', color: 'bg-green-500' },
              { title: 'Real-time Monitoring', desc: 'Connect IoT sensors for live soil, moisture, and weather tracking.', icon: 'sensors', color: 'bg-orange-500' },
            ].map((feature, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-[2rem] sm:rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group"
              >
                <div className={`w-12 h-12 sm:w-16 sm:h-16 ${feature.color} text-white rounded-xl sm:rounded-2xl flex items-center justify-center mb-6 sm:mb-8 group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-2xl sm:text-3xl">{feature.icon}</span>
                </div>
                <h4 className="text-xl sm:text-2xl font-black mb-3 sm:mb-4 dark:text-white transition-colors">{feature.title}</h4>
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed transition-colors">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
