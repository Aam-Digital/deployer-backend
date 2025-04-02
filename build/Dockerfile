# This docker image can be used to run the service.
# To use it only Docker needs to be installed locally
# Run the following commands from the root folder to build, run and kill the application
# >> docker build -f build/Dockerfile -t deployer-ms:latest .
# >> docker run -p=80:80 deployer-ms:latest
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

# If set to true, tests are exectued
ARG RUN_TESTS=false

# Lint code and run tests
RUN if [ "$RUN_TESTS" = true ] ; then \
    npm run lint &&\
    npm run test:cov ; fi

FROM node:22-alpine AS bulid
WORKDIR /app
# Some packages enable optimization when this is set
ENV NODE_ENV="production"

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# (optional) The sentry DSN in order to send the error messages to sentry
ENV SENTRY_DSN=""
ENV PORT=""

CMD ["node", "dist/main"]

