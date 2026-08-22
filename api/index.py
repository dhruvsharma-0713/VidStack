import os
import sys

# Add root directory to sys.path so relative and package imports work in Vercel serverless environment
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
