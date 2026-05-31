from typing import List, Optional

from pydantic import BaseModel, Field


class Expense(BaseModel):
    category: str
    amount: float = Field(ge=0)
    date: Optional[str] = None
    note: Optional[str] = None
    icon: Optional[str] = None


class ExpenseRequest(BaseModel):
    expenses: List[Expense]


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)


class SalaryInput(BaseModel):
    salary: float = Field(ge=0)
    spent: float = Field(ge=0)
    days_left: int = Field(ge=0)
