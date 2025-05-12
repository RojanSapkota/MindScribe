from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Form, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from motor.motor_asyncio import AsyncIOMotorClient
import logging, json , io, os ,bcrypt, random, string , smtplib, requests
from PIL import Image
from dotenv import load_dotenv
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from groq import Groq
from bson import ObjectId
from fastapi.encoders import jsonable_encoder
import google.generativeai as genai
from prompts import EMOTIONAL_TEMPLATE, NUTRITION_TEMPLATE, JOURNAL_TEMPLATE, NUTRITION_TEMPLATE2
#Not using this for now
#import whisper
#import tempfile

load_dotenv()
timestamp = datetime.now()

API_KEY = os.getenv("LLM_API_KEY")
if not API_KEY:
    raise ValueError("LLM Environment variable is not set.")

FOOD_API_KEY = os.getenv("FOOD_API_KEY")
if not API_KEY:
    raise ValueError("FOOD_API_KEY environment variable is not set.")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)

MONGO_URL = os.getenv("MONGO_URL")
if not MONGO_URL:
    raise ValueError("MONGO_URL environment variable is not set.")
client = AsyncIOMotorClient(MONGO_URL)
db = client['mindscribe']
food_collection = db['food_analysis']
user_collection = db['users']
analysis_collection = db['analysis']
sentiment_collection = db['sentiment']

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

class ForgotPasswordRequest(BaseModel):
    email: str

class ForgotPasswordReset(BaseModel):
    email: str
    otp: str
    new_password: str


class FoodItem(BaseModel):
    name: str
    ingredients: List[str]
    estimated_calories: str
    protein: str
    carbs: str
    fats: str
    health_score: int

class FoodAnalysisResponse(BaseModel):
    foods: List[FoodItem]
    overall_calories: int
    overall_health_score: int

class MoodBreakdownRequest(BaseModel):
    user_email: str

#-------------------------------------------------------------------------------------------
#RAG LLM MODULES IMPORTS
#-------------------------------------------------------------------------------------------
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from fastapi import FastAPI, HTTPException, Request, Form, Body
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from chain_functions import load_documents, split_text, save_to_faiss, load_faiss_index
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from groq import Groq
from langchain.memory import ConversationBufferWindowMemory
from langchain_core.runnables import RunnableSequence
from langchain_core.prompts import ChatPromptTemplate, HumanMessagePromptTemplate, MessagesPlaceholder
from langchain_core.messages import SystemMessage
from langchain.chains import LLMChain
import os 
import pickle
from dotenv import load_dotenv

user_history = {}
data_path = "KnowledgeBase/"
load_dotenv()

#I know these are duplicates :)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def load_model(model_name: str = 'all-MiniLM-L6-v2') -> SentenceTransformer:
    return SentenceTransformer(model_name)

def load_faiss_index():
    if os.path.exists("faiss_index") and os.path.exists("stored_chunks.pkl"):
        index = faiss.read_index("faiss_index")
        with open("stored_chunks.pkl", "rb") as f:
            chunks = pickle.load(f)
        print("Loaded FAISS index and chunks from disk.")
        return index, chunks
    else: 
        print("FAISS index or stored_chunks not found. Generating new data...")
    try:
        docs = load_documents(data_path)
        chunks = split_text(docs)
        save_to_faiss(chunks)
        print("FAISS index and stored_chunks.pkl successfully generated.")
        return faiss.read_index("faiss_index"), chunks
    except Exception as e:
        raise FileNotFoundError(f"An error occurred during setup: {e}")


def ask_questions(faiss_index, stored_chunks, model, question, model_name="llama-3.3-70b-versatile"):
    from groq import Groq
    import os
    import numpy as np

    groq_chat = Groq(api_key=os.getenv("GROQ_API_KEY"))
    query_embedding = np.array([model.encode(question)])

    distances, main_indices = faiss_index.search(query_embedding, k=5)
    relevant_chunks = [stored_chunks[i] for i in main_indices[0]]

    context_str = "\n\n".join(
        f"{chunk.page_content} [Source: {chunk.metadata.get('document_name', 'Unknown')}]"
        for chunk in relevant_chunks
    )
    citations = list({
        f"http://localhost:8000/files/{os.path.basename(chunk.metadata.get('source', 'Unknown Source'))}"
        for chunk in relevant_chunks
    })

    prompt = EMOTIONAL_TEMPLATE.format(
    context_str=f"{context_str}",
    citations=f"{citations}",
    question=f"{question}"
)

    response = groq_chat.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": question}
        ],
        temperature=0.7,
        max_tokens=1024
    )

    return {
        "context": context_str,
        "citations": citations,
        "question": question,
        "response": response.choices[0].message.content,
    }

@app.post("/ask")
async def ask_question(request:Request):
    try:
        if request.headers.get("content-type") == "application/x-www-form-urlencoded":
            form_data = await request.form()
            question = form_data.get("question")
            #print(f"Question: {question}")
        elif request.headers.get("content-type") == "application/json":
            body = await request.json()
            question = body.get("question")
            print(f"Question: {question}")
        else:
            raise HTTPException(
                status_code=415,
                detail="Unsupported Content-Type. Use application/json or application/x-www-form-urlencoded."
            )

        if not question:
            raise HTTPException(status_code=400, detail="The 'question' parameter is required.")

        # Load FAISS index and model
        faiss_index, stored_chunks = load_faiss_index()
        model = load_model()

        # Get AI response for the question
        response = ask_questions(faiss_index, stored_chunks, model, question)
        return response

    except HTTPException as http_exc:
        print(f"HTTPException: {http_exc.detail}")
        raise http_exc
    except Exception as e:
        print(f"Exception: {e}")
        raise HTTPException(status_code=500, detail=str(e))

#-------------------------------------------------------------------------------------------

#I know it's not secure but for temporary purposes
# and to avoid complexity, I'm using in-memory storage for OTPs

otp_store = {}
forgot_password_otp_store = {}

def generate_otp(length=6):
    """Generate a random OTP of specified length"""
    return ''.join(random.choices(string.digits, k=length))

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
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)

@app.post("/register-init")
async def register_init(user: User):
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
    
    stored_data = otp_store[email]
    if stored_data["otp"] != submitted_otp:
        raise HTTPException(status_code=400, detail="Invalid OTP code")
    
    time_diff = datetime.now() - stored_data["created_at"]
    if time_diff.total_seconds() > 600:
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
        existing_user = await user_collection.find_one({"email": user.email})
        if not existing_user:
            raise HTTPException(status_code=400, detail="Invalid email or password")
            
        if not verify_password(user.password, existing_user['password']):
            raise HTTPException(status_code=400, detail="Invalid email or password")
    
        return JSONResponse(content={"message": "Login successful", "token": user.email})
    except Exception as e:
        logging.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during login")


#Doesnt WORK!
@app.post("/forgot-password-request")
async def forgot_password_request(data: ForgotPasswordRequest):
    user = await user_collection.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=400, detail="Email not found")
    otp = generate_otp()
    forgot_password_otp_store[data.email] = {
        "otp": otp,
        "created_at": datetime.now()
    }
    email_sent = await send_otp_email(data.email, otp)
    if not email_sent:
        raise HTTPException(status_code=500, detail="Failed to send OTP email. Please try again later.")
    return {"message": "OTP sent to your email"}

@app.post("/forgot-password-reset")
async def forgot_password_reset(data: ForgotPasswordReset):
    record = forgot_password_otp_store.get(data.email)
    if not record or record["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    time_diff = datetime.now() - record["created_at"]
    if time_diff.total_seconds() > 600:
        del forgot_password_otp_store[data.email]
        raise HTTPException(status_code=400, detail="OTP has expired")
    hashed_password = hash_password(data.new_password)
    await user_collection.update_one({"email": data.email}, {"$set": {"password": hashed_password}})
    del forgot_password_otp_store[data.email]
    return {"message": "Password reset successful"}

#NOT NEEDED FOR NOW

#@app.post("/whisper-transcribe")
#async def whisper_audio(audio: UploadFile = File(...)):
#    try:
#        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
#            tmp.write(await audio.read())
#            tmp_path = tmp.name
#
#        model = whisper.load_model("base")
#        result = model.transcribe(tmp_path)
#
#        os.remove(tmp_path)
#
#        return JSONResponse(content={"transcript": result["text"]})
#    except Exception as e:
#        logging.error(f"Whisper transcription error: {e}")
#        raise HTTPException(status_code=500, detail="Failed to transcribe audio")

@app.options("/transcribe")
async def options_transcribe(request: Request):
    return JSONResponse(status_code=200, content={})

@app.post("/transcribe")
async def analyze_text(user_email: str = Form(...), transcript: str = Form(...), timestamp: str = Form(...)):
    try:
        user = await user_collection.find_one({"email": user_email})
        if not user:
            logging.warning(f"Transcribe attempt for non-existent user: {user_email}")
            raise HTTPException(status_code=400, detail="User not found")

        try:
            client = Groq(api_key=os.environ.get("LLM_API_KEY"))
        except Exception as e:
            logging.error(f"Groq client initialization failed: {e}")
            raise HTTPException(status_code=500, detail="AI service unavailable")
        
        prompt = JOURNAL_TEMPLATE.replace("{transcript}", transcript)

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
            raise HTTPException(status_code=502, detail="AI analysis service error!")
        try:
            parsed_json = json.loads(result_text)
        except json.JSONDecodeError as json_error:
            logging.error(f"Error parsing LLM response as JSON: {json_error}. Response: {result_text}")
            raise HTTPException(status_code=500, detail="Invalid JSON response from LLM!")

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

        return parsed_json
    except HTTPException as he:
        raise he
    except Exception as e:
        logging.error(f"Unexpected error during transcription: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during transcription!")

@app.get("/history")
async def get_history(user_email: str):
    try:
        entries = await analysis_collection.find({"user_email": user_email}).sort("timestamp", -1).to_list(length=50)
        def serialize_entry(entry):
            entry["_id"] = str(entry["_id"])
            if isinstance(entry.get("timestamp"), datetime):
                entry["timestamp"] = entry["timestamp"].isoformat()
            return entry
        return {"entries": [serialize_entry(e) for e in entries]}
    except Exception as e:
        logging.error(f"Error fetching history: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch journal history")

#DATA FROM TRANSCRIBE TO ANALYTICS

#not so useful and secure
@app.post("/analytics")
#{
#  "analysis": {
#    "_id": "68215fb974e84fc7f2f8009a",
#    "user_email": "test@gmail.com",
#    "transcript": "This is a test.",
#    "timestamp": "2025-05-12T02:40:54.834Z",
#    "analysis_result": "{\n\"summary\": \"The journal entry is a brief test statement with no emotional or thematic content. It lacks personal details or experiences, making it difficult to analyze. The author's intention appears to be verifying the functionality of the journal analysis AI.\",\n\"mood\": \"neutral\",\n\"sentiment_score\": 0,\n\"key_topics\": [\"test\", \"journal entry\", \"analysis\"],\n\"insights\": [\"The author is likely testing the AI's functionality\", \"There is a lack of personal or emotional content in the entry\"],\n\"suggestions\": [\"Consider writing more detailed and personal journal entries for meaningful analysis\", \"Explore using journaling as a tool for self-expression and reflection\", \"Use this AI as a resource for gaining insights into your thoughts and feelings\"]\n}"
#  }
#}
async def analytics(user_email: str = Form(...), analysis_id: str = Form(...)):
    try:
        user = await user_collection.find_one({"email": user_email})
        if not user:
            raise HTTPException(status_code=400, detail="User not found")

        # Convert analysis_id to ObjectId for MongoDB lookup
        try:
            obj_id = ObjectId(analysis_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid analysis_id format")
        analysis = await analysis_collection.find_one({"_id": obj_id})
        if not analysis:
            raise HTTPException(status_code=400, detail="Analysis not found")

        # Convert ObjectId to string for JSON serialization
        analysis["_id"] = str(analysis["_id"])
        return JSONResponse(content={"analysis": analysis})
    except Exception as e:
        logging.error(f"Error fetching analytics: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during analytics retrieval!")

#useful for overall sentiment
@app.post("/sentiment")
#    {
#      "sentiment_score": 0,
#      "mood": "neutral",
#      "summary": "The author is testing the functionality of the journal analysis system with a simple statement. The entry lacks emotional depth or personal content, indicating a neutral or experimental tone. The purpose is to gauge the system's response rather than express personal feelings or experiences."
#    }
async def sentiment(user_email: str = Form(...), analysis_id: str = Form(...)):
    try:
        # Use ObjectId for MongoDB lookup
        try:
            obj_id = ObjectId(analysis_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid analysis_id format")
        analysis = await analysis_collection.find_one({"_id": obj_id, "user_email": user_email})
        if not analysis:
            raise HTTPException(status_code=400, detail="Analysis not found")
        # Parse analysis_result JSON and return only sentiment fields
        try:
            result = json.loads(analysis["analysis_result"])
            sentiment_data = {
                "sentiment_score": result.get("sentiment_score"),
                "mood": result.get("mood"),
                "summary": result.get("summary"),
            }
        except Exception:
            sentiment_data = {"raw": analysis["analysis_result"]}
        return JSONResponse(content={"sentiment": sentiment_data})
    except Exception as e:
        logging.error(f"Error fetching sentiment: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during sentiment retrieval!")

#overall sentiment from a week
@app.post("/mood-breakdown")
#{
#  "mood_data": [
#    {
#      "date": "2025-05-12T02:51:03.231Z",
#      "score": 0,
#      "mood": "neutral"
#    },
#    {
#      "date": "2025-05-12T02:40:54.834Z",
#      "score": 0,
#      "mood": "neutral"
#    }
#  ]
#}

async def mood_breakdown(data: MoodBreakdownRequest):
    user_email = data.user_email
    try:
        entries = await analysis_collection.find({"user_email": user_email}).sort("timestamp", -1).to_list(length=30)
        breakdown = []
        for entry in entries:
            try:
                result = json.loads(entry["analysis_result"])
                score = result.get("sentiment_score", 0)
                mood = result.get("mood", "unknown")
            except Exception:
                score = 0
                mood = "unknown"
            # Handle timestamp serialization
            if isinstance(entry.get("timestamp"), datetime):
                date_str = entry["timestamp"].strftime("%Y-%m-%d")
            else:
                date_str = str(entry.get("timestamp", ""))
            breakdown.append({
                "date": date_str,
                "score": score,
                "mood": mood
            })
        return JSONResponse(content={"mood_data": breakdown})
    except Exception as e:
        logging.error(f"Mood breakdown error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate mood data")
    
@app.post("/analyze-food", response_model=FoodAnalysisResponse)
async def analyze_food(user_email: str = Form(...), file: UploadFile = File(...), timestamp: str = Form(...)):
    try:
        # Check if user exists
        existing_user = await user_collection.find_one({"email": user_email})
        if not existing_user:
            raise HTTPException(status_code=400, detail="User not found")

        # Read uploaded file
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes))
        
        prompt = NUTRITION_TEMPLATE

        genai.configure(api_key=FOOD_API_KEY)
        model = genai.GenerativeModel('gemini-2.0-flash')

        response = model.generate_content(
            [prompt, image],
            generation_config={"temperature": 0.3}
        )

        result_text = response.text.strip()

        if result_text.startswith("```json"):
            result_text = result_text[7:-3].strip()

        try:
            json_compatible_response = json.loads(result_text.replace("'", '"'))
        except json.JSONDecodeError as e:
            logging.error(f"Failed to parse Gemini response: {e}")
            return JSONResponse(status_code=500, content={"error": "Failed to parse response."})

        analysis_data = {
            "email": user_email,
            "foods": json_compatible_response.get("foods", []),
            "overall_calories": json_compatible_response.get("overall_calories",0),
            "overall_health_score": json_compatible_response.get("overall_health_score", 0),
            "timestamp": timestamp
        }

        # Insert analysis data into MongoDB collection
        await food_collection.insert_one(analysis_data)

        # Return the response as JSON
        return JSONResponse(content=json_compatible_response)

    except Exception as e:
        logging.error(f"Error in analyzing food: {e}")
        return JSONResponse(status_code=500, content={"error": "Internal server error."})

# Food history route - fetch past analysis
@app.post("/food-history")
async def get_food_history(user_email: str = Form(...)):
    try:
        # Verify if user exists
        existing_user = await user_collection.find_one({"email": user_email})
        if not existing_user:
            raise HTTPException(status_code=404, detail="User not found.")

        # Fetch user's food analysis history (latest 100 entries)
        history = await food_collection.find({"email": user_email}).sort("timestamp", -1).to_list(length=100)

        # If no history found
        if not history:
            return JSONResponse(content={"message": "No food history found.", "food_history": []})

        # Prepare the response data
        formatted_history = []
        for record in history:
            formatted_history.append({
                "foods": record.get("foods", []),
                "overall_calories": record.get("overall_calories", 0),
                "overall_health_score": record.get("overall_health_score", 0),
                "timestamp": record.get("timestamp", "")
            })

        return JSONResponse(content={
            "message": "Food history retrieved successfully." if formatted_history else "No food history found.",
            "food_history": formatted_history
        })

    except Exception as e:
        logging.error(f"Error fetching food history: {e}")
        return JSONResponse(status_code=500, content={"error": "Internal server error while fetching food history."})


@app.post("/delete-food-history")
async def delete_food_history(user_email: str = Form(...), timestamp: str = Form(...)):
    try:
        # Verify if user exists
        existing_user = await user_collection.find_one({"email": user_email})
        if not existing_user:
            raise HTTPException(status_code=404, detail="User not found.")

        # Find the food entry by user email and timestamp
        result = await food_collection.delete_one({
            "email": user_email,
            "timestamp": timestamp
        })

        if result.deleted_count == 0:
            return JSONResponse(
                status_code=404, 
                content={"message": "Entry not found or already deleted."}
            )

        return JSONResponse(content={
            "message": "Food entry deleted successfully.",
            "deleted": True
        })

    except Exception as e:
        logging.error(f"Error deleting food history: {e}")
        return JSONResponse(
            status_code=500, 
            content={"error": "Internal server error while deleting food history."}
        )
    
@app.post("/exercises")
async def get_exercises(
    name: Optional[str] = Form(None),
    type: Optional[str] = Form(None),
    muscle: Optional[str] = Form(None),
    difficulty: Optional[str] = Form(None),
    offset: Optional[int] = Form(0)
):
    try:
        ninja_api_key = os.getenv("NINJA_API_KEY")
        
        # Prepare query parameters
        params = {}
        if name:
            params['name'] = name
        if type:
            params['type'] = type
        if muscle:
            params['muscle'] = muscle
        if difficulty:
            params['difficulty'] = difficulty
        if offset:
            params['offset'] = offset
            
        # API URL
        api_url = 'https://api.api-ninjas.com/v1/exercises'
        
        # Make the API request
        response = requests.get(
            api_url, 
            params=params,
            headers={'X-Api-Key': ninja_api_key}
        )
        
        # Check if the request was successful
        if response.status_code == 200:
            exercises = response.json()
            return JSONResponse(content={
                "message": "Exercises retrieved successfully.",
                "count": len(exercises),
                "exercises": exercises
            })
        else:
            logging.error(f"API Ninjas error: {response.status_code} - {response.text}")
            return JSONResponse(
                status_code=response.status_code,
                content={"error": f"Failed to retrieve exercises: {response.text}"}
            )
            
    except Exception as e:
        logging.error(f"Error fetching exercises: {e}")
        return JSONResponse(
            status_code=500, 
            content={"error": "Internal server error while fetching exercises."}
        )
    
@app.post("/log-food", response_model=FoodAnalysisResponse)
async def analyze_food(user_email: str = Form(...), food_text: str = Form(...), timestamp: str = Form(...)):
    try:
        # Check if user exists
        existing_user = await user_collection.find_one({"email": user_email})
        if not existing_user:
            raise HTTPException(status_code=400, detail="User not found")
        
        prompt = NUTRITION_TEMPLATE2.replace("{food_text}", food_text)

        # Initialize Groq client
        client = Groq(api_key=os.environ.get("LLM_API_KEY"))
        
        # Call Groq API
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a nutritional analysis AI that responds only with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=1024
        )

        result_text = response.choices[0].message.content.strip()
        
        if "```" in result_text:
            result_text = result_text.split("```")[1].strip()
        try:
            json_compatible_response = json.loads(result_text)
        except json.JSONDecodeError as e:
            logging.error(f"Failed to parse Groq response: {e}")
            return JSONResponse(status_code=500, content={"error": f"Failed to parse response: {str(e)}"})

        analysis_data = {
            "email": user_email,
            "foods": json_compatible_response.get("foods", []),
            "overall_calories": json_compatible_response.get("overall_calories", 0),
            "overall_health_score": json_compatible_response.get("overall_health_score", 0),
            "timestamp": timestamp
        }

        await food_collection.insert_one(analysis_data)

        return JSONResponse(content=json_compatible_response)

    except Exception as e:
        logging.error(f"Error in analyzing food: {e}")
        return JSONResponse(status_code=500, content={"error": f"Internal server error: {str(e)}"})
    
@app.get("/")
def read_root():
    return {"message": "Welcome to Mindscribe API!","status": "200"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app)