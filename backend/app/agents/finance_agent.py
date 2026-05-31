from langchain.agents import initialize_agent
from langchain.agents import AgentType

from app.services.llm import llm
from app.tools.expense_tools import calculate_total_expense

agent = initialize_agent(
    tools=[calculate_total_expense],
    llm=llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True
)