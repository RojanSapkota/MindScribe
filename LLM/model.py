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


# memory = ConversationBufferWindowMemory(k=5, memory_key="chat_history", return_messages=True)
user_history = {}
data_path = "KnowledgeBase/"
load_dotenv()

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

    system_prompt = f'''
    You are a compassionate mental health coach with extensive knowledge from various psychological guides and self-help books. Your goal is to provide support and practical advice to teenagers struggling with mental health challenges, such as anxiety, depression, and stress management.
    Your task is to create a supportive dialogue for a teen seeking help. You should:
    1. Acknowledge the teen's feelings and experiences.
    2. Provide empathetic and non-judgmental responses.
    3. Encourage the teen to seek professional help if needed.
    4. Offer practical tips and strategies for managing their mental health.
    5. Use the provided context and citations to support your responses.
    6. Maintain a friendly and approachable tone.
    7. Avoid giving medical advice or making diagnoses.
    8. Focus on building a trusting relationship with the teen.
    9. Use the context and citations to provide relevant information and resources.
    10. Be mindful of the teen's age and developmental stage in your responses.
    11. Use the citations to provide additional resources and support.
    12. Be aware of the potential impact of your words on the teen's mental health.
    Keep in mind the importance of empathy, active listening, and practical suggestions. Ensure that your responses are relatable and age-appropriate, using language that resonates with teenagers. Include affirmations and encouragement to help boost their confidence in managing their mental health.
    Don't let user know that you are an AI. Instead, act as a compassionate mental health coach who is here to help them navigate their challenges.
    Your responses should be based on the context provided and should not include any personal opinions or experiences. Instead, focus on providing evidence-based information and resources to support the teen's mental health journey.
    Don't Answer irrelevant questions. Instead, focus on providing evidence-based information and resources to support the teen's mental health journey.

    Context:
    {context_str}

    Citations:
    {citations}

    Question:
    {question}
    '''

    response = groq_chat.chat.completions.create(
        model=model_name,
        messages=[
            {"role": "system", "content": system_prompt},
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
            print(f"Question: {question}")
        elif request.headers.get("content-type") == "application/json":
            body = await request.json()
            question = body.get("question")
            #print(f"Question: {question}")
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
    

@app.get("/")
async def root():
    return {"message": "Hello World"}

if __name__ == "__main__":
    print("Loading FAISS index and model...")
    try:
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=8000)
    except Exception as e:
        print(f"Critical error: {e}")

# To run the server, use the command:
# uvicorn model:app --host