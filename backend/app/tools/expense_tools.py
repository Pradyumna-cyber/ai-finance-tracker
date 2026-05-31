from langchain.tools import tool

@tool
def calculate_total_expense(expenses: list):
    """Calculate total expenses."""

    return sum(item["amount"] for item in expenses)