import importlib.util
from pathlib import Path
import sys

# Resolve path to the FastAPI app inside the 'Ai Models' folder (handles the space in the directory name)
root = Path(__file__).parent
target = root / "Ai Models" / "main.py"

if not target.exists():
    raise FileNotFoundError(f"Expected FastAPI app at {target!s}")

spec = importlib.util.spec_from_file_location("ai_models_main", target)
module = importlib.util.module_from_spec(spec)
# Execute the module so it defines `app`
spec.loader.exec_module(module)

try:
    app = module.app  # expose `app` for uvicorn
except AttributeError:
    raise AttributeError(f"Module {target!s} does not define `app`")

__all__ = ["app"]
