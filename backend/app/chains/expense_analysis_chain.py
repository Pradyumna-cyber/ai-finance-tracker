from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from app.services.llm import llm
from app.prompts.finance_prompt import FINANCE_SYSTEM_PROMPT

prompt = ChatPromptTemplate.from_messages([
    ("system", FINANCE_SYSTEM_PROMPT),
    ("human", """
    Analyze the following expenses:

    {expenses}

    Give:
    1. Spending summary
    2. Highest spending category
    3. Overspending warning
    4. Savings suggestions
    5. Financial health score out of 10
    """)
])

expense_analysis_chain = (
    prompt
    | llm
    | StrOutputParser()
)