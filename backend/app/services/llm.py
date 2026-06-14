import os
from pathlib import Path

from dotenv import load_dotenv

from langchain_openai import ChatOpenAI

load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.3,
    api_key=os.getenv("OPENAI_API_KEY")
    
)
