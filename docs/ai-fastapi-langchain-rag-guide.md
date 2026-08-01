# AI Finance Tracker: FastAPI, LangChain, RAG, Agents, and GenAI Guide

This document explains the AI concepts used in this project in a way you can use for interviews, viva questions, demos, or project presentations. It connects each concept to the exact files and functions in the codebase.

## 1. Project AI Architecture

The project has a React frontend and a Python FastAPI backend.

High-level flow:

```text
User action in React
  -> frontend service sends request with fetch()
  -> FastAPI route receives validated data
  -> LangChain prompt + OpenAI model generate response
  -> response is sent back to React UI
```

Important files:

- Frontend API caller: `src/services/aiServices.ts`
- AI chat UI: `src/pages/AskAI.tsx`
- AI drawer UI: `src/components/ai/AIAssistantDrawer.tsx`
- Backend app setup: `backend/app/main.py`
- FastAPI routes: `backend/app/routes/finance_routes.py`
- LangChain chain: `backend/app/chains/finance_chain.py`
- LLM configuration: `backend/app/services/llm.py`
- Prompt rules: `backend/app/prompts/finance_prompt.py`
- Pydantic schemas: `backend/app/schemas/finance_schema.py`
- Vector store setup: `backend/app/vectorstore/chroma_store.py`
- LangChain agent setup: `backend/app/agents/finance_agent.py`
- Agent tool: `backend/app/tools/expense_tools.py`

What to say if asked:

> My project uses a React frontend for the finance tracker UI and a FastAPI backend for AI-powered finance analysis. The frontend sends expense data or user questions to FastAPI. FastAPI validates the request using Pydantic and passes the question to a LangChain chain. LangChain formats the prompt, sends it to an OpenAI chat model, parses the response as text, and returns it to the frontend.

## 2. FastAPI Concepts Used

FastAPI is the backend framework. It exposes HTTP endpoints that the React app calls.

### 2.1 App Creation

File: `backend/app/main.py`

```python
app = FastAPI(
    title="AI Finance Tracker API",
    version="1.0.0",
)
```

This creates the API server and gives it metadata. FastAPI also automatically generates API documentation from this setup.

What to say:

> FastAPI creates the backend application object. In this project, the app is named "AI Finance Tracker API" and versioned as 1.0.0. This is the central object where middleware and routes are registered.

### 2.2 CORS Middleware

File: `backend/app/main.py`

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

CORS allows the frontend running on a different origin, for example Vite on `localhost:5173`, to call the backend on `127.0.0.1:8000`.

What to say:

> Since the React frontend and FastAPI backend run on different ports during development, CORS is enabled so the browser allows API calls from the frontend to the backend.

### 2.3 Routers

File: `backend/app/main.py`

```python
from app.routes.finance_routes import router
app.include_router(router)
```

Routes are separated into `finance_routes.py` to keep the backend organized.

What to say:

> I used an APIRouter so finance-related endpoints stay in their own module instead of putting every endpoint directly in `main.py`.

### 2.4 Health Routes

File: `backend/app/main.py`

```python
@app.get("/")
def home():
    return {
        "message": "AI Finance Tracker Backend Running"
    }

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }
```

These are simple routes to check whether the backend is running.

What to say:

> The `/health` endpoint is a simple operational endpoint. It is useful for checking if the API server is alive before testing AI features.

## 3. Pydantic Data Validation

FastAPI uses Pydantic models to validate request bodies.

File: `backend/app/schemas/finance_schema.py`

```python
class Expense(BaseModel):
    category: str
    amount: float = Field(ge=0)
    date: Optional[str] = None
    note: Optional[str] = None
    icon: Optional[str] = None
```

This defines the shape of each expense. `Field(ge=0)` means amount must be greater than or equal to 0.

```python
class ExpenseRequest(BaseModel):
    expenses: List[Expense]
```

This defines the request body for APIs that receive a list of expenses.

```python
class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
```

This ensures chat messages cannot be empty.

```python
class SalaryInput(BaseModel):
    salary: float = Field(ge=0)
    spent: float = Field(ge=0)
    days_left: int = Field(ge=0)
```

This validates salary overview inputs.

What to say:

> Pydantic models act like contracts between frontend and backend. If the frontend sends invalid data, for example a negative amount or empty chat message, FastAPI rejects it before the business logic runs.

## 4. Main FastAPI Endpoints

All main endpoints are in `backend/app/routes/finance_routes.py`.

### 4.1 Upload Expenses

```python
@router.post("/upload-expenses")
async def upload_expenses(file: UploadFile = File(...)):
```

This endpoint accepts a CSV or Excel file, reads it with pandas, and returns the rows as JSON.

Core logic:

```python
if filename.endswith(".csv"):
    df = pd.read_csv(io.BytesIO(contents))
elif filename.endswith(".xlsx"):
    df = pd.read_excel(io.BytesIO(contents))
else:
    raise HTTPException(
        status_code=400,
        detail="Only CSV and XLSX files are supported.",
    )
```

What to say:

> This endpoint supports importing expense data from CSV or Excel. It uses pandas to parse the uploaded file and converts the dataframe into JSON records.

### 4.2 Analyze Expenses With AI

```python
@router.post("/analyze-expenses")
async def analyze_expenses(data: ExpenseRequest):
```

This is one of the main AI endpoints.

It first validates that expenses exist:

```python
if not data.expenses:
    raise HTTPException(status_code=400, detail="At least one expense is required.")
```

Then it converts expenses into JSON:

```python
expenses_json = json.dumps(
    [expense.model_dump() for expense in data.expenses],
    indent=2,
)
```

Then it creates a detailed question:

```python
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
```

Finally it calls the LangChain chain:

```python
response = finance_chain.invoke({
    "question": question
})
```

What to say:

> The `/analyze-expenses` endpoint receives structured expense data, converts it into a clear prompt, and sends it to the LangChain finance chain. The model then generates a spending summary, warnings, suggestions, and safe daily spending guidance.

### 4.3 Chat Endpoint

```python
@router.post("/chat")
async def chat(req: ChatRequest):
    response = finance_chain.invoke({
        "question": req.message
    })

    return {
        "response": response,
    }
```

This endpoint accepts a user message and sends it directly to the finance chain.

What to say:

> The `/chat` endpoint is used for conversational finance questions. The frontend builds a prompt with the user's salary, recent expenses, category totals, and question, then the backend runs that prompt through the LangChain chain.

### 4.4 Non-AI Calculation Endpoints

Some endpoints are deterministic and do not call the LLM:

- `/salary-overview`
- `/expense-summary`
- `/recent-transactions`
- `/monthly-trend`
- `/ai-insight`
- `/category-chart`

Example from `/salary-overview`:

```python
remaining_balance = data.salary - data.spent
spending_percentage = (data.spent / data.salary) * 100 if data.salary > 0 else 0
```

Then the code assigns health status:

```python
if spending_percentage < 50:
    status = "Healthy"
    color = "green"
elif spending_percentage < 80:
    status = "Moderate"
    color = "orange"
else:
    status = "Overspending"
    color = "red"
```

What to say:

> Not every intelligent feature needs an LLM. Some finance insights are better handled with deterministic calculations because they are faster, cheaper, and predictable.

## 5. LangChain Concepts Used

LangChain helps connect prompts, models, parsers, tools, and agents.

### 5.1 LLM Setup

File: `backend/app/services/llm.py`

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0.3,
    api_key=os.getenv("OPENAI_API_KEY")
)
```

This creates the model object used by chains and agents.

Important concepts:

- `ChatOpenAI`: LangChain wrapper around OpenAI chat models.
- `model="gpt-4o-mini"`: the model used for responses.
- `temperature=0.3`: controls creativity. Lower values make answers more focused and consistent.
- `OPENAI_API_KEY`: loaded from environment variables using `python-dotenv`.

What to say:

> The project uses LangChain's `ChatOpenAI` wrapper. I set temperature to 0.3 because finance advice should be consistent and practical rather than overly creative.

### 5.2 Prompt Template

File: `backend/app/chains/finance_chain.py`

```python
prompt = ChatPromptTemplate.from_messages([
    ("system", FINANCE_SYSTEM_PROMPT),
    ("human", "{question}")
])
```

This creates a two-message chat prompt:

- system message: permanent behavior rules
- human message: the actual user question

The system prompt is in `backend/app/prompts/finance_prompt.py`:

```python
FINANCE_SYSTEM_PROMPT = """
You are an expert Indian financial advisor AI.

IMPORTANT RULES:

1. Always use Indian Rupees symbol ₹
2. Never use $
3. Keep responses concise and modern
4. Avoid markdown formatting
5. Focus on:
   - overspending
   - financial health
   - spending risks
   - smart savings suggestions
...
"""
```

What to say:

> The system prompt controls the assistant's personality and boundaries. In this project, the assistant is configured as an Indian finance advisor that uses rupees, keeps responses short, and focuses on overspending, financial health, and savings suggestions.

### 5.3 LangChain Expression Language Chain

File: `backend/app/chains/finance_chain.py`

```python
finance_chain = (
    prompt
    | llm
    | StrOutputParser()
)
```

This is LangChain Expression Language, also called LCEL.

It means:

```text
prompt formats the input
  -> llm generates a response
  -> StrOutputParser converts the model output to plain string
```

What to say:

> The finance chain is a pipeline. The input question goes into the prompt template, the formatted prompt goes into the OpenAI model, and the model response is parsed into a plain string before returning to FastAPI.

### 5.4 Invoking a Chain

File: `backend/app/routes/finance_routes.py`

```python
response = finance_chain.invoke({
    "question": req.message
})
```

The key `"question"` matches `{question}` in the prompt template.

What to say:

> Chain invocation passes a dictionary of variables. The `question` value replaces `{question}` in the prompt template.

### 5.5 Separate Expense Analysis Chain

File: `backend/app/chains/expense_analysis_chain.py`

```python
expense_analysis_chain = (
    prompt
    | llm
    | StrOutputParser()
)
```

This chain is similar to `finance_chain`, but its human prompt is specifically designed for expense analysis.

Current status:

- The file exists.
- The active `/analyze-expenses` route currently imports and uses `finance_chain`, not `expense_analysis_chain`.

What to say:

> The project contains a specialized expense analysis chain, but the current route uses the more general finance chain. The specialized chain could be connected later if we want to separate chat behavior from expense-analysis behavior.

## 6. RAG Concepts and Project Status

RAG means Retrieval-Augmented Generation.

Simple explanation:

```text
User asks a question
  -> convert question into embedding
  -> search vector database for relevant documents
  -> add retrieved context to prompt
  -> LLM answers using retrieved context
```

Why RAG is useful:

- It gives the model project-specific or user-specific knowledge.
- It reduces hallucination by grounding answers in retrieved data.
- It allows the model to answer from data that was not part of its original training.

### 6.1 Vector Store Setup in This Project

File: `backend/app/vectorstore/chroma_store.py`

```python
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

embedding = OpenAIEmbeddings()

vectorstore = Chroma(
    collection_name="finance_data",
    embedding_function=embedding,
    persist_directory="./chroma_db"
)
```

This creates:

- an embedding model using OpenAI embeddings
- a Chroma vector database
- a persistent directory called `./chroma_db`
- a collection named `finance_data`

What embeddings are:

> Embeddings convert text into numerical vectors. Similar meanings produce vectors that are close to each other. This allows semantic search instead of exact keyword matching.

What Chroma is:

> Chroma is a vector database. It stores embeddings and retrieves the most semantically similar documents for a query.

### 6.2 Is Full RAG Currently Implemented?

Current status: partially prepared, not fully connected.

The project has vector store setup in `chroma_store.py`, but the active routes do not currently:

- add expense documents to Chroma
- retrieve documents from Chroma
- inject retrieved documents into the prompt

The current `/chat` and `/analyze-expenses` flow is:

```text
frontend prompt/data
  -> FastAPI
  -> LangChain prompt
  -> OpenAI model
  -> text response
```

A full RAG flow would be:

```text
frontend question
  -> FastAPI
  -> vectorstore.similarity_search(question)
  -> retrieved finance documents
  -> prompt with retrieved context
  -> OpenAI model
  -> grounded answer
```

What to say if asked whether the project uses RAG:

> The project has the foundation for RAG because it defines a Chroma vector store with OpenAI embeddings. However, the current production flow does not yet perform retrieval before answering. Right now the AI answers are generated from the prompt context sent by the frontend and backend. To make it full RAG, I would add expense records or finance documents to Chroma, retrieve relevant records during `/chat`, and pass those retrieved records into the LangChain prompt.

### 6.3 How RAG Could Fit This Finance Tracker

Possible RAG documents:

- past expenses
- salary cycles
- budget rules
- user spending history summaries
- uploaded CSV/XLSX rows
- personal finance knowledge base

Example interview answer:

> In this app, RAG could be used to retrieve the user's past spending patterns before answering. For example, if the user asks, "Why was my spending high this month?", the backend could retrieve similar previous salary cycles, top categories, and relevant transactions from Chroma, then ask the LLM to compare them.

## 7. AI Agent Concepts Used

An AI agent is different from a simple chain.

Simple chain:

```text
input -> prompt -> LLM -> output
```

Agent:

```text
input -> LLM decides what tool to use -> tool runs -> LLM observes result -> final answer
```

### 7.1 Agent Setup

File: `backend/app/agents/finance_agent.py`

```python
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
```

This creates a LangChain agent with one tool.

Important concepts:

- `tools=[calculate_total_expense]`: gives the agent an external function it can call.
- `AgentType.ZERO_SHOT_REACT_DESCRIPTION`: the agent uses tool descriptions to decide what to do.
- `verbose=True`: prints reasoning/tool steps in logs.

What ReAct means:

> ReAct stands for Reasoning and Acting. The model reasons about what it needs, chooses an action/tool, observes the result, and then produces an answer.

### 7.2 Agent Tool

File: `backend/app/tools/expense_tools.py`

```python
from langchain.tools import tool

@tool
def calculate_total_expense(expenses: list):
    """Calculate total expenses."""

    return sum(item["amount"] for item in expenses)
```

The `@tool` decorator turns a normal Python function into a LangChain tool.

What to say:

> The agent has a `calculate_total_expense` tool. Instead of making the LLM calculate totals from text, the agent can call a Python function and get an accurate numeric result.

### 7.3 Current Agent Status

Current status:

- The agent is defined.
- The tool is defined.
- The current FastAPI routes do not call this agent yet.

What to say:

> The codebase includes a LangChain agent prototype, but the main API currently uses chains. The next step would be adding a route that calls `agent.invoke()` for questions where tool use is needed, such as total spending, category totals, or budget calculations.

## 8. Frontend AI Integration

The frontend talks to the backend through `fetch`.

File: `src/services/aiServices.ts`

```typescript
const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
```

This uses an environment variable if available, otherwise defaults to local FastAPI.

### 8.1 Analyze Expenses API Call

```typescript
export const analyzeExpenses = async (expenses: any[]) => {
  const response = await fetch(`${API_URL}/analyze-expenses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      expenses,
    }),
  });
```

This sends expenses to the backend.

Error handling:

```typescript
if (!response.ok) {
  const detail =
    typeof data?.detail === "string"
      ? data.detail
      : "Failed to analyze expenses.";
  throw new Error(detail);
}
```

What to say:

> The frontend service isolates API communication. Components call `analyzeExpenses`, and this service handles the HTTP request, JSON body, and error handling.

### 8.2 Ask Finance Question API Call

```typescript
export const askFinanceQuestion = async (message: string) => {
  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
    }),
  });
```

This sends the user question to `/chat`.

What to say:

> Chat questions go through the same backend AI system, but instead of sending only raw text, the UI builds a finance-specific prompt with salary cycle data, category totals, and recent expenses.

## 9. AI Chat Prompt Construction in Frontend

File: `src/pages/AskAI.tsx`

The frontend prepares context before asking the LLM.

### 9.1 Selecting Relevant Expenses

```typescript
const getExpensesToAnalyze = () => {
  const currentCycle = getSalaryCycleForDate(
    new Date(),
    salaryCreditType,
    fixedCreditDate
  );
  const debitExpenses = expenses.filter(isDebitTransaction);
  const currentCycleExpenses = debitExpenses.filter(
    (expense) =>
      expense.salaryCycleId === currentCycle.id
  );

  return {
    currentCycle,
    expensesToAnalyze:
      currentCycleExpenses.length > 0
        ? currentCycleExpenses
        : debitExpenses,
  };
};
```

This prefers expenses from the current salary cycle. If there are none, it falls back to all debit expenses.

What to say:

> The app is salary-cycle aware. Instead of blindly analyzing all expenses, it first tries to analyze the current salary cycle, which makes the answer more relevant to the user's current financial situation.

### 9.2 Building Context for Chat

File: `src/pages/AskAI.tsx`

```typescript
const buildQuestionPrompt = (question: string) => {
  const { currentCycle, expensesToAnalyze } =
    getExpensesToAnalyze();
  const totalSpent = expensesToAnalyze.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
```

The function calculates:

- current salary cycle
- total spending
- days until salary
- category totals
- recent expenses

Then it returns a full prompt:

```typescript
return `
You are an AI finance copilot for a personal expense tracker. Answer in a practical, concise way using the user's actual data...

User question:
${question}

Context:
- Monthly salary: ${formatCurrency(monthlySalary)}
- Salary cycle: ${currentCycle.name}
- Next salary date: ${currentCycle.nextSalaryDate.toLocaleDateString("en-IN")}
- Days until next salary: ${daysToSalary}
- Total spending analyzed: ${formatCurrency(totalSpent)}
- Category totals: ${JSON.stringify(categoryTotals)}
- Recent expenses: ${JSON.stringify(recentExpenses)}
...
`;
```

What to say:

> The frontend does prompt enrichment. It does not just send the user's question. It adds structured financial context such as salary, salary cycle, days until salary, category totals, and recent expenses. This gives the LLM enough context to answer personally.

### 9.3 Guarding Non-Finance Questions

File: `src/pages/AskAI.tsx`

```typescript
const FINANCE_KEYWORDS = [
  "salary",
  "budget",
  "expense",
  "spend",
  ...
];
```

```typescript
const isFinanceQuestion = (question: string) => {
  const normalized = question.toLowerCase();
  return FINANCE_KEYWORDS.some((keyword) => new RegExp(`\\b${keyword}\\b`).test(normalized));
};
```

If the question is not finance-related:

```typescript
content:
  "I do not know about that. This assistant only answers questions about your personal finance records and current account details.",
```

What to say:

> The UI includes a basic domain guard. It checks for finance keywords before sending the question to the backend, which helps keep the assistant focused on personal finance and reduces unnecessary LLM calls.

## 10. AI Expense Analysis UI Logic

File: `src/pages/AskAI.tsx`

When the user clicks analyze, the app:

1. selects current salary-cycle expenses
2. maps category IDs into readable category names
3. groups expenses by category
4. calculates percentages
5. marks category status as healthy, moderate, or overspending
6. calls backend AI analysis
7. combines LLM response with deterministic recommendations

### 10.1 Formatting Expenses for Backend

```typescript
const formattedExpenses =
  expensesToAnalyze.map((expense) => {
    const matchedCategory =
      categories.find(
        (cat) => cat.id === expense.categoryId
      );

    return {
      category: matchedCategory?.name || "Other",
      icon: matchedCategory?.icon || "💰",
      amount: expense.amount,
      date: expense.date,
      note: expense.note || expense.description,
    };
  });
```

What to say:

> Before sending expenses to the backend, the frontend converts internal category IDs into human-readable category names. This improves the quality of the LLM response because the model sees names like Food or Travel instead of internal IDs.

### 10.2 Category Analysis

```typescript
const categoryAnalysis = Object.entries(groupedExpenses)
  .map(([category, amount]) => {
    const percentage = (amount / totalSpent) * 100;
    let status = "healthy";

    if (
      percentage > 40 &&
      !["emi", "sip", "rd"].includes(
        category.toLowerCase()
      )
    ) {
      status = "overspending";
    } else if (percentage > 25) {
      status = "moderate";
    }
```

This determines whether a category is normal, moderate, or overspending.

What to say:

> The app combines deterministic calculations with AI. Category percentages and overspending status are calculated in code, while natural-language explanation is generated by the LLM.

### 10.3 Spending Health

File: `src/pages/AskAI.tsx`

```typescript
const getSpendingHealth = (
  totalSpent: number,
  monthlySalary: number,
  categoryData: CategoryAnalysis[]
) => {
```

This function classifies the user's spending phase:

- `good`
- `careful`
- `bad`

Important logic:

```typescript
if (
  (ratio !== null && ratio >= 0.8) ||
  hasLargeFlexibleCategory
) {
  phase = "bad";
} else if (
  (ratio !== null && ratio >= 0.5) ||
  topCategory?.percentage > 30
) {
  phase = "careful";
}
```

What to say:

> Spending health is not purely AI-generated. The app uses clear threshold rules: if spending is above 80% of salary or one flexible category dominates, it is a bad phase; if spending crosses 50% or a top category is high, it is a careful phase.

## 11. Deterministic AI-Like Salary Insight

Some files under `src/ai` look like AI architecture but currently produce rule-based output.

Important files:

- `src/ai/services/buildSalaryInsightInput.ts`
- `src/ai/services/salaryInsightService.ts`
- `src/ai/schemas/salaryInsightSchema.ts`
- `src/ai/prompts/salaryInsightPrompt.ts`

### 11.1 Building Salary Insight Input

File: `src/ai/services/buildSalaryInsightInput.ts`

```typescript
export function buildSalaryInsightInput(date: Date = new Date()): SalaryInsightInput {
```

This gathers state from stores:

```typescript
const { expenses } = useExpenseStore.getState();
const { categories } = useCategoryStore.getState();
const { monthlySalary, salaryCreditType, fixedCreditDate } = useBudgetStore.getState();
```

It calculates:

- current salary cycle
- previous salary cycle
- current spending
- previous spending
- net cash flow
- remaining balance
- daily spending pace
- safe daily spend
- predicted savings
- top categories

Example:

```typescript
const dailySpendingPace = spent / elapsedDays;
const safeDailySpend = daysUntilSalary > 0 ? remaining / daysUntilSalary : remaining;
const predictedSavings = Math.max(0, monthlySalary - dailySpendingPace * totalCycleDays);
```

What to say:

> This function transforms raw app state into a clean AI-style input object. It collects salary, spending, days left, predicted savings, and top categories so the insight generator can produce a dashboard recommendation.

### 11.2 Salary Insight Schema

File: `src/ai/schemas/salaryInsightSchema.ts`

```typescript
export interface SalaryInsightInput {
  cycleId: string;
  cycleLabel: string;
  cycleStartDate: string;
  cycleEndDate: string;
  salary: number;
  spent: number;
  remaining: number;
  daysUntilSalary: number;
  ...
}
```

```typescript
export interface SalaryInsightOutput {
  riskLevel: SalaryInsightRiskLevel;
  headline: string;
  message: string;
  recommendedAction: string;
  predictedSavingsText: string;
}
```

What to say:

> The schema defines the input and output contract for salary insights. This makes the feature predictable because the UI knows exactly what fields it will receive.

### 11.3 Rule-Based Salary Insight Generation

File: `src/ai/services/salaryInsightService.ts`

```typescript
const getRiskLevel = (input: SalaryInsightInput): SalaryInsightRiskLevel => {
  const spentPercent = input.salary > 0 ? (input.spent / input.salary) * 100 : 0;
  const projectedOverspend = input.predictedSavings <= 0 && input.spent > 0;

  if (spentPercent >= 85 || projectedOverspend) return 'high';
  if (spentPercent >= 60 || input.percentageChangeFromPreviousCycle > 25) return 'medium';
  return 'low';
};
```

This calculates risk without using an LLM.

What to say:

> Salary insights are deterministic. The app calculates risk level using spending percentage, projected savings, and change from the previous cycle. This is more reliable for dashboard cards than asking an LLM every time.

## 12. Voice Assistant: Aira

The project has a voice assistant named Aira. It is agent-like from a user experience perspective, but technically it is mostly rule-based intent detection plus browser speech APIs.

Important files:

- `src/components/voice/AiraAssistant.tsx`
- `src/services/voice/AiraIntentService.ts`
- `src/services/voice/VoiceParser.ts`
- `src/services/voice/VoiceRecognitionService.ts`
- `src/services/voice/TextToSpeech.ts`
- `src/services/voice/VoiceExpenseButton.tsx`

### 12.1 Speech Recognition

File: `src/services/voice/VoiceRecognitionService.ts`

```typescript
static isSupported() {
  return typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}
```

This checks whether the browser supports speech recognition.

The service creates recognition:

```typescript
const recognition = new Recognition();
recognition.continuous = this.options.continuous;
recognition.interimResults = this.options.interimResults;
recognition.lang = this.options.lang;
```

Default language:

```typescript
lang: options.lang ?? 'en-IN',
```

What to say:

> Aira uses the browser's SpeechRecognition API. It listens in Indian English, captures transcripts, and sends final/interim text to the assistant UI.

### 12.2 Text to Speech

File: `src/services/voice/TextToSpeech.ts`

```typescript
const utterance = new SpeechSynthesisUtterance(text);
utterance.lang = 'en-IN';
utterance.rate = options.rate ?? 0.95;
utterance.pitch = options.pitch ?? 1;
```

What to say:

> Text-to-speech uses the browser's SpeechSynthesis API. After Aira understands a command, it speaks the response back to the user.

### 12.3 Voice Expense Parsing

File: `src/services/voice/VoiceParser.ts`

```typescript
export class RuleBasedVoiceParser implements VoiceExpenseParser {
  parseExpense(transcript: string, categories: Category[]): VoiceParseResult {
    const normalizedTranscript = normalize(transcript);
    const amount = findAmount(normalizedTranscript);
    const category = findCategory(normalizedTranscript, categories);
    const note = extractNote(transcript, normalizedTranscript, amount, category);
```

This parser extracts:

- amount
- category
- note

Example:

```text
"Add 450 for food at restaurant"
```

can become:

```text
amount: 450
category: Food
note: Restaurant
```

What to say:

> Voice expense creation is rule-based. The parser normalizes speech text, extracts numeric or spoken amounts, matches categories using aliases, and extracts notes from phrases like "at restaurant" or "with note".

### 12.4 Spoken Number Support

File: `src/services/voice/VoiceParser.ts`

The parser supports words:

```typescript
const SMALL_NUMBERS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  ...
};
```

It also supports:

```typescript
const TENS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  ...
};
```

And larger units:

```typescript
'hundred',
'thousand',
'lakh',
```

What to say:

> Aira can parse spoken amounts like "five hundred" or "two thousand" because the parser converts number words into numeric values.

### 12.5 Intent Resolution

File: `src/services/voice/AiraIntentService.ts`

The intent service classifies what the user wants:

```typescript
export type AiraIntent =
  | { type: 'add_expense'; expense: PendingVoiceExpense; missingFields: Array<'amount' | 'category'> }
  | { type: 'answer'; response: string }
  | { type: 'navigate'; path: string; response: string }
  | { type: 'help'; response: string }
  | { type: 'unknown'; response: string };
```

It identifies add-expense commands:

```typescript
const isExpenseIntent = (text: string) =>
  /\b(add|record|paid|pay|bought|purchase)\b/i.test(text);
```

It identifies navigation commands:

```typescript
const isNavigationIntent = (text: string) =>
  /\b(open|go to|show|take me to)\b/i.test(text);
```

What to say:

> Aira uses intent classification. It detects whether the user wants to add an expense, ask a finance question, navigate to a page, or get help.

### 12.6 Aira Assistant Flow

File: `src/components/voice/AiraAssistant.tsx`

The assistant has modes:

```typescript
type AiraMode = 'idle' | 'wake' | 'command' | 'processing' | 'confirming' | 'answering';
```

Flow:

```text
idle
  -> user clicks microphone
  -> command
  -> transcript captured
  -> processing
  -> intent resolved
  -> confirming if adding expense
  -> saving after yes
  -> answering
```

Saving expense:

```typescript
addExpense({
  id: generateId(),
  amount: expense.amount,
  categoryId: expense.categoryId,
  note: expense.note || '',
  date: new Date(),
  createdAt: new Date(),
});
```

What to say:

> Aira is a voice-driven assistant. It listens to speech, converts it to text, resolves intent, asks for confirmation when adding expenses, and then saves the expense into the app store.

## 13. GenAI Concepts in This Project

### 13.1 Prompt Engineering

Prompt engineering means writing instructions and context so the model gives useful output.

Used in:

- `backend/app/prompts/finance_prompt.py`
- `src/pages/AskAI.tsx` `buildQuestionPrompt`
- `src/components/ai/AIAssistantDrawer.tsx` `buildQuestionPrompt`
- `src/ai/prompts/salaryInsightPrompt.ts`

Example backend prompt rule:

```python
1. Always use Indian Rupees symbol ₹
2. Never use $
3. Keep responses concise and modern
```

Example frontend prompt context:

```typescript
- Monthly salary: ${formatCurrency(monthlySalary)}
- Days until next salary: ${daysToSalary}
- Category totals: ${JSON.stringify(categoryTotals)}
- Recent expenses: ${JSON.stringify(recentExpenses)}
```

What to say:

> Prompt engineering in this project happens in two places. The backend system prompt defines behavior and formatting rules. The frontend builds user-specific context so the assistant can answer based on real finance data.

### 13.2 Grounding

Grounding means giving the model real data instead of asking it to guess.

In this project, grounding happens by adding:

- monthly salary
- salary cycle
- category totals
- recent expenses
- total spending
- days until next salary

What to say:

> The model is grounded with the user's actual finance data. This helps it answer questions like "Can I buy something expensive?" using current salary, days left, and recent spending instead of giving generic advice.

### 13.3 Hallucination Control

The project reduces hallucination by:

- limiting the assistant to finance topics
- passing actual data into prompts
- using deterministic calculations for totals and risk
- telling the model not to speculate
- using Pydantic validation on backend input

Frontend guard:

```typescript
if (!isFinanceQuestion(cleanQuestion)) {
  setChatMessages([
    userMessage,
    {
      role: "assistant",
      content:
        "I do not know about that. This assistant only answers questions about your personal finance records and current account details.",
    },
  ]);
```

What to say:

> The app controls hallucination by restricting the domain, giving the model structured data, and calculating important numeric values in code instead of relying on the LLM.

### 13.4 LLM vs Traditional Logic

LLM is used for:

- natural language finance analysis
- conversational answers
- summarizing spending patterns
- explaining recommendations

Traditional logic is used for:

- totals
- percentages
- salary remaining
- safe daily spend
- category grouping
- risk level
- voice command parsing

What to say:

> I intentionally use the LLM for language and reasoning, but use code for exact calculations. That makes the system more reliable and cost-effective.

## 14. End-to-End Example: "Analyze My Spending"

Frontend file: `src/pages/AskAI.tsx`

Backend files:

- `backend/app/routes/finance_routes.py`
- `backend/app/chains/finance_chain.py`
- `backend/app/services/llm.py`
- `backend/app/prompts/finance_prompt.py`

Flow:

```text
User clicks "Analyze my spending"
  -> handleAnalyze() runs in React
  -> current salary-cycle expenses are selected
  -> expenses are formatted with category names
  -> category totals and percentages are calculated
  -> analyzeExpenses(formattedExpenses) calls POST /analyze-expenses
  -> FastAPI validates ExpenseRequest
  -> route builds a finance analysis question
  -> finance_chain.invoke({"question": question})
  -> ChatPromptTemplate formats system + human messages
  -> ChatOpenAI calls gpt-4o-mini
  -> StrOutputParser returns plain text
  -> FastAPI returns {"success": true, "analysis": response}
  -> React combines AI analysis with spending phase and recommendations
```

What to say:

> When the user clicks analyze, the frontend prepares clean expense data and also calculates category-level signals. The backend then sends the structured expenses to the LangChain finance chain. The final UI combines LLM-generated explanation with deterministic spending health logic.

## 15. End-to-End Example: "Can I Buy Something Expensive?"

Frontend file: `src/pages/AskAI.tsx`

When the user asks a buying question, `buildQuestionPrompt` includes:

```typescript
For buying questions, compare options like wait and save, pay fully, split payment, EMI/credit card, and what amount is safe to spend now.
```

It also includes:

```typescript
- Monthly salary
- Next salary date
- Days until salary
- Total spending analyzed
- Category totals
- Recent expenses
```

What to say:

> The buying advice is generated from the user's current salary cycle context. The prompt asks the model to compare options like waiting, paying fully, split payment, EMI, or credit card, while also considering safe spend based on remaining cycle data.

## 16. End-to-End Example: Voice Expense

Files:

- `src/components/voice/AiraAssistant.tsx`
- `src/services/voice/VoiceRecognitionService.ts`
- `src/services/voice/AiraIntentService.ts`
- `src/services/voice/VoiceParser.ts`
- `src/services/voice/TextToSpeech.ts`

Flow:

```text
User clicks mic
  -> VoiceRecognitionService starts browser recognition
  -> transcript is captured
  -> AiraAssistant waits for silence
  -> processCommand() runs
  -> airaIntentService.resolve() classifies intent
  -> voiceParser.parseExpense() extracts amount/category/note
  -> Aira asks for confirmation
  -> user says yes
  -> saveExpense() stores expense in Zustand store
  -> TextToSpeechService speaks confirmation
```

What to say:

> Aira is a rule-based voice assistant. It uses browser speech recognition for input, regular expressions and category aliases for intent parsing, confirmation flow for safety, and browser text-to-speech for responses.

## 17. Common Interview Questions and Answers

### Q1. What is LangChain in your project?

> LangChain is used to build the AI pipeline. In `finance_chain.py`, I use a prompt template, an OpenAI chat model, and a string output parser. The chain takes a finance question, formats it with system rules, sends it to the model, and returns a plain text response.

### Q2. What is the difference between a chain and an agent?

> A chain follows a fixed sequence: prompt, model, parser. An agent can decide which tool to call before answering. My active endpoints currently use chains, while the codebase also has an agent prototype with a `calculate_total_expense` tool.

### Q3. Does your project use RAG?

> It has the foundation for RAG through Chroma and OpenAI embeddings in `chroma_store.py`, but retrieval is not yet connected to the active chat routes. The current system grounds the model by sending finance context in the prompt. Full RAG would add similarity search from Chroma before generating answers.

### Q4. Why use FastAPI?

> FastAPI gives a clean Python backend with async support, Pydantic validation, automatic docs, and simple route definitions. It works well for AI APIs because request data can be validated before being passed to LangChain.

### Q5. Why not let the LLM calculate everything?

> LLMs can make mistakes with arithmetic. So the project calculates totals, percentages, salary remaining, risk levels, and safe daily spend in code. The LLM is mainly used for summarizing and explaining insights in natural language.

### Q6. How do you reduce hallucination?

> I reduce hallucination by giving the model real user finance context, using a strong system prompt, restricting the frontend assistant to finance questions, and calculating important numbers deterministically.

### Q7. What is temperature?

> Temperature controls randomness. I use `temperature=0.3` in `llm.py`, which keeps finance responses more consistent and less creative.

### Q8. What is a vector database?

> A vector database stores embeddings, which are numerical representations of text. It can retrieve semantically similar records. In this project, Chroma is configured as the vector store for future RAG-style finance retrieval.

### Q9. What are embeddings?

> Embeddings convert text into vectors. Similar text has similar vectors. For example, "food delivery spending" and "restaurant expenses" should be close in vector space, so a vector database can retrieve related records.

### Q10. How does the AI chat know my expenses?

> The frontend builds a prompt using current salary cycle data, category totals, recent expenses, salary amount, and days until next salary. That prompt is sent to `/chat`, and the backend sends it to the LangChain chain.

### Q11. Is Aira an LLM agent?

> Aira is agent-like in user experience, but technically it is mostly rule-based. It uses speech recognition, intent rules, category aliases, and confirmation states. The LangChain agent exists separately in the backend but is not yet connected to Aira.

### Q12. What would you improve next?

> I would connect the Chroma vector store to the chat endpoint for full RAG, add an endpoint that uses the LangChain agent for tool-based calculations, add authentication, tighten CORS for production, and add tests for API routes and voice parsing.

## 18. Strengths of This Project's AI Design

- Uses FastAPI and Pydantic for clean backend validation.
- Separates prompt, model config, routes, schemas, tools, and vector store.
- Uses LangChain LCEL for a readable AI chain.
- Uses deterministic calculations for important numeric finance logic.
- Sends real user context to the LLM instead of asking generic questions.
- Has a foundation for RAG with Chroma and embeddings.
- Has a foundation for agents with LangChain tools.
- Includes a voice assistant with speech recognition, text-to-speech, intent detection, and confirmation.

## 19. Limitations You Should Be Honest About

- Full RAG is not yet active because retrieval is not connected to chat routes.
- The LangChain agent is defined but not currently used by API routes.
- The backend allows all CORS origins, which is fine for development but should be restricted in production.
- Some frontend AI-like salary insights are rule-based, not LLM-generated.
- Financial advice should remain general and educational, not professional investment advice.

What to say:

> The project is honest about where AI is used. The main AI flow is LangChain plus OpenAI for finance chat and analysis. RAG and agents have foundation files but are not fully wired into the active endpoints yet. Deterministic logic is used wherever accuracy matters.

## 20. Short 60-Second Project Explanation

> This is an AI-powered personal finance tracker. The frontend is built in React and stores expenses, categories, salary cycles, and budgets. For AI features, React sends expense data or finance questions to a FastAPI backend. FastAPI validates requests with Pydantic and passes the prompt to a LangChain chain. The chain uses a finance-specific system prompt, an OpenAI chat model, and a string parser to return user-friendly financial insights. The app also calculates totals, spending phases, salary remaining, safe daily spend, and category risk using deterministic logic, because those values need to be accurate. The project also has a Chroma vector store setup for future RAG and a LangChain agent prototype with an expense calculation tool. On the frontend, Aira provides voice-based expense entry and finance answers using browser speech recognition, text-to-speech, and rule-based intent parsing.

