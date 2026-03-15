from typing import Annotated, List, Any, Optional, Dict
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver
from langchain_openai import ChatOpenAI
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from backend.wingman_tools import get_tools
from datetime import datetime
import uuid

load_dotenv(override=True)

EVALUATOR_PREFIX = "Evaluator Feedback on this answer:"


class State(TypedDict):
    messages: Annotated[List[Any], add_messages]
    success_criteria: str
    feedback_on_work: Optional[str]
    success_criteria_met: bool
    user_input_needed: bool
    turn_count: int


class EvaluatorOutput(BaseModel):
    feedback: str = Field(description="Feedback on the assistant's response")
    success_criteria_met: bool = Field(description="Whether the success criteria have been met")
    user_input_needed: bool = Field(
        description="True if more input is needed from the user, or the assistant is stuck"
    )


class Wingman:
    """
    Stateless LangGraph worker-evaluator agent.

    Each call to run_superstep reconstructs the full conversation from `history`
    so no persistent checkpointer is required — safe for Lambda cold/warm starts.
    """

    MAX_TURNS = 5

    def __init__(self):
        self.tools = None
        self.worker_llm_with_tools = None
        self.evaluator_llm_with_output = None
        self.graph = None

    def setup(self):
        """Synchronous setup — called once at module level (reused across warm Lambda invocations)."""
        self.tools = get_tools()
        worker_llm = ChatOpenAI(model="gpt-4o-mini")
        self.worker_llm_with_tools = worker_llm.bind_tools(self.tools)
        evaluator_llm = ChatOpenAI(model="gpt-4o-mini")
        self.evaluator_llm_with_output = evaluator_llm.with_structured_output(EvaluatorOutput)
        self._build_graph()

    # ── Graph nodes ────────────────────────────────────────────────────────────

    def worker(self, state: State) -> Dict[str, Any]:
        system_message = f"""You are a helpful assistant that can use tools to complete tasks.
You keep working on a task until either you have a question or clarification for the user, or the success criteria is met.
You have tools to browse the internet, run Python code, read/write files, and search Wikipedia.
If you run Python code, include print() statements to receive output.
The current date and time is {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

This is the success criteria:
{state["success_criteria"]}

Reply either with a question for the user, or with your final answer.
If you have a question, state it clearly:
  Question: please clarify whether you want a summary or a detailed answer

If finished, reply with the final answer only — don't ask a question.
"""

        if state.get("feedback_on_work"):
            system_message += f"""
Previously you thought you completed the assignment, but your reply was rejected because the success criteria was not met.
Feedback:
{state["feedback_on_work"]}
Please continue the assignment, ensuring that you meet the success criteria or have a question for the user."""

        messages = list(state["messages"])
        found = any(isinstance(m, SystemMessage) for m in messages)
        if not found:
            messages = [SystemMessage(content=system_message)] + messages
        else:
            for m in messages:
                if isinstance(m, SystemMessage):
                    m.content = system_message

        response = self.worker_llm_with_tools.invoke(messages)
        return {"messages": [response]}

    def worker_router(self, state: State) -> str:
        last = state["messages"][-1]
        return "tools" if (hasattr(last, "tool_calls") and last.tool_calls) else "evaluator"

    def evaluator(self, state: State) -> Dict[str, Any]:
        last_response = state["messages"][-1].content

        conversation = "Conversation history:\n\n"
        for m in state["messages"]:
            if isinstance(m, HumanMessage):
                conversation += f"User: {m.content}\n"
            elif isinstance(m, AIMessage):
                conversation += f"Assistant: {m.content or '[tool use]'}\n"

        user_message = f"""You are evaluating a conversation between the User and Assistant.

{conversation}

Success criteria:
{state["success_criteria"]}

Assistant's last response:
{last_response}

Decide if the success criteria is met.

For user_input_needed: set True ONLY if the assistant explicitly asked the user a question or stated it cannot proceed.
Do NOT set user_input_needed=True just because the criteria was not met — the assistant should simply retry.
Give the assistant the benefit of the doubt if they say they've completed a file operation.
"""
        if state.get("feedback_on_work"):
            user_message += f"\nPrior feedback given: {state['feedback_on_work']}\n"
            user_message += "If the assistant is repeating the same mistakes, set user_input_needed=True.\n"

        eval_result = self.evaluator_llm_with_output.invoke([
            SystemMessage(content="You are an evaluator that determines if a task has been completed successfully."),
            HumanMessage(content=user_message),
        ])

        return {
            "messages": [{"role": "assistant", "content": f"{EVALUATOR_PREFIX} {eval_result.feedback}"}],
            "feedback_on_work": eval_result.feedback,
            "success_criteria_met": eval_result.success_criteria_met,
            "user_input_needed": eval_result.user_input_needed,
            "turn_count": state.get("turn_count", 0) + 1,
        }

    def route_based_on_evaluation(self, state: State) -> str:
        if state["success_criteria_met"] or state["user_input_needed"]:
            return "END"
        if state.get("turn_count", 0) >= self.MAX_TURNS:
            return "END"
        return "worker"

    def _build_graph(self):
        builder = StateGraph(State)
        builder.add_node("worker", self.worker)
        builder.add_node("tools", ToolNode(tools=self.tools))
        builder.add_node("evaluator", self.evaluator)
        builder.add_conditional_edges("worker", self.worker_router, {"tools": "tools", "evaluator": "evaluator"})
        builder.add_edge("tools", "worker")
        builder.add_conditional_edges("evaluator", self.route_based_on_evaluation, {"worker": "worker", "END": END})
        builder.add_edge(START, "worker")
        # MemorySaver is fine — state is reconstructed from history on each call
        self.graph = builder.compile(checkpointer=MemorySaver())

    # ── Public API ─────────────────────────────────────────────────────────────

    async def run_superstep(self, message: str, success_criteria: Optional[str], history: list) -> list:
        """
        Stateless superstep: reconstructs LangGraph state from `history` on every call.
        No persistent checkpointer needed — safe for Lambda.
        """
        # Rebuild conversation as LangGraph messages (skip evaluator feedback lines)
        past_messages: List[Any] = []
        for h in history:
            if h["role"] == "user":
                past_messages.append(HumanMessage(content=h["content"]))
            elif h["role"] == "assistant" and not h["content"].startswith(EVALUATOR_PREFIX):
                past_messages.append(AIMessage(content=h["content"]))

        past_messages.append(HumanMessage(content=message))

        state = {
            "messages": past_messages,
            "success_criteria": success_criteria or "The answer should be clear and accurate",
            "feedback_on_work": None,
            "success_criteria_met": False,
            "user_input_needed": False,
            "turn_count": 0,
        }

        # Fresh thread ID each call — MemorySaver only lives for this invocation
        config = {"configurable": {"thread_id": str(uuid.uuid4())}}
        result = await self.graph.ainvoke(state, config=config)

        all_msgs = result["messages"]
        last_human_idx = max(
            (i for i, m in enumerate(all_msgs) if isinstance(m, HumanMessage)),
            default=-1,
        )
        new_entries = [{"role": "user", "content": message}]
        for msg in all_msgs[last_human_idx + 1:]:
            if isinstance(msg, AIMessage) and msg.content:
                new_entries.append({"role": "assistant", "content": msg.content})
        return history + new_entries
