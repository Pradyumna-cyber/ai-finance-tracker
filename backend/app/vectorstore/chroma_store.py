from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

embedding = OpenAIEmbeddings()

vectorstore = Chroma(
    collection_name="finance_data",
    embedding_function=embedding,
    persist_directory="./chroma_db"
)