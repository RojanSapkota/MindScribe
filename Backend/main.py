from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Form, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from motor.motor_asyncio import AsyncIOMotorClient
# Removed passlib import to fix compatibility issue
import logging
import json
from PIL import Image
import io
import os
import bcrypt
from dotenv import load_dotenv
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

API_KEY = os.getenv("LLM_API_KEY")
if not API_KEY:
    raise ValueError("LLM Environment variable is not set.")

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
sentiment_collection = db['sentiment']

# We'll use bcrypt directly instead of through passlib's CryptContext
# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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
    # Use bcrypt directly to avoid passlib compatibility issues
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Use bcrypt directly to avoid passlib compatibility issues
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)

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

@app.options("/transcribe")
async def options_transcribe(request: Request):
    # Handle CORS preflight
    return JSONResponse(status_code=200, content={})

@app.post("/transcribe")
async def analyze_text(user_email: str = Form(...), transcript: str = Form(...), timestamp: str = Form(...)):
    try:
        # Check if the user exists
        user = await user_collection.find_one({"email": user_email})
        if not user:
            logging.warning(f"Transcribe attempt for non-existent user: {user_email}")
            raise HTTPException(status_code=400, detail="User not found")

        # Call Groq API for analysis
        try:
            client = Groq(api_key=os.environ.get("LLM_API_KEY"))
        except Exception as e:
            logging.error(f"Groq client initialization failed: {e}")
            raise HTTPException(status_code=500, detail="AI service unavailable")

        prompt = (
            f"You are a professional journal analysis AI assistant. "
            f"Analyze this journal entry: '{transcript}'. "
            f"Provide a detailed analysis in strict JSON format including: "
            f"1. 'summary': A brief summary of the journal entry (2-3 sentences), "
            f"2. 'mood': The predominant mood detected (single word or short phrase), "
            f"3. 'sentiment_score': A score from -10 to 10 where -10 is extremely negative, 0 is neutral, and 10 is extremely positive, "
            f"4. 'key_topics': An array of 3-5 main topics or themes discussed, "
            f"5. 'insights': An array of 2-3 psychological insights or patterns observed, "
            f"6. 'suggestions': An array of 2-3 actionable suggestions based on the journal content. "
            f"Output strictly as valid JSON without any additional text. "
            f"Example output: "
            f"{{\"summary\": \"The author described a challenging day at work with multiple deadlines. Despite the stress, they managed to stay productive and received positive feedback from their manager.\", "
            f"\"mood\": \"stressed but accomplished\", "
            f"\"sentiment_score\": 2, "
            f"\"key_topics\": [\"work stress\", \"deadlines\", \"productivity\", \"positive feedback\"], "
            f"\"insights\": [\"Author tends to perform well under pressure\", \"Validation from authority figures significantly improves their mood\"], "
            f"\"suggestions\": [\"Consider breaking large tasks into smaller milestones to reduce stress\", \"Schedule short breaks during intense work periods\", \"Continue seeking feedback to maintain motivation\"]}}"
        )

        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": "You are a journal analysis AI that responds only with valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1024
            )
            result_text = response.choices[0].message.content.strip()
        except Exception as e:
            logging.error(f"Groq API call failed: {e}")
            raise HTTPException(status_code=502, detail="AI analysis service error")

        # Try to parse the LLM result to ensure it's valid JSON
        try:
            parsed_json = json.loads(result_text)
        except json.JSONDecodeError as json_error:
            logging.error(f"Error parsing LLM response as JSON: {json_error}. Response: {result_text}")
            raise HTTPException(status_code=500, detail="Invalid JSON response from LLM")

        # Save analysis result to MongoDB
        try:
            analysis_data = {
                "user_email": user_email,
                "transcript": transcript,
                "timestamp": timestamp,
                "analysis_result": result_text
            }
            await analysis_collection.insert_one(analysis_data)
        except Exception as db_error:
            logging.error(f"Failed to save analysis to DB: {db_error}")


        # Return the validated JSON directly
        return parsed_json
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error(f"Unexpected error during transcription: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during transcription")

@app.get("/")
def read_root():
    return {"message": "Welcome to Mindscribe API!","status": "200"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app)