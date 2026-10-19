FROM node:22-alpine
WORKDIR /app/mail-service
COPY mail-service/package.json mail-service/package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY mail-service/server.mjs ./
WORKDIR /app
COPY index.html sw.js app-manifest.json icon-192.png icon-512.png catalog-emblem.png pb-caption.js sicherheit.html impressum.html ./
COPY assets ./assets
COPY modules ./modules
COPY models ./models
COPY sbkim/spore.json ./sbkim/spore.json
# Private checkouts may have mode 600/700 (umask 077). Only application files
# in the image become readable; the private /data volume keeps its own permissions.
RUN chmod -R a+rX /app && mkdir -p /data && chown node:node /data
USER node
ENV MAIL_BIND=0.0.0.0 MAIL_DATA=/data PORT=8787
EXPOSE 8787
CMD ["node", "mail-service/server.mjs"]
