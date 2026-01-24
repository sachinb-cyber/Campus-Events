#!/usr/bin/env python
"""Simple wrapper to start the FastAPI server."""

import uvicorn
import sys
import os

if __name__ == "__main__":
    # Change to the backend directory
    os.chdir(os.path.dirname(__file__))
    
    # Start uvicorn
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )
