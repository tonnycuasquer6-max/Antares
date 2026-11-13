import React from 'react';
import type { Product } from '../types';
import { optimizeCloudinaryUrl } from '../utils/imageOptimization';

interface ProductGalleryProps {
  products: Product[];
}

const ProductGallery: React.FC<ProductGalleryProps> = ({ products }) => {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4 bg-black">
      {products.map((product) => (
        /* Aquí se aplica la clase product-card para el diseño 3D, borde y sombra blanca */
        <div key={product.id} className="product-card flex flex-col items-center p-6 bg-black">
          <div className="product-image-container w-full flex justify-center mb-4">
            <img 
              loading="lazy"
              decoding="async"
              src={optimizeCloudinaryUrl(product.imagen_url, 600)} 
              alt={product.titulo} 
              className="w-full h-auto object-contain max-h-64"
            />
          </div>
          <h3 className="text-white text-center text-sm md:text-base font-bold uppercase tracking-widest mt-2">
            {product.titulo}
          </h3>
          <p className="text-gray-300 text-center text-sm mt-1 mb-4">
            ${Number(product.precio).toFixed(2)} USD
          </p>
          
          {/* Estructura de tallas de la referencia visual */}
          <div className="flex flex-wrap justify-center gap-2 mt-auto w-full">
            {[6, 7, 8, 9, 10, 11, 12].map((size) => (
              <div key={size} className="flex flex-col items-center">
                <div className="border border-red-900 w-8 h-8 flex items-center justify-center text-red-500 text-sm">
                  {size}
                </div>
                <span className="text-red-900 text-xs mt-1">
                  {/* Simulación de stock basado en la imagen */}
                  {size === 9 || size === 10 ? '1' : '0'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductGallery;