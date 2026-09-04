import html
import re
from typing import Any, Dict, List, Union

def sanitize_string(val: str) -> str:
    """
    Sanitizes a string value by:
    1. Removing null bytes and dangerous control characters.
    2. Stripping leading/trailing whitespace.
    3. Neutralizing XSS vectors by escaping HTML special characters (&, <, >, ", ').
    """
    if not isinstance(val, str):
        return val

    # Remove null bytes and non-printable control characters (except newline \n and tab \t)
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", val)

    # Strip excessive leading/trailing whitespace
    cleaned = cleaned.strip()

    # Strip dangerous HTML script tags, event handlers, and iframe embeds
    cleaned = re.sub(r"<\s*script[^>]*>.*?<\s*/\s*script\s*>", "", cleaned, flags=re.IGNORECASE | re.DOTALL)
    cleaned = re.sub(r"<\s*iframe[^>]*>.*?<\s*/\s*iframe\s*>", "", cleaned, flags=re.IGNORECASE | re.DOTALL)
    cleaned = re.sub(r"on\w+\s*=\s*[\"'][^\"']*[\"']", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"javascript\s*:", "", cleaned, flags=re.IGNORECASE)

    # Neutralize any remaining angle brackets to prevent tag injection without corrupting &
    cleaned = cleaned.replace("<", "&lt;").replace(">", "&gt;")

    return cleaned


def sanitize_input(data: Any) -> Any:
    """
    Recursively traverses dictionaries, lists, or primitive strings
    and applies string sanitization.
    """
    if isinstance(data, str):
        return sanitize_string(data)
    elif isinstance(data, dict):
        return {k: sanitize_input(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [sanitize_input(item) for item in data]
    return data
