#!/usr/bin/env bash
# Start the Flask backend in development mode

set -e

cd "$(dirname "$0")/backend"

# Activate the uv-managed virtualenv
source .venv/bin/activate

# Run Flask
python app.py
