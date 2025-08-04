import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '192.168.1.99',
      'alumni.hostingmanager.in',
      'school.hostingmanager.in'
    ],
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_API_URL || 'http://localhost:3033',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select', 'lucide-react'],
          utils: ['axios', 'clsx', 'date-fns']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
}));
