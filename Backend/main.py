from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import logging
import json
from PIL import Image
import io
import os
from dotenv import load_dotenv
from fastapi import Form
from datetime import datetime
import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
from groq import Groq

load_dotenv()
timestamp = datetime.now()

API_KEY = os.getenv("GROQ_API_KEY")
if not API_KEY:
    raise ValueError("GROQ_API_KEY environment variable is not set.")

# FastAPI app setup
app = FastAPI()

# Enable CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging setup
logging.basicConfig(level=logging.INFO)

# MongoDB setup
MONGO_URL = os.getenv("MONGO_URL")
if not MONGO_URL:
    raise ValueError("MONGO_URL environment variable is not set.")
client = AsyncIOMotorClient(MONGO_URL)
db = client['mindscribe']
user_collection = db['users']
analysis_collection = db['analysis']

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

smtp_server = os.getenv("smtp_server")
smtp_port = int(os.getenv("smtp_port"))
smtp_user = os.getenv("smtp_user")
smtp_password = os.getenv("smtp_password")
if not smtp_user or not smtp_password:
    raise ValueError("Email credentials are not set.")

class User(BaseModel):
    name: str
    email: str
    password: str

class OTPVerification(BaseModel):
    email: str
    otp: str


class UserLogin(BaseModel):
    email: str
    password: str

otp_store = {}

# Function to generate OTP
def generate_otp(length=6):
    """Generate a random OTP of specified length"""
    return ''.join(random.choices(string.digits, k=length))

# Function to send OTP via email
async def send_otp_email(email: str, otp: str):
    if not smtp_user or not smtp_password:
        logging.warning("Email credentials not set, skipping email")
        return True
    
    try:
        msg = MIMEMultipart()
        msg['From'] = f"MindScribe <{smtp_user}>"
        msg['To'] = email
        msg['Subject'] = "Your OTP for MindScribe Registration"
        msg['X-Priority'] = '1'
        
        body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f9f9f9; border-radius: 5px; padding: 20px; border-left: 4px solid #5D5FEF;">
                <h2 style="color: #5D5FEF;">Welcome to MindScribe!</h2>
                <p>Your One-Time Password (OTP) for account verification is:</p>
                <div style="background-color: #f0f0f9; padding: 15px; border-radius: 4px; text-align: center; margin: 20px 0;">
                    <h1 style="color:#5D5FEF; font-size: 32px; letter-spacing: 5px; margin: 0;">{otp}</h1>
                </div>
                <p><strong>Important:</strong> This OTP will expire in 10 minutes.</p>
                <p>If you didn't request this code, please ignore this email or contact support.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #777;">This is an automated message, please do not reply to this email.</p>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))
        
        # Add plain text alternative for better deliverability and accessibility
        text_body = f"""
        Welcome to Mindscribe!
        
        Your One-Time Password (OTP) for account verification is: {otp}
        
        This OTP will expire in 10 minutes.
        
        If you didn't request this code, please ignore this email or contact support.
        """
        
        msg.attach(MIMEText(text_body, 'plain'))
        
        server = smtplib.SMTP_SSL(smtp_server, smtp_port)
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
        server.quit()
        
        logging.info(f"OTP email sent to {email}")
        return True
    except Exception as e:
        logging.error(f"Error sending OTP email: {e}")
        return False

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

@app.post("/register-init")
async def register_init(user: User):
    # Check if the user already exists
    existing_user = await user_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    otp = generate_otp()

    otp_store[user.email] = {
        "otp": otp,
        "name": user.name,
        "password": user.password,
        "created_at": datetime.now()
    }
    
    email_sent = await send_otp_email(user.email, otp)
    
    response = {
        "message": "OTP sent to your email",
        "email": user.email
    }
    
    return JSONResponse(content=response)


@app.post("/verify-otp")
async def verify_otp(verification: OTPVerification):
    email = verification.email
    submitted_otp = verification.otp
    
    if email not in otp_store:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP verification. Please register again.")
    
    # Check OTP validity
    stored_data = otp_store[email]
    if stored_data["otp"] != submitted_otp:
        raise HTTPException(status_code=400, detail="Invalid OTP code")
    
    time_diff = datetime.now() - stored_data["created_at"]
    if time_diff.total_seconds() > 600:  # 10 minutes
        del otp_store[email]
        raise HTTPException(status_code=400, detail="OTP has expired. Please register again.")
    
    hashed_password = hash_password(stored_data["password"])
    
    new_user = {
        "name": stored_data["name"],
        "email": email,
        "password": hashed_password,
        "status": "normal_user",
        "verified": True,
        "created_at": datetime.now()
    }
    await user_collection.insert_one(new_user)
    
    del otp_store[email]
    
    return JSONResponse(content={"message": "Account created successfully", "email": email})


@app.post("/login")
async def login(user: UserLogin):
    try:
        # Find user by email
        existing_user = await user_collection.find_one({"email": user.email})
        if not existing_user:
            raise HTTPException(status_code=400, detail="Invalid email or password")
            
        # Verify password
        if not verify_password(user.password, existing_user['password']):
            raise HTTPException(status_code=400, detail="Invalid email or password")

        return JSONResponse(content={"message": "Login successful"})
    except Exception as e:
        logging.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during login")
    

@app.get("/")
def read_root():
    return {"message": "Welcome to Mindscribe API!","status": "200"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app)