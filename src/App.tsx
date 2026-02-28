/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Auth from './components/Auth';
import { areSupabaseCredentialsSet, supabase } from './services/supabase';
import React, { useState, useEffect } from 'react';

const LOGO_URL = "https://ifdvcxlbikqhmdnuxmuy.supabase.co/storage/v1/object/public/assets/aa.png"; 
const FONDO_HEADER_URL = "/fondo-header.png"; 

// Complete simulation data for catalog and PDF export
const mockProductData = [
  { id: 1, title: 'Obsidian Suit', description: 'Virgin wool with dark silk lining. Asymmetric cut.', price: 450, category: 'Sastrería a Medida', imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=1000' },
  { id: 2, title: 'Eclipse Ring', description: '925 sterling silver with hand-carved central onyx.', price: 120, category: 'Plata de Ley 925', imageUrl: 'https://images.unsplash.com/photo-1610486241074-b778f69d2d0b?q=80&w=1000' }
];

export default function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState('admin'); // Set to 'admin' temporarily to test features
  
  const [activeView, setActiveView] = useState('home');
  const [activeCategory, setActiveCategory] = useState(''); // Knows exact menu
  
  // States for in-situ editing
  const [showInlineForm, setShowInlineForm] = useState(false);
  
  // State for customized catalog downloads
  const [pdfCategories, setPdfCategories] = useState<string[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserRole(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setShowLoginModal(false); 
        fetchUserRole(session.user.id);
      } else {
        setUserRole('cliente');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase.from('perfiles').select('rol').eq('id', userId).single();
      if (data) setUserRole(data.rol);
    } catch (error) {
      console.error("Error fetching role:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setActiveView('home'); 
  };

  const goToCategory = (categoryName) => {
    setActiveCategory(categoryName);
    setActiveView('categoria');
    setShowInlineForm(false);
  };

  const handlePdfCheckbox = (category) => {
    setPdfCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  if (!areSupabaseCredentialsSet) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center text-center p-6 font-serif">
        <div className="bg-black/80 backdrop-blur-md p-12 rounded-sm max-w-2xl shadow-2xl border-none">
          <h2 className="text-3xl text-white mb-4 tracking-[0.2em] uppercase">Configuration Required</h2>
          <p className="text-gray-400">Verify Supabase credentials in Secrets.</p>
        </div>
      </div>
    );
  }

  const invisibleBridgeUserMenu = "absolute top-full right-0 pt-4 hidden group-hover:block z-50";
  const invisibleBridgeMainMenu = "absolute top-full left-1/2 -translate-x-1/2 pt-4 hidden group-hover:block z-50";
  const opaqueCrystalSubmenuClass = "flex flex-col bg-black/95 backdrop-blur-md border border-white/10 py-6 px-8 shadow-2xl rounded-sm";
  const menuUnderlineClass = "absolute bottom-0 left-1/2 w-0 h-px bg-white group-hover:w-full group-hover:left-0 transition-all duration-300";

  return (
    <div className="bg-black text-white min-h-screen font-serif flex flex-col relative print:bg-black print:text-white print-adjust">
      
      {/* Dynamic styles for hidden scrollbar and print mode */}
      <style>{`
        ::-webkit-scrollbar { display: none; }
        * { -ms-overflow-style: none; scrollbar-width: none; }
        
        @media print {
          body { background-color: black !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .screen-only { display: none !important; }
          .print-only { display: block !important; }
          @page { margin: 1cm; }
        }
      `}</style>

      <div className="screen-only flex flex-col flex-grow w-full">
        <header className="w-full h-auto flex flex-col items-center bg-cover bg-center mt-0 relative z-50 pt-3" style={{ backgroundImage: `url(${FONDO_HEADER_URL})` }}>
          
          {user && activeView !== 'home' && (
            <button onClick={() => setActiveView('home')} className="absolute top-6 left-6 md:left-12 flex items-center gap-1.5 text-white hover:text-gray-400 transition-colors cursor-pointer bg-transparent border-none outline-none z-50 text-xs tracking-[0.2em] uppercase">
              <span className="text-sm font-light relative -top-[1px]">&lt;</span> Back
            </button>
          )}

          {user && (
            <div className="absolute top-6 right-6 md:right-12 flex items-center gap-6 z-50">
              <button className="text-white hover:text-gray-400 transition-colors relative cursor-pointer bg-transparent border-none outline-none">
                <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="24" width="24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"></path></svg>
                <span className="absolute -top-1 -right-2 bg-white text-black text-[9px] font-bold px-[5px] py-[1px] rounded-full">0</span>
              </button>

              <div className="group relative">
                <button className="text-white hover:text-gray-400 transition-colors cursor-pointer bg-transparent border-none outline-none">
                  <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" height="26" width="26"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"></path></svg>
                </button>
                <div className={invisibleBridgeUserMenu}>
                  <div className={`${opaqueCrystalSubmenuClass} min-w-[200px] text-right`}>
                    <button onClick={() => setActiveView('perfil')} className="text-xs tracking-[0.2em] uppercase text-gray-300 hover:text-white transition-colors cursor-pointer text-right bg-transparent border-none p-0 outline-none block">Profile</button>
                    <button onClick={() => setActiveView('pedidos')} className="text-xs tracking-[0.2em] uppercase text-gray-300 hover:text-white transition-colors cursor-pointer text-right bg-transparent border-none p-0 outline-none block mt-5">Orders</button>
                    <button onClick={() => setActiveView('deseos')} className="text-xs tracking-[0.2em] uppercase text-gray-300 hover:text-white transition-colors cursor-pointer text-right bg-transparent border-none p-0 outline-none block mt-5 mb-5">Wishlist</button>
                    <hr className="border-white/10 my-4" />
                    <button onClick={handleLogout} className="text-xs tracking-[0.2em] uppercase text-red-500 hover:text-red-400 transition-colors text-right bg-transparent border-none p-0 cursor-pointer outline-none block">Sign Out</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <img src={LOGO_URL} alt="ANTARES" onClick={() => setActiveView('home')} className={`h-20 md:h-32 w-auto object-contain mt-[4px] z-10 cursor-pointer`} />

          {user && activeView === 'home' && (
            <nav className="w-full border-none bg-transparent mt-[4px] mb-[4px] relative z-40 px-6 pt-0 animate-fade-in">
              <ul className="flex justify-center gap-10 md:gap-20 py-0 text-xs md:text-sm tracking-[0.3em] uppercase text-gray-400 border-none bg-transparent">
                
                {/* ATELIER */}
                <li className="group relative cursor-pointer py-2 border-none bg-transparent">
                  <span className="hover:text-white transition-colors block relative">Atelier<div className={menuUnderlineClass}></div></span>
                  <div className={invisibleBridgeMainMenu}>
                    <div className={`${opaqueCrystalSubmenuClass} min-w-[220px] text-center`}>
                      <span onClick={() => goToCategory('Sastrería a Medida')} className="hover:text-gray-300 transition-colors cursor-pointer block">Bespoke Tailoring</span>
                    </div>
                  </div>
                </li>

                {/* JOYERÍA */}
                <li className="group relative cursor-pointer py-2 border-none bg-transparent">
                  <span className="hover:text-white transition-colors block relative">Joyería<div className={menuUnderlineClass}></div></span>
                  <div className={invisibleBridgeMainMenu}>
                    <div className={`${opaqueCrystalSubmenuClass} min-w-[260px] text-center`}>
                      <span onClick={() => goToCategory('Plata de Ley 925')} className="hover:text-gray-300 transition-colors cursor-pointer block">925 Sterling Silver</span>
                    </div>
                  </div>
                </li>

              </ul>
            </nav>
          )}

          {!user && (
            <div className="w-full flex justify-center mt-[4px] mb-[4px]">
              <button onClick={() => setShowLoginModal(true)} className="text-white hover:text-gray-400 transition-colors p-0 bg-transparent border-none outline-none cursor-pointer">
                <svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="35" width="35"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </button>
            </div>
          )}
        </header>

        <main className="flex-grow flex flex-col items-center">
          
          {/* HOME VIEW */}
          {(!user || activeView === 'home') && (
            <div className="w-full animate-fade-in flex flex-col items-center pb-20">
               <section className="w-full text-center py-20 md:py-32 px-4 hero-adjust">
                 <h2 className="text-5xl md:text-8xl font-bold tracking-[0.2em] uppercase text-white mb-8 opacity-90">Timeless Elegance</h2>
                 <p className="text-gray-400 tracking-[0.2em] uppercase text-xs max-w-2xl mx-auto leading-loose">
                   Welcome to the Antares Atelier. A space dedicated to sophistication, timeless design, and exclusivity in every detail.
                 </p>
               </section>
            </div>
          )}

          {/* CATEGORY VIEW WITH IN-SITU EDITING */}
          {user && activeView === 'categoria' && (
            <section className="container mx-auto px-4 py-16 flex-grow animate-fade-in w-full max-w-6xl">
               <h2 className="text-2xl tracking-[0.3em] uppercase text-white mb-12 text-center border-b border-white/10 pb-6 category-title">{activeCategory}</h2>
               
               {/* IN-SITU ADD BUTTON (ADMIN ONLY) */}
               {userRole === 'admin' && !showInlineForm && (
                 <div onClick={() => setShowInlineForm(true)} className="mb-12 border border-dashed border-white/20 py-8 text-center hover:bg-zinc-900/40 transition-colors cursor-pointer">
                   <span className="text-amber-500 tracking-[0.2em] text-xs uppercase">+ Add new piece to {activeCategory}</span>
                 </div>
               )}

               {/* INLINE EDITING FORM (ADMIN ONLY) */}
               {userRole === 'admin' && showInlineForm && (
                 <div className="mb-16 bg-zinc-900/30 p-8 border border-white/5 relative inline-form">
                   <button onClick={() => setShowInlineForm(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white cursor-pointer bg-transparent border-none text-xl">×</button>
                   <h3 className="text-sm tracking-[0.2em] uppercase text-white mb-6 form-title">New Piece Details</h3>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                     <input type="text" placeholder="PIECE TITLE" className="bg-transparent border-b border-white/20 text-white text-xs tracking-[0.1em] py-2 outline-none" />
                     <input type="number" placeholder="PRICE (USD)" className="bg-transparent border-b border-white/20 text-white text-xs tracking-[0.1em] py-2 outline-none" />
                   </div>
                   <textarea placeholder="EDITORIAL DESCRIPTION..." rows="2" className="w-full bg-transparent border-b border-white/20 text-white text-xs tracking-[0.1em] py-2 outline-none mb-6 resize-none"></textarea>
                   
                   <div className="flex items-center justify-between">
                     <input type="file" className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer" />
                     <button className="text-black text-[10px] font-bold tracking-[0.3em] uppercase px-8 py-3 bg-white hover:bg-gray-200 transition-colors cursor-pointer outline-none rounded-sm border-none">
                       Publish
                     </button>
                   </div>
                 </div>
               )}

               {/* PRODUCT GALLERY */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                 {mockProductData.filter(p => p.category === activeCategory).map(producto => (
                   <div key={producto.id} className="group relative cursor-pointer product-card">
                     <div className="overflow-hidden aspect-[3/4] bg-zinc-900 mb-4 relative image-container">
                       <img src={producto.imageUrl} alt={producto.title} className="w-full h-full object-cover grayscale opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                       
                       {/* IN-SITU EDITING CONTROLS (ADMIN ONLY) */}
                       {userRole === 'admin' && (
                         <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity admin-controls">
                           <button className="bg-black/80 backdrop-blur-md p-2 text-white hover:text-amber-500 border border-white/10 cursor-pointer text-[10px]">EDIT</button>
                           <button className="bg-black/80 backdrop-blur-md p-2 text-white hover:text-red-500 border border-white/10 cursor-pointer text-[10px]">DELETE</button>
                         </div>
                       )}
                     </div>
                     <h4 className="text-sm tracking-[0.2em] uppercase text-white mb-1 title-adjust">{producto.title}</h4>
                     <p className="text-xs tracking-[0.1em] text-gray-500 price-adjust">${producto.price} USD</p>
                   </div>
                 ))}
               </div>
            </section>
          )}

          {/* PROFILE VIEW WITH CUSTOMIZABLE LOOKBOOK */}
          {user && activeView === 'perfil' && (
            <section className="w-full max-w-3xl mx-auto px-4 py-16 flex-grow animate-fade-in">
              <h2 className="text-2xl tracking-[0.3em] uppercase text-white mb-10 text-center pb-4 profile-title">My Profile</h2>
              
              <div className="bg-black/80 backdrop-blur-md p-10 rounded-sm shadow-2xl border-none profile-card">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase text-gray-500 mb-2">Name</label>
                    <p className="text-white text-lg">{user.user_metadata?.first_name || 'Tonny'}</p>
                  </div>
                  <div>
                    <label className="block text-[10px] tracking-[0.2em] uppercase text-gray-500 mb-2">Email</label>
                    <p className="text-white text-lg">{user.email}</p>
                  </div>
                </div>

                {/* CUSTOMIZABLE DOWNLOAD SECTION */}
                <div className="mb-4 pt-8 border-t border-white/10 mt-8 lookbook-section">
                  <label className="block text-sm tracking-[0.3em] uppercase text-white mb-6 text-center lookbook-title">A La Carte Catalog</label>
                  <p className="text-gray-500 text-[10px] tracking-[0.2em] uppercase text-center mb-8 lookbook-desc">Select collections to include in your interactive PDF lookbook.</p>
                  
                  {/* CUSTOM CHECKBOXES */}
                  <div className="flex flex-col md:flex-row justify-center gap-6 mb-10 check-group">
                    {['Sastrería a Medida', 'Plata de Ley 925'].map(cat => (
                      <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-3 h-3 border transition-colors flex items-center justify-center ${pdfCategories.includes(cat) ? 'bg-white border-white' : 'border-gray-500 group-hover:border-white'}`}>
                          {pdfCategories.includes(cat) && <div className="w-1.5 h-1.5 bg-black"></div>}
                        </div>
                        <input type="checkbox" className="hidden" onChange={() => handlePdfCheckbox(cat)} checked={pdfCategories.includes(cat)} />
                        <span className="text-gray-400 group-hover:text-white text-[9px] tracking-[0.2em] uppercase transition-colors">{cat}</span>
                      </label>
                    ))}
                  </div>
                  
                  <div className="flex justify-center">
                    <button 
                      onClick={() => {
                        if(pdfCategories.length === 0) return alert("Select at least one category.");
                        window.print(); 
                      }} 
                      className="text-black text-[10px] font-bold tracking-[0.3em] uppercase px-8 py-3 bg-white hover:bg-gray-200 transition-colors cursor-pointer outline-none rounded-sm border-none flex items-center justify-center gap-2"
                    >
                      <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" height="16" width="16"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                      Generate Lookbook PDF
                    </button>
                  </div>
                </div>

              </div>
            </section>
          )}

        </main>

        <footer className="bg-black py-12 text-center text-gray-600 text-[9px] tracking-[0.5em] uppercase border-none mt-auto px-4 screen-only">
          &copy; {new Date().getFullYear()} ANTARES. Timeless Elegance.
        </footer>
      </div>

      {showLoginModal && <Auth onClose={() => setShowLoginModal(false)} />}

      {/* =========================================================
          GHOST VIEW (ONLY VISIBLE IN GENERATED PDF)
          ========================================================= */}
      <div className="hidden print-only bg-black text-white w-full min-h-screen p-10 font-serif pdf-container">
        
        {/* PDF HEADER WITH IMAGE AND LOGO */}
        <header className="w-full flex flex-col items-center bg-cover bg-center mt-0 relative z-50 pt-3 pb-6 border-b border-white/10 pdf-header" style={{ backgroundImage: `url(${FONDO_HEADER_URL})` }}>
          <img src={LOGO_URL} alt="ANTARES" className={`h-20 md:h-32 w-auto object-contain mt-[4px] z-10`} />
        </header>

        {pdfCategories.map(cat => {
          const catPieces = mockProductData.filter(p => p.category === cat);
          if (catPieces.length === 0) return null;

          return (
            <div key={cat} className="mb-24 page-break-after pdf-section">
              <h2 className="text-2xl tracking-[0.2em] uppercase text-white mb-12 text-center section-title">{cat}</h2>
              <div className="grid grid-cols-2 gap-12 pdf-grid">
                {catPieces.map(p => (
                  <div key={p.id} className="flex flex-col items-center text-center pdf-card">
                    <img src={p.imageUrl} className="w-full aspect-[3/4] object-cover grayscale mb-6 pdf-image" alt={p.title} />
                    <h3 className="text-sm tracking-[0.2em] uppercase text-white mb-2 pdf-item-title">{p.title}</h3>
                    <p className="text-[10px] tracking-[0.1em] text-gray-400 mb-4 pdf-item-price">${p.price} USD</p>
                    <p className="text-[10px] leading-relaxed text-gray-500 px-4 pdf-item-desc">{p.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  );
}