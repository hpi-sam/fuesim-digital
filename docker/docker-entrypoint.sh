#!/bin/bash

set -e

# resetting to http connection
rm -f /etc/nginx/conf.d/https.conf
cp -a /etc/nginx/conf.d/http.template /etc/nginx/conf.d/http.conf
echo "" > /etc/nginx/conf.d/hsts

# setting the upload limit in nginx
echo "client_max_body_size ${DFM_UPLOAD_LIMIT}m;" > /etc/nginx/conf.d/upload-limit

# starting nginx, needed here already for acme.sh to verify certs via http
nginx

# only *.conf files in /etc/nginx/conf.d/ are enabled, others have to be explicitly included
if ${DFM_ENABLE_SSL}; then

    source /ssl.sh

    cp -a /etc/nginx/conf.d/http-redirect.template /etc/nginx/conf.d/http.conf
    cp -a /etc/nginx/conf.d/https.template /etc/nginx/conf.d/https.conf

    source /etc/cron.daily/cron-renew-session-ticket

    # starting cron for session ticket and acme.sh certs renewing to work
    service cron start

    if ${DFM_DEBUG}; then
        # testing nginx configuration, if there is an error it shows e.g. the filename
        nginx -t
    fi

    # reload nginx, to use https, when enabled
    nginx -s reload

    # needed after each start/restart/reload of nginx
    # search on the web for "nginx OCSP prefetching" - nginx doesn't automatically prefetch the OCSP response after start/restart/reload
    # otherwise the first access (at least on Firefox) will result in "Secure Connection Failed"
    set +e
    curl https://${DFM_DOMAIN} > /dev/null 2>&1
    set -e

fi

if ${DFM_USE_DB}; then
    NODE_ENV=migration npm run migration:run
fi

NODE_ENV=production node dist/src/index.js
