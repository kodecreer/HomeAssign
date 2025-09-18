#!/usr/bin/env python3
import os
import secrets
import string
from datetime import datetime

def generate_secure_key(length=32):
    """Generate a cryptographically secure API key"""
    alphabet = string.ascii_letters + string.digits + '_-'
    return ''.join(secrets.choice(alphabet) for _ in range(length))

def rotate_api_key():
    """Rotate the API key and update .env files"""
    print(f"Starting API key rotation at {datetime.now()}")
    
    # Generate new key
    new_key = f"ai_service_key_{generate_secure_key(24)}"
    print(f"Generated new API key: {new_key[:20]}...")
    
    # Update AIService .env
    ai_env_path = "/Users/kodecreer/Documents/HomeAssign/AIService/.env"
    with open(ai_env_path, 'w') as f:
        f.write(f"AI_SERVICE_API_KEY={new_key}\n")
    print(f"Updated {ai_env_path}")
    
    # Update MainService .env
    main_env_path = "/Users/kodecreer/Documents/HomeAssign/MainService/.env"
    with open(main_env_path, 'w') as f:
        f.write(f"PORT=3000\n")
        f.write(f"AI_SERVICE_URL=http://localhost:8001\n")
        f.write(f"AI_SERVICE_API_KEY={new_key}\n")
    print(f"Updated {main_env_path}")
    
    print("API key rotation completed successfully!")
    print("Remember to restart both services for changes to take effect.")
    
    return new_key

if __name__ == "__main__":
    rotate_api_key()