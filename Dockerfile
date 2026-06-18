# ════════════════════════════════════════════════════════════════════════
#  Hire2Scale — Debrief PDF Rendering Service (Render / Docker)
#
#  Installs REAL Google Chrome into the container the standard Linux way, so
#  Puppeteer launches it with zero library/cache fragility. This is the
#  "once and for all" fix for the libnss3 / shared-library failures that
#  serverless Chromium runs into.
# ════════════════════════════════════════════════════════════════════════
FROM node:20-slim

# Install Google Chrome + the system libraries it needs.
RUN apt-get update \
  && apt-get install -y wget gnupg ca-certificates \
  && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg \
  && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
  && apt-get update \
  && apt-get install -y google-chrome-stable \
       fonts-liberation fonts-noto-color-emoji fonts-noto-cjk \
       libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
       libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 \
  && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use the Chrome we just installed (don't download its own).
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

WORKDIR /app

# Install Node dependencies first (better build caching).
COPY package.json ./
RUN npm install --omit=dev

# Copy the service code + engine.
COPY . .

EXPOSE 3000
CMD ["node", "server.js"]
