import { useState } from 'react';
import { supabase } from '../../services/supabase';

interface AuthProps {
  onClose: () => void;
}

export default function Auth({ onClose }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(''); 

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose(); 
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setErrorMsg('Registro exitoso. Revisa tu correo electrónico para confirmar.');
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Ocurrió un error de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
    } catch (error: any) {
      setErrorMsg(error.message);
    }
  };

  // Apple Liquid Glass / Gothic styling parameters
  const hexagonClipPath = {
    clipPath: 'polygon(28px 0, calc(100% - 28px) 0, 100% 50%, calc(100% - 28px) 100%, 28px 100%, 0 50%)'
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 font-serif animate-fade-in">
      
      <div className="liquid-glass liquid-form w-full max-w-md p-8 md:p-12 relative shadow-2xl rounded-[2rem]">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors bg-transparent border-none outline-none cursor-pointer w-8 h-8 flex items-center justify-center text-2xl hover:scale-110"
        >
          ×
        </button>

        <div className="flex justify-center gap-8 border-b border-white/10 mb-8 pb-4 mt-2">
          <button 
            onClick={() => { setIsLogin(true); setErrorMsg(''); }}
            className={`text-[10px] tracking-[0.3em] uppercase font-bold bg-transparent border-none outline-none cursor-pointer transition-colors relative ${isLogin ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Iniciar Sesión
            {isLogin && <div className="absolute -bottom-[17px] left-0 w-full h-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>}
          </button>
          <button 
            onClick={() => { setIsLogin(false); setErrorMsg(''); }}
            className={`text-[10px] tracking-[0.3em] uppercase font-bold bg-transparent border-none outline-none cursor-pointer transition-colors relative ${!isLogin ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Registrarse
            {!isLogin && <div className="absolute -bottom-[17px] left-0 w-full h-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="liquid-form flex flex-col gap-6">
          
          {errorMsg && (
            <div className={`text-[9px] tracking-[0.2em] uppercase text-center mb-2 px-4 py-2 border ${errorMsg.includes('exitoso') ? 'text-[#a8b8d0] border-[#a8b8d0]/30 bg-[#a8b8d0]/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}`}>
              {errorMsg}
            </div>
          )}

          <div className="relative">
            <input 
              type="email" 
              placeholder="USUARIO O EMAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full text-white placeholder-gray-600 text-[10px] tracking-[0.3em] uppercase px-8 py-5 outline-none border-0 transition-colors"
              style={hexagonClipPath}
            />
          </div>

          <div className="relative">
            <input 
              type="password" 
              placeholder="CONTRASEÑA"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-white placeholder-gray-600 text-[10px] tracking-[0.3em] uppercase px-8 py-5 outline-none border-0 transition-colors"
              style={hexagonClipPath}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-white hover:bg-gray-300 text-black text-[10px] font-bold tracking-[0.4em] uppercase py-5 mt-4 transition-all duration-300 border-none outline-none cursor-pointer disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
            style={hexagonClipPath}
          >
            {loading ? 'Procesando Cristal...' : (isLogin ? 'Acceder al Atelier' : 'Forjar Nueva Cuenta')}
          </button>
        </form>

        <div className="relative my-10 flex items-center justify-center">
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          <span className="bg-black/60 px-4 text-[8px] tracking-[0.3em] text-gray-500 uppercase relative z-10">O Acceder Con</span>
        </div>

        <button 
          type="button"
          onClick={handleGoogleLogin}
          className="w-full mx-auto flex items-center justify-center gap-4 bg-white/5 backdrop-blur-md hover:bg-white/10 text-white text-[10px] font-bold tracking-[0.3em] uppercase py-4 transition-all duration-300 border border-white/10 outline-none cursor-pointer hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          style={hexagonClipPath}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#ffffff" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
              <path fill="#cccccc" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
              <path fill="#999999" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
              <path fill="#eeeeee" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
            </g>
          </svg>
          Sincronizar Vía Google
        </button>

      </div>
    </div>
  );
}