import os
from pathlib import Path
import sys

TEST_DB_PATH = Path(__file__).resolve().parent / "test_data.sqlite3"

os.environ["MONEY_TRACKING_DB_PATH"] = str(TEST_DB_PATH)

if TEST_DB_PATH.exists():
    TEST_DB_PATH.unlink()

BACKEND_ROOT = Path(__file__).resolve().parents[1]

if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))
