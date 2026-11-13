# Builds from the official Node image instead of Railway's Railpack builder,
# whose build driver is downloaded from GitHub on every deploy.
FROM node:22-slim

# Prisma's schema engine (used by `prisma db push` in pre-deploy) needs OpenSSL.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dependencies first so they're cached between code-only changes. Dev
# dependencies stay installed: the Prisma CLI runs in the pre-deploy step.
COPY package.json package-lock.json ./
RUN npm ci --include=dev

COPY . .
# `npm run build` = prisma generate && tsc
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3001
CMD ["npm", "start"]
