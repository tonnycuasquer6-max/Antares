import type { RefObject } from 'react';
import Map, { Marker, type MapRef } from 'react-map-gl/mapbox';
import { MapPin } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
const INITIAL_MAP_VIEW = { longitude: -78.49, latitude: -0.18, zoom: 11 };

interface DeliveryMapProps {
  mapRef: RefObject<MapRef | null>;
  location: { longitude: number; latitude: number } | null;
  onLocationChange: (longitude: number, latitude: number) => void;
}

export default function DeliveryMap({ mapRef, location, onLocationChange }: DeliveryMapProps) {
  if (!mapboxToken) {
    return (
      <p role="alert" className="border border-red-400/30 bg-red-950/30 p-4 text-[10px] text-red-200">
        No se puede cargar el mapa: configura VITE_MAPBOX_TOKEN en el entorno de Vite.
      </p>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-sm border border-white/15">
      <Map
        ref={mapRef}
        initialViewState={INITIAL_MAP_VIEW}
        mapboxAccessToken={mapboxToken}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        onClick={event => onLocationChange(event.lngLat.lng, event.lngLat.lat)}
        style={{ width: '100%', height: '360px' }}
        aria-label="Mapa para seleccionar la ubicación de entrega"
      >
        {location && (
          <Marker
            longitude={location.longitude}
            latitude={location.latitude}
            anchor="bottom"
            draggable
            onDragEnd={event => onLocationChange(event.lngLat.lng, event.lngLat.lat)}
          >
            <MapPin className="h-9 w-9 fill-white text-black drop-shadow-lg" aria-label="Ubicación de entrega" />
          </Marker>
        )}
      </Map>
    </div>
  );
}
