#!/usr/bin/env python3
"""
Startup script for Python Database Management System
"""

import os
import sys
import subprocess
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        print(f"Current version: {sys.version}")
        return False
    print(f"✅ Python version: {sys.version}")
    return True

def install_requirements():
    """Install required packages"""
    print("📦 Installing Python dependencies...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def check_env_file():
    """Check if .env file exists"""
    env_path = Path("../../.env")
    if env_path.exists():
        print("✅ .env file found")
        return True
    else:
        print("⚠️ .env file not found")
        print("💡 Please create a .env file with your GEMINI_API_KEY")
        return False

def main():
    """Main startup function"""
    print("🐍 Python Database Management System")
    print("=" * 50)
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Check .env file
    check_env_file()
    
    # Install requirements
    if not install_requirements():
        sys.exit(1)
    
    # Start the server
    print("\n🚀 Starting FastAPI server...")
    print("🌐 Server will be available at: http://localhost:5000")
    print("📚 API documentation at: http://localhost:5000/docs")
    print("\nPress Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        import uvicorn
        uvicorn.run("app.main:app", host="0.0.0.0", port=5000, reload=True)
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
