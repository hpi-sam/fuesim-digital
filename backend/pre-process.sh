#!/bin/sh

npm run thesis:pre-process
poetry run python events_to_xes.py
