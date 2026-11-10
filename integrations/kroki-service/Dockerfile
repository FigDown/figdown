# FigDown Kroki-companion service.
# Build from the repository root (the context must include dist/):
#   node tools/make-lib.js
#   docker build -f integrations/kroki-service/Dockerfile -t figdown-kroki .
FROM node:20-alpine
WORKDIR /app
COPY dist/figdown.js ./figdown.js
COPY integrations/kroki-service/server.js ./server.js
ENV PORT=8006
# Render limits (core §15.5); see README "Limits". Override with docker run -e.
ENV FIGDOWN_MAX_SOURCE_BYTES=262144 FIGDOWN_MAX_OUTPUT_BYTES=8388608 \
    FIGDOWN_RENDER_TIMEOUT_MS=10000 FIGDOWN_RENDER_HEAP_MB=512
EXPOSE 8006
CMD ["node", "server.js"]
