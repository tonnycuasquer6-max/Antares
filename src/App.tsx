import { lazy, Suspense, useState, useEffect, useRef, useMemo } from 'react';
import { supabase, areSupabaseCredentialsSet } from './services/supabase';
import type { User } from './types';

// Context Providers (Próximos archivos)
import { AuthProvider } from './context/AuthContext';
import { ShopProvider } from './context/ShopContext';

// Layout Components
import Header from './components/layout/Header';
import LiquidBackground from './components/layout/LiquidBackground';
import CartFlyAnimation from './components/layout/CartFlyAnimation';

const Footer = lazy(() => import('./components/layout/Footer'));
const Home = lazy(() => import('./components/shop/Home'));
const ProductGallery = lazy(() => import('./components/shop/ProductGallery'));
const PretAPorter = lazy(() => import('./components/customizer/PretAPorter'));
const Cart = lazy(() => import('./components/cart/Cart'));
const UserProfile = lazy(() => import('./components/profile/UserProfile'));
const UserMeasurements = lazy(() => import('./components/profile/UserMeasurements'));
const AdminInventory = lazy(() => import('./components/admin/AdminInventory'));
const AdminOrders = lazy(() => import('./components/admin/AdminOrders'));
const Auth = lazy(() => import('./components/auth/Auth'));

export default function App() {
  const [activeView, setActiveView] = useState<string>(() => localStorage.getItem('antares_active_view') || 'home');
  const [activeCategory, setActiveCategory] = useState<string>(() => localStorage.getItem('antares_active_category') || '');
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string>('cliente');
  const [user, setUser] = useState<User | null>(null);
  const authContextValue = useMemo(
    () => ({ user, userRole, setShowLoginModal }),
    [user, userRole]
  );
  const isAdminPanel = userRole === 'admin' && ['pedidos', 'inventario'].includes(activeView);
  const sessionVersion = useRef(0);
  const activeSessionUserId = useRef<string | null | undefined>(undefined);
  const authListenerActive = useRef(false);

  const handleUserSession = async (currentUser: User | null) => {
    if (!authListenerActive.current) return;
    const userId = currentUser?.id ?? null;
    setUser(currentUser);
    if (activeSessionUserId.current === userId) return;

    activeSessionUserId.current = userId;
    const currentVersion = ++sessionVersion.current;
    if (currentUser) {
      setShowLoginModal(false);
      setUserRole('cliente');
      try {
        const { data } = await supabase
          .from('perfiles')
          .select('rol')
          .eq('id', currentUser.id)
          .single();
        if (authListenerActive.current && currentVersion === sessionVersion.current) {
          setUserRole(data?.rol || 'cliente');
        }
      } catch (error: unknown) {
        console.error('No se pudo cargar el rol de usuario desde Supabase.', error);
        if (authListenerActive.current && currentVersion === sessionVersion.current) setUserRole('cliente');
      }
    } else {
      setUserRole('cliente');
      setActiveView('home');
    }
  };

  useEffect(() => {
    authListenerActive.current = true;
    let timeoutId: number | undefined;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      timeoutId = window.setTimeout(() => {
        if (authListenerActive.current) void handleUserSession(session?.user ?? null);
      }, 0);
    });

    return () => {
      authListenerActive.current = false;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('antares_active_view', activeView);
    localStorage.setItem('antares_active_category', activeCategory);
  }, [activeView, activeCategory]);

  useEffect(() => {
    const savedScrollPosition = Number(sessionStorage.getItem('antares_scroll_position') || 0);
    const restoreScrollPosition = () => window.scrollTo({ top: savedScrollPosition, behavior: 'auto' });
    const rememberScrollPosition = () => sessionStorage.setItem('antares_scroll_position', String(window.scrollY));

    window.history.scrollRestoration = 'manual';
    const animationFrame = requestAnimationFrame(restoreScrollPosition);
    window.addEventListener('scroll', rememberScrollPosition, { passive: true });
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('scroll', rememberScrollPosition);
    };
  }, []);

  if (!areSupabaseCredentialsSet) return null;

  const renderView = () => {
    switch (activeView) {
      case 'home':
        return <Home onNavigate={(cat) => { setActiveCategory(cat); setActiveView('categoria'); }} />;
      case 'categoria':
        return activeCategory === 'Prêt-à-Porter' 
          ? <PretAPorter /> 
          : <ProductGallery category={activeCategory} userRole={userRole} />;
      case 'bag':
        return <Cart />;
      case 'perfil':
        return <UserProfile onNavigate={setActiveView} />;
      case 'medidas':
        return <UserMeasurements onNavigate={setActiveView} />;
      case 'inventario':
        return userRole === 'admin' ? <AdminInventory /> : <Home onNavigate={setActiveView} />;
      case 'pedidos':
        return <AdminOrders userRole={userRole} />;
      case 'deseos':
        return <ProductGallery category="deseos" userRole={userRole} />;
      default:
        return <Home onNavigate={(cat) => { setActiveCategory(cat); setActiveView('categoria'); }} />;
    }
  };

  return (
    <AuthProvider value={authContextValue}>
      <ShopProvider>
        <div className="min-h-screen bg-black text-white font-serif flex flex-col relative w-full overflow-x-hidden overflow-y-auto selection:bg-white/30 selection:text-black transition-colors duration-700">
          
          <LiquidBackground />
          <CartFlyAnimation />

          <div className="z-10 relative flex flex-col flex-grow w-full">
            <Header 
              activeView={activeView} 
              setActiveView={setActiveView} 
              setActiveCategory={setActiveCategory} 
            />

            <main className={`flex-grow flex flex-col items-center w-full min-w-0 px-3 sm:px-6 md:px-8 ${isAdminPanel ? 'pt-12 sm:pt-12' : 'pt-36 sm:pt-40'} animate-fade-in print-root`}>
              <Suspense fallback={<div className="flex min-h-[40vh] w-full items-center justify-center text-xs uppercase tracking-[0.2em] text-white/60" role="status">Cargando...</div>}>
                {renderView()}
              </Suspense>
            </main>

            <Suspense fallback={null}>
              <Footer />
            </Suspense>
          </div>

          {showLoginModal && (
            <Suspense fallback={<div className="fixed inset-0 z-[9999] grid place-items-center bg-black/80 text-xs uppercase tracking-[0.2em] text-white/60" role="status">Cargando...</div>}>
              <Auth onClose={() => setShowLoginModal(false)} />
            </Suspense>
          )}
        </div>
      </ShopProvider>
    </AuthProvider>
  );
}
