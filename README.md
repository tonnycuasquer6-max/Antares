# React + TypeScript + Vite

## Mapa y tarifa de entrega

El mapa de entrega usa Mapbox. Define `VITE_MAPBOX_TOKEN` en `.env` con un token público de Mapbox para mostrarlo en el checkout.

La tarifa se calcula exclusivamente con la distancia lineal desde `STORE_ORIGIN` en `src/components/cart/Cart.tsx`: menos de 5 km = USD 0.70; de 5 a 15 km = USD 1.00; más de 15 km = USD 1.60. El origen oculto de la tienda está fijado en longitud -78.498 y latitud -0.2513.

## Deshacer ventas

Para habilitar la restauración de stock y la eliminación de ventas desde el historial, ejecuta el `supabase/schema.sql` actualizado en el SQL Editor de Supabase con un usuario propietario del proyecto. La reversión requiere la contraseña `0211` y una sesión de administrador.

## Redirección de Google Auth

En **Supabase → Authentication → URL Configuration**, configura el **Site URL** como `https://antares-beige.vercel.app` y agrega `https://antares-beige.vercel.app/` a **Redirect URLs**. Para desarrollo local, agrega también `http://localhost:5173/`. El flujo de autenticación en producción vuelve siempre a `https://antares-beige.vercel.app/`; `supabase/config.toml` mantiene permitidas las rutas locales para desarrollo.

## Lectura pública del catálogo

Si el catálogo no devuelve productos para clientes, ejecuta `supabase/public_catalog_access.sql` en el SQL Editor de Supabase como propietario del proyecto. El script concede `SELECT` a `anon` y `authenticated` sobre la vista `productos_publicos`, que solo expone productos publicados y omite los campos internos de costo y margen. No concedas lectura pública directa sobre `productos`.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
