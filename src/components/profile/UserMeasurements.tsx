import { useEffect, useState } from 'react';
import manos from '../../assets/Manos.png';
import iconos from '../../assets/ICONOS.png';
import { femaleMeasurements, maleMeasurements, type BodyMeasurementDefinition } from '../../data/bodyMeasurements';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';

interface UserMeasurementsProps {
  onNavigate: (view: string) => void;
}

export default function UserMeasurements({ onNavigate }: UserMeasurementsProps) {
  const { user } = useAuth();
  const [tabMedidas, setTabMedidas] = useState('anillos'); 
  const [bodyGender, setBodyGender] = useState<'female' | 'male' | null>(null);
  const [medidasAnillo, setMedidasAnillo] = useState({
    pulgar_izq: '', indice_izq: '', medio_izq: '', anular_izq: '', menique_izq: '',
    pulgar_der: '', indice_der: '', medio_der: '', anular_der: '', menique_der: ''
  });
  const [medidasCorporales, setMedidasCorporales] = useState<Record<string, string>>({});
  const [instruccionAbierta, setInstruccionAbierta] = useState<string | null>(null);
  const [guardandoMedidas, setGuardandoMedidas] = useState(false);
  const bodyMeasurements: BodyMeasurementDefinition[] = bodyGender === 'female' ? femaleMeasurements : maleMeasurements;

  useEffect(() => {
    if (!user) return;
    const cargarMedidas = async () => {
      const { data } = await supabase
        .from('perfiles')
        .select('medidas_anillos, medidas_corporales, genero_medidas')
        .eq('id', user.id)
        .single();
      if (!data) return;
      if (data.medidas_anillos && typeof data.medidas_anillos === 'object') setMedidasAnillo(data.medidas_anillos);
      if (data.medidas_corporales && typeof data.medidas_corporales === 'object') setMedidasCorporales(data.medidas_corporales);
      if (data.genero_medidas === 'female' || data.genero_medidas === 'male') setBodyGender(data.genero_medidas);
    };
    cargarMedidas();
  }, [user]);

  const guardarMedidas = async () => {
    if (!user) return;
    setGuardandoMedidas(true);
    const { error } = await supabase.from('perfiles').update({
      medidas_anillos: medidasAnillo,
      medidas_corporales: medidasCorporales,
      genero_medidas: bodyGender
    }).eq('id', user.id);
    setGuardandoMedidas(false);
    if (error) {
      alert('No se pudieron guardar las medidas. Inténtalo nuevamente.');
      return;
    }
    alert('Medidas guardadas correctamente.');
  };

  return (
    <section className="container mx-auto px-4 py-12 md:py-20 flex-grow animate-fade-in w-full max-w-4xl relative z-10">
      <div className="liquid-glass p-6 md:p-12 shadow-2xl relative rounded-[2rem]">
        
        <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
          <h2 className="text-[12px] md:text-[16px] tracking-[0.4em] uppercase text-white font-light drop-shadow-md">Configuración de Medidas</h2>
          <button 
            onClick={() => onNavigate('perfil')} 
            className="text-[8px] md:text-[10px] tracking-[0.2em] uppercase text-gray-500 hover:text-white transition-colors bg-transparent border-none cursor-pointer outline-none flex items-center gap-2"
          >
            <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" height="12" width="12"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"></path></svg>
            Volver al Perfil
          </button>
        </div>

        {/* TABS */}
        <div className="flex justify-center gap-8 mb-10 border-b border-white/10 pb-0">
          <button 
            onClick={() => setTabMedidas('anillos')} 
            className={`text-[10px] md:text-[12px] tracking-[0.2em] uppercase transition-all duration-300 pb-4 -mb-[2px] border-b-2 outline-none cursor-pointer bg-transparent ${tabMedidas === 'anillos' ? 'text-white border-white font-bold drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
          >
            Tallas de Anillos
          </button>
          <button 
            onClick={() => setTabMedidas('cuerpo')} 
            className={`text-[10px] md:text-[12px] tracking-[0.2em] uppercase transition-all duration-300 pb-4 -mb-[2px] border-b-2 outline-none cursor-pointer bg-transparent ${tabMedidas === 'cuerpo' ? 'text-white border-white font-bold drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
          >
            Medidas Corporales
          </button>
        </div>

        {tabMedidas === 'anillos' && (
          <div className="w-full max-w-3xl mx-auto animate-fade-in">
            <h3 className="text-[10px] md:text-[12px] tracking-[0.3em] uppercase text-gray-400 mb-10 text-center font-light">Medida de Anillo</h3>
            
            <div className="ring-hand-guide relative w-full max-w-3xl mx-auto mb-10">
              <div className="ring-hand-inputs">
                <div className="ring-hand-fields ring-hand-fields-left">
                  {[
                    ['menique_izq', 'Meñique'], ['anular_izq', 'Anular'], ['medio_izq', 'Medio'], ['indice_izq', 'Índice'], ['pulgar_izq', 'Pulgar']
                  ].map(([key, label]) => (
                    <label key={key} className="ring-finger-field">
                      <span>{label}</span>
                      <input type="number" value={medidasAnillo[key as keyof typeof medidasAnillo]} onChange={e => setMedidasAnillo({...medidasAnillo, [key]: e.target.value})} aria-label={`Talla ${label}`} placeholder="0" />
                    </label>
                  ))}
                </div>
                <div className="ring-hand-fields ring-hand-fields-right">
                  {[
                    ['pulgar_der', 'Pulgar'], ['indice_der', 'Índice'], ['medio_der', 'Medio'], ['anular_der', 'Anular'], ['menique_der', 'Meñique']
                  ].map(([key, label]) => (
                    <label key={key} className="ring-finger-field">
                      <span>{label}</span>
                      <input type="number" value={medidasAnillo[key as keyof typeof medidasAnillo]} onChange={e => setMedidasAnillo({...medidasAnillo, [key]: e.target.value})} aria-label={`Talla ${label}`} placeholder="0" />
                    </label>
                  ))}
                </div>
              </div>
              <img src={manos} alt="Guía de manos para tallas de anillos" className="ring-hand-image w-full h-auto object-contain opacity-75 select-none pointer-events-none" />
            </div>
          </div>
        )}

        {tabMedidas === 'cuerpo' && (
          <div className="w-full animate-fade-in">
            <h3 className="text-[10px] md:text-[12px] tracking-[0.3em] uppercase text-gray-400 mb-10 text-center font-light">Medidas Corporales (cm)</h3>
            {!bodyGender ? (
              <div className="body-gender-picker">
                <p className="body-gender-intro">Selecciona el tipo de medidas que deseas configurar</p>
                <div className="body-gender-options">
                  <button type="button" onClick={() => setBodyGender('female')} className="body-gender-option">
                    <span className="body-gender-icon body-gender-icon-female"><img src={iconos} alt="" /></span>
                    <span>Mujer</span>
                  </button>
                  <button type="button" onClick={() => setBodyGender('male')} className="body-gender-option">
                    <span className="body-gender-icon body-gender-icon-male"><img src={iconos} alt="" /></span>
                    <span>Hombre</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in">
                <button type="button" onClick={() => setBodyGender(null)} className="body-gender-change">Cambiar selección</button>
                <div className="body-measurement-grid">
                  {bodyMeasurements.map(measurement => (
                    <div key={measurement.id} className="body-measurement-field">
                      <label htmlFor={`body-${measurement.id}`}>{measurement.name}</label>
                      <p>{measurement.shortDescription}</p>
                      {instruccionAbierta === measurement.id ? (
                        <button type="button" className="body-instructions-text" onClick={() => setInstruccionAbierta(null)}>
                          {measurement.instructions}
                        </button>
                      ) : (
                        <button type="button" className="body-instructions-toggle" onClick={() => setInstruccionAbierta(measurement.id)}>
                          Instrucciones
                        </button>
                      )}
                      <input
                        id={`body-${measurement.id}`}
                        type="number"
                        min="0"
                        step="0.1"
                        value={medidasCorporales[measurement.id] || ''}
                        onChange={event => setMedidasCorporales(current => ({ ...current, [measurement.id]: event.target.value }))}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <p className="text-[8px] text-gray-500 uppercase text-center tracking-widest mt-10">Sus medidas se almacenan de forma segura.</p>
        
        <div className="mt-8 flex justify-center">
          <button 
            onClick={guardarMedidas}
            disabled={guardandoMedidas}
            className="text-black text-[8px] md:text-[10px] font-bold tracking-[0.3em] uppercase px-12 py-4 bg-white hover:bg-gray-300 transition-all duration-300 cursor-pointer outline-none border-none shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] rounded-sm"
          >
            {guardandoMedidas ? 'Guardando...' : 'Guardar Medidas'}
          </button>
        </div>

      </div>
    </section>
  );
}