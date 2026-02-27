import React, { useState } from 'react';
import { supabase } from '../services/supabase';

export default function Auth({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const handleGoogleAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo: window.location.origin 
      }
    });
    if (error) console.error("Error de Supabase:", error.message);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900/40 border border-white/10 p-10 md:p-14 rounded-none max-w-lg w-full relative shadow-2xl backdrop-blur-xl">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="28" width="28">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="flex justify-center gap-10 mb-12 border-b border-gray-800">
          <button onClick={() => setMode('login')} className={`text-[11px] tracking-[0.4em] uppercase font-bold pb-3 transition-all ${mode === 'login' ? 'text-white border-b-2 border-white' : 'text-gray-600'}`}>
            Iniciar Sesión
          </button>
          <button onClick={() => setMode('register')} className={`text-[11px] tracking-[0.4em] uppercase font-bold pb-3 transition-all ${mode === 'register' ? 'text-white border-b-2 border-white' : 'text-gray-600'}`}>
            Registrarse
          </button>
        </div>

        {mode === 'login' ? (
          <form className="flex flex-col gap-8 mb-10">
            <style>{`.triangular-input { clip-path: polygon(5% 0%, 95% 0%, 100% 50%, 95% 100%, 5% 100%, 0% 50%); }`}</style>
            
            {/* INPUTS: CRISTAL OSCURO TRANSLÚCIDO */}
            <input 
              type="email" 
              placeholder="USUARIO O EMAIL" 
              className="triangular-input w-full bg-black/60 backdrop-blur-sm text-white px-10 py-4 font-sans font-light tracking-widest text-sm uppercase placeholder:text-gray-700 outline-none border-none" 
            />
            <input 
              type="password" 
              placeholder="CONTRASEÑA" 
              className="triangular-input w-full bg-black/60 backdrop-blur-sm text-white px-10 py-4 font-sans font-light tracking-widest text-sm uppercase placeholder:text-gray-700 outline-none border-none" 
            />
            <button type="submit" className="w-full bg-[#1a1a1a] text-white py-4 font-bold text-xs uppercase tracking-[0.4em] border-none hover:bg-zinc-800 transition-colors">
              Entrar
            </button>
          </form>
        ) : (
          <div className="text-center mb-10 px-4">
            <button onClick={handleGoogleAuth} className="w-full flex items-center justify-center gap-4 py-4 bg-[#1a1a1a] text-white border-none text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-zinc-800 transition-colors">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5" />
              Registrarse con Google
            </button>
          </div>
        )}

        {mode === 'login' && (
          <div className="flex justify-center border-t border-white/10 pt-8">
            <button onClick={handleGoogleAuth} className="flex items-center gap-3 px-8 py-3 bg-[#1a1a1a] text-white border-none text-xs uppercase tracking-widest font-bold hover:bg-zinc-800 transition-colors">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-4 h-4" />
              Google Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}