FROM node:22-alpine
WORKDIR /app
COPY packages/shared/src/hot.ts packages/shared/src/hot.ts
COPY apps/hot-proxy/node-server.mjs apps/hot-proxy/node-server.mjs
WORKDIR /app/apps/hot-proxy
ENV PORT=8787
EXPOSE 8787
CMD ["node", "--experimental-strip-types", "node-server.mjs"]
