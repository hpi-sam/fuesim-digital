#!/bin/bash

set -e

# set the upload limit in nginx
sed -i "s/client_max_body_size [0-9]\+[A-Za-z]\?;/client_max_body_size ${DFM_UPLOAD_LIMIT};/" /etc/nginx/sites-available/default

if ${DFM_USE_DB}; then
    NODE_ENV=migration npm run migration:run
fi

nginx
# Default to production, but allow overriding NODE_ENV, e.g. for testing locally with docker.
NODE_ENV=${NODE_ENV:-production} node dist/src/index.js
