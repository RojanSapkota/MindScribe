import os
import pickle
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

def load_documents(data_path):
    """
    Loads PDF documents from the specified directory.

    Args:
        data_path (str): Path to the directory containing PDF files.

    Returns:
        list: A list of documents loaded from the directory.
    """
    doc_loader = PyPDFDirectoryLoader(data_path)
    docs = doc_loader.load()
    print(f"Loaded {len(docs)} documents.")
    if not docs:
        raise ValueError("No documents loaded.")
    return docs


def split_text(data):
    """
    Splits documents into smaller chunks and stores document references.

    Args:
        data (list): A list of documents to be split into chunks.

    Returns:
        list: A list of document chunks with metadata.
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=300,  # Adjust chunk size as needed
        chunk_overlap=100,  # Adjust overlap size as needed
        length_function=len,
        add_start_index=True
    )

    chunks = []
    for doc in data:
        # Extract the file name from the source or use a fallback
        source_file = os.path.basename(doc.metadata.get("source", "Unknown"))
        doc.metadata["document_name"] = source_file

        # Split the document text into chunks
        doc_chunks = text_splitter.split_documents([doc])

        # Check if chunks are empty
        if not doc_chunks:
            print(f"Skipping empty chunk from {source_file}")
        else:
            for chunk in doc_chunks:
                chunk.metadata["document_name"] = source_file
            chunks.extend(doc_chunks)

    print(f"Split {len(data)} documents into {len(chunks)} chunks.")
    return chunks


def save_to_faiss(chunks, model_name='all-MiniLM-L6-v2'):
    """
    Saves document chunks to a FAISS index after embedding them.

    Args:
        chunks (list): List of document chunks to be embedded and indexed.
        model_name (str): The name of the SentenceTransformer model to use for embeddings.

    Returns:
        tuple: The FAISS index and document chunks.
    """
    print("Generating embeddings...")
    model = SentenceTransformer(model_name)
    
    embeddings = []
    for chunk in chunks:
        if chunk.page_content.strip():  # Ensure the chunk has content
            embeddings.append(model.encode(chunk.page_content))
        else:
            print(f"Skipping empty chunk: {chunk.metadata.get('document_name')}")
    
    if not embeddings:
        raise ValueError("No valid embeddings generated. Please check chunk content.")
    
    embeddings = np.array(embeddings)

    # Create a FAISS index with embeddings
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    try:
        index.add(embeddings)
    except Exception as e:
        print(f"Error adding embeddings to FAISS index: {e}")
        return None

    # Save the index and chunks to disk
    faiss.write_index(index, "faiss_index")
    with open("stored_chunks.pkl", "wb") as f:
        pickle.dump(chunks, f)

    print(f"Saved {len(chunks)} chunks to FAISS index.")
    return index, chunks


def load_faiss_index():
    """
    Loads the FAISS index and associated chunks from disk, if they exist.

    Returns:
        tuple: The FAISS index and document chunks.

    Raises:
        FileNotFoundError: If the FAISS index or stored chunks do not exist on disk.
    """
    if os.path.exists("faiss_index") and os.path.exists("stored_chunks.pkl"):
        index = faiss.read_index("faiss_index")
        with open("stored_chunks.pkl", "rb") as f:
            chunks = pickle.load(f)
        print("Loaded FAISS index and chunks from disk.")
        return index, chunks
    else:
        raise FileNotFoundError("FAISS index or stored_chunks not found. Please run save_to_faiss() first.")


def load_model(model_name='all-MiniLM-L6-v2'):
    """
    Loads the SentenceTransformer model.

    Args:
        model_name (str): The name of the model to load.

    Returns:
        SentenceTransformer: The loaded SentenceTransformer model.
    """
    return SentenceTransformer(model_name)