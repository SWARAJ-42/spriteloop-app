from dodopayments import AsyncDodoPayments
import os
from dotenv import load_dotenv

load_dotenv()

client = AsyncDodoPayments(
    bearer_token=os.getenv("DODO_API_KEY"),
    environment="test_mode",
)