import io
import json
from datetime import datetime

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.chains.finance_chain import finance_chain
from app.schemas.finance_schema import ChatRequest, ExpenseRequest, SalaryInput

router = APIRouter()


@router.post("/upload-expenses")
async def upload_expenses(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="File name is required.")

    contents = await file.read()
    filename = file.filename.lower()

    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith(".xlsx"):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(
                status_code=400,
                detail="Only CSV and XLSX files are supported.",
            )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not parse file: {exc}") from exc

    data = df.to_dict(orient="records")

    return {
        "success": True,
        "rows": len(data),
        "data": data,
    }


@router.post("/analyze-expenses")
async def analyze_expenses(data: ExpenseRequest):
    if not data.expenses:
        raise HTTPException(status_code=400, detail="At least one expense is required.")

    expenses_json = json.dumps(
        [expense.model_dump() for expense in data.expenses],
        indent=2,
    )

    question = f"""
Analyze these expenses:

{expenses_json}

Give:
1. Spending summary
2. Highest spending category
3. Financial health status
4. Overspending warnings
5. Savings suggestions
6. Smart recommendations
7. Safe daily spending estimate
"""

    response = finance_chain.invoke({
        "question": question
    })

    return {
        "success": True,
        "analysis": response,
    }


@router.post("/salary-overview")
async def salary_overview(data: SalaryInput):
    remaining_balance = data.salary - data.spent
    spending_percentage = (data.spent / data.salary) * 100 if data.salary > 0 else 0

    if spending_percentage < 50:
        status = "Healthy"
        color = "green"
    elif spending_percentage < 80:
        status = "Moderate"
        color = "orange"
    else:
        status = "Overspending"
        color = "red"

    safe_daily_spend = remaining_balance / data.days_left if data.days_left > 0 else 0

    return {
        "salary": data.salary,
        "spent": data.spent,
        "remaining_balance": round(remaining_balance, 2),
        "spending_percentage": round(spending_percentage, 2),
        "financial_health": status,
        "status_color": color,
        "safe_daily_spend": round(safe_daily_spend, 2),
        "days_left": data.days_left,
    }


@router.post("/expense-summary")
async def expense_summary(payload: ExpenseRequest):
    category_totals: dict[str, float] = {}

    for item in payload.expenses:
        category_totals[item.category] = category_totals.get(item.category, 0) + item.amount

    highest_category = max(category_totals, key=category_totals.get) if category_totals else None

    return {
        "total_expenses": sum(item.amount for item in payload.expenses),
        "category_breakdown": category_totals,
        "highest_spending_category": highest_category,
    }


@router.post("/recent-transactions")
async def recent_transactions(payload: ExpenseRequest):
    sorted_expenses = sorted(
        payload.expenses,
        key=lambda expense: expense.date or "",
        reverse=True,
    )

    return {
        "transactions": sorted_expenses[:10],
    }


@router.post("/monthly-trend")
async def monthly_trend(payload: ExpenseRequest):
    monthly_data: dict[str, float] = {}

    for expense in payload.expenses:
        month = (expense.date or datetime.now().strftime("%Y-%m"))[:7]
        monthly_data[month] = monthly_data.get(month, 0) + expense.amount

    trend = [
        {
            "month": key,
            "amount": value,
        }
        for key, value in sorted(monthly_data.items())
    ]

    return {
        "trend": trend,
    }


@router.post("/ai-insight")
async def ai_insight(payload: ExpenseRequest):
    total = sum(item.amount for item in payload.expenses)

    if total < 10000:
        insight = "You are managing your spending well."
    elif total < 30000:
        insight = "Your spending is moderate. Monitor discretionary expenses."
    else:
        insight = "Your spending is high this cycle. Consider reducing non-essential purchases."

    return {
        "insight": insight,
    }


@router.post("/category-chart")
async def category_chart(payload: ExpenseRequest):
    categories: dict[str, float] = {}

    for item in payload.expenses:
        categories[item.category] = categories.get(item.category, 0) + item.amount

    chart_data = [
        {
            "name": key,
            "value": value,
        }
        for key, value in categories.items()
    ]

    return {
        "chart_data": chart_data,
    }


@router.post("/chat")
async def chat(req: ChatRequest):
    response = finance_chain.invoke({
        "question": req.message
    })

    return {
        "response": response,
    }
