FROM node:24-alpine AS build
WORKDIR /app
RUN npm install --global pnpm@11.20.0
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html ./
COPY src ./src
COPY public ./public
ARG VITE_BACKEND_URL=https://backend-production-56e12.up.railway.app
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
RUN npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine
COPY nginx-main.conf /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
