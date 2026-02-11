#!/bin/bash

function update_package() {
    local tmpfile=`mktemp`
    jq -M --indent 4 ".version = \"$2\"" "$1" > "$tmpfile"
    cat "$tmpfile" > "$1"
}

update_package "package.json" "$1"
update_package "shared/package.json" "$1"
update_package "frontend/package.json" "$1"
update_package "backend/package.json" "$1"
update_package "benchmark/package.json" "$1"
