#!/bin/sh

DFM_DB_NAME=fuesim-digital-ba npm run thesis:pre-process
poetry run python events_to_xes.py
