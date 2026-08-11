# FigDown Kroki-companion service.
# Build from the repository root (the context must include dist/):
#   node tools/make-lib.js
#   docker build -f integrations/kroki-service/Dockerfile -t figdown-kroki .
FROM node:20-alpine
WORKDIR /app
COPY dist/figdown.js ./figdown.js
COPY integrations/kroki-service/server.js ./server.js
ENV PORT=8006
EXPOSE 8006
CMD ["node", "server.js"]
