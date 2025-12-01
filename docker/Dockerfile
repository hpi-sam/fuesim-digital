# set path
ARG PRODUCTION_PATH="/usr/local/app"

# Use official node image as the base image
FROM node:22-bullseye-slim AS builder

# Disable interactive frontend to prevent install dialogues
ARG DEBIAN_FRONTEND=noninteractive

# needed to use PRODUCTION_PATH before the first FROM
ARG PRODUCTION_PATH

# install git and zip
RUN apt-get update && \
    apt-get upgrade -y && \
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
FROM node:22-bullseye-slim

# needed to use PRODUCTION_PATH before the first FROM
ARG PRODUCTION_PATH

# Disable interactive frontend to prevent install dialogues
ARG DEBIAN_FRONTEND=noninteractive

# set production path
WORKDIR $PRODUCTION_PATH

# setting DEFAULT_VARIABLES
ENV DFM_ENABLE_SSL=false
ENV DFM_FORCE_NEW_SSL_CERTS=false
ENV DFM_ENABLE_HSTS=false
ENV DFM_DEBUG=false
ENV DFM_PERSISTENT_DATA_PATH="/dfm-data"
ENV DFM_USE_DB=true
ENV DFM_UPLOAD_LIMIT=200

# install necessary packages
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install --no-install-recommends \
        nginx \
        ca-certificates \
        cron \
        openssl \
        curl -y && \
    rm -rf /var/lib/apt/lists/*

# deleting default nginx conf
RUN rm /etc/nginx/sites-enabled/default && rm /etc/nginx/sites-available/default


# DFM_PERISTENT_DATA_PATH includes certs and acme.sh config - mount DFM_PERISTENT_DATA_PATH as a volume for persistency
RUN mkdir -p $DFM_PERSISTENT_DATA_PATH/certs && \
    mkdir -p $DFM_PERSISTENT_DATA_PATH/acme.sh/config && mkdir -p $DFM_PERSISTENT_DATA_PATH/acme.sh/certs && \
    chown -R www-data:www-data $DFM_PERSISTENT_DATA_PATH/certs

# download acme.sh
RUN curl https://raw.githubusercontent.com/acmesh-official/acme.sh/master/acme.sh > /acme.sh && chmod +x /acme.sh

# install acme.sh
RUN cd / && /acme.sh --install --config-home $DFM_PERSISTENT_DATA_PATH/acme.sh/config --cert-home $DFM_PERSISTENT_DATA_PATH/acme.sh/certs && \
    # remove acme.sh install script
    rm /acme.sh && \
    # we need the following to be able to use acme.sh in command line (without using explicit path)
    ln -s  /root/.acme.sh/acme.sh  /usr/local/bin/acme.sh

# nginx config files
COPY ./docker/nginx /etc/nginx/conf.d

# copy docker-entrypoint.sh and ssl.sh file into the container
COPY ./docker/docker-entrypoint.sh /docker-entrypoint.sh
COPY ./docker/ssl.sh /ssl.sh
COPY ./docker/cron-renew-session-ticket /etc/cron.daily/cron-renew-session-ticket

# make scripts executable
RUN chmod +x /docker-entrypoint.sh && \
    chmod +x /ssl.sh && \
    chmod +x /etc/cron.daily/cron-renew-session-ticket

# copy frontend
COPY --chown=www-data:www-data --from=builder $PRODUCTION_PATH/frontend/dist $PRODUCTION_PATH/frontend/dist

# copy shared
COPY --chown=www-data:www-data --from=builder $PRODUCTION_PATH/shared/dist $PRODUCTION_PATH/shared/dist
COPY --chown=www-data:www-data --from=builder $PRODUCTION_PATH/shared/node_modules $PRODUCTION_PATH/shared/node_modules
COPY --chown=www-data:www-data --from=builder $PRODUCTION_PATH/shared/package.json $PRODUCTION_PATH/shared

# copy backend
COPY --chown=www-data:www-data --from=builder $PRODUCTION_PATH/backend/dist $PRODUCTION_PATH/backend/dist
COPY --chown=www-data:www-data --from=builder $PRODUCTION_PATH/backend/drizzle $PRODUCTION_PATH/backend/drizzle
COPY --chown=www-data:www-data --from=builder $PRODUCTION_PATH/backend/node_modules $PRODUCTION_PATH/backend/node_modules
COPY --chown=www-data:www-data --from=builder $PRODUCTION_PATH/backend/package.json $PRODUCTION_PATH/backend

# set correct working directory for docker-entrypoint.sh
WORKDIR $PRODUCTION_PATH/backend

# nginx port
EXPOSE 80:80
EXPOSE 443:443

CMD [ "/bin/bash", "-c", "/docker-entrypoint.sh" ]
