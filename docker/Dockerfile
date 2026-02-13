# set path
ARG PRODUCTION_PATH="/usr/local/app"

# Use official node image as the base image
FROM node:24.13.0-trixie-slim AS builder

# Disable interactive frontend to prevent install dialogues
ARG DEBIAN_FRONTEND=noninteractive

# needed to use PRODUCTION_PATH before the first FROM
ARG PRODUCTION_PATH

# install git and zip
RUN apt-get update && \
    apt-get install --no-install-recommends \
        zip \
        git -y

# add the source code to app
COPY ./ $PRODUCTION_PATH

# set workdir
WORKDIR $PRODUCTION_PATH

# install for production and cleanup
RUN npm run deployment

####  building done  ####
#########################
####  prod container ####

# Use official node image as the base image, important to be on debian based for apt-get
FROM node:24.13.0-trixie-slim

# needed to use PRODUCTION_PATH before the first FROM
ARG PRODUCTION_PATH

# Disable interactive frontend to prevent install dialogues
ARG DEBIAN_FRONTEND=noninteractive

# set production path
WORKDIR $PRODUCTION_PATH

# setting DEFAULT_VARIABLES
ENV DFM_DEBUG=false
ENV DFM_USE_DB=true
ENV DFM_UPLOAD_LIMIT=200m

# install necessary packages
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends nginx && \
    rm -rf /var/lib/apt/lists/*

COPY --chmod=+x ./docker/docker-entrypoint.sh /docker-entrypoint.sh

# nginx conf
COPY ./docker/nginx-fuesim-digital.conf /etc/nginx/sites-available/default

# copy frontend
COPY --chown=www-data:www-data --from=builder $PRODUCTION_PATH/frontend/dist/fuesim-digital $PRODUCTION_PATH/frontend

# copy shared
COPY --chown=www-data:www-data --from=builder $PRODUCTION_PATH/shared/dist $PRODUCTION_PATH/shared/dist
COPY --chown=www-data:www-data --from=builder $PRODUCTION_PATH/shared/node_modules $PRODUCTION_PATH/shared/node_modules
COPY --chown=www-data:www-data --from=builder $PRODUCTION_PATH/shared/package.json $PRODUCTION_PATH/shared

# copy backend
COPY --chown=www-data:www-data --from=builder $PRODUCTION_PATH/backend/dist $PRODUCTION_PATH/backend/dist
COPY --chown=www-data:www-data --from=builder $PRODUCTION_PATH/backend/drizzle $PRODUCTION_PATH/backend/drizzle
COPY --chown=www-data:www-data --from=builder $PRODUCTION_PATH/backend/drizzle.config.ts $PRODUCTION_PATH/backend/drizzle.config.ts
COPY --chown=www-data:www-data --from=builder $PRODUCTION_PATH/backend/node_modules $PRODUCTION_PATH/backend/node_modules
COPY --chown=www-data:www-data --from=builder $PRODUCTION_PATH/backend/package.json $PRODUCTION_PATH/backend

# set correct working directory for docker-entrypoint.sh
WORKDIR $PRODUCTION_PATH/backend

EXPOSE 80

CMD ["/docker-entrypoint.sh"]
