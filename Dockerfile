# 归页 Web 版 —— 多阶段构建，产物由 Nginx 托管
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY . .
ARG VITE_SUPABASE_URL=""
ARG VITE_SUPABASE_ANON_KEY=""
ARG VITE_HOT_API_BASE=""
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY VITE_HOT_API_BASE=$VITE_HOT_API_BASE
RUN pnpm install --frozen-lockfile && pnpm build

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
