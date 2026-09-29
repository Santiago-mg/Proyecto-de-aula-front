# ─────────────────────────────────────────────────────────────────────────────
# Etapa 1 — build
#
# Vite no lee variables de entorno en tiempo de ejecucion: las sustituye
# literalmente dentro del bundle cuando compila. Por eso VITE_API_URL entra
# aqui como ARG y no como ENV del contenedor final; si se pasara al runtime,
# el navegador seguiria viendo el valor que quedo grabado en el build.
# ─────────────────────────────────────────────────────────────────────────────
# Node 22: es la version minima que declara package.json (engines). Node 20
# salio de soporte en abril de 2026.
FROM node:22-alpine AS build

WORKDIR /app

# Primero solo los manifiestos: mientras no cambien, Docker reutiliza la capa
# de npm ci y no vuelve a descargar todo el arbol de dependencias.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=http://localhost:3001/api/v1
ENV VITE_API_URL=$VITE_API_URL

# npm run build = tsc && vite build, asi que un error de tipos rompe la imagen
# aqui mismo en vez de llegar a produccion.
RUN npm run build


# ─────────────────────────────────────────────────────────────────────────────
# Etapa 2 — servir
#
# Solo viaja el contenido de dist/. Ni node_modules ni el codigo fuente entran
# a la imagen final: son ~50 MB de nginx contra ~1.2 GB si se sirviera con Node.
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Comprueba que nginx responde de verdad, no solo que el proceso vive.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
