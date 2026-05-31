from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from app.services.llm import llm
from app.prompts.finance_prompt import FINANCE_SYSTEM_PROMPT

prompt = ChatPromptTemplate.from_messages([
    ("system", FINANCE_SYSTEM_PROMPT),
    ("human", "{question}")
])

finance_chain = (
    prompt
    | llm
    | StrOutputParser()
)