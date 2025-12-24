#!/bin/bash

# Ensure we are in the backend directory
cd "$(dirname "$0")"

# Activate virtual environment
source venv/bin/activate

# Install requirements (to ensure pyinstaller is there)
pip install -r requirements.txt

# Clean previous builds
rm -rf build dist

# Build the engine
# --onefile: Create a single executable
# --name: Name the output binary
# --hidden-import: Ensure uvicorn's dependencies are found
pyinstaller main.py \
    --name edgelend-engine \
    --onefile \
    --hidden-import=uvicorn.logging \
    --hidden-import=uvicorn.loops \
    --hidden-import=uvicorn.loops.auto \
    --hidden-import=uvicorn.protocols \
    --hidden-import=uvicorn.protocols.http \
    --hidden-import=uvicorn.protocols.http.auto \
    --hidden-import=uvicorn.lifespan \
    --hidden-import=uvicorn.lifespan.on \
    --clean

echo "Build complete! Binary located at backend/dist/edgelend-engine"
