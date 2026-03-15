from dotenv import load_dotenv
import os
import requests
from langchain_core.tools import Tool
from langchain_community.agent_toolkits import FileManagementToolkit
from langchain_community.tools.wikipedia.tool import WikipediaQueryRun
from langchain_experimental.tools import PythonREPLTool
from langchain_community.utilities import GoogleSerperAPIWrapper
from langchain_community.utilities.wikipedia import WikipediaAPIWrapper

load_dotenv(override=True)

pushover_token = os.getenv("PUSHOVER_TOKEN")
pushover_user  = os.getenv("PUSHOVER_USER")
pushover_url   = "https://api.pushover.net/1/messages.json"
serper         = GoogleSerperAPIWrapper()


def push(text: str) -> str:
    """Send a push notification to the user"""
    requests.post(pushover_url, data={"token": pushover_token, "user": pushover_user, "message": text})
    return "success"


def get_tools() -> list:
    """Return all tools available to the Wingman agent."""
    file_tools = FileManagementToolkit(root_dir="sandbox").get_tools()

    push_tool = Tool(
        name="send_push_notification",
        func=push,
        description="Use this tool to send a push notification to the user",
    )
    search_tool = Tool(
        name="search",
        func=serper.run,
        description="Use this tool to run an online web search",
    )
    wiki_tool = WikipediaQueryRun(api_wrapper=WikipediaAPIWrapper())
    python_repl = PythonREPLTool()

    return file_tools + [push_tool, search_tool, python_repl, wiki_tool]
