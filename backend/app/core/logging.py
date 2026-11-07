import logging
import sys
import re

SENSITIVE_PATTERNS = [
    re.compile(r'(authorization:\s*bearer\s+)[^\s,]+', re.IGNORECASE),
    re.compile(r'(token["\']?\s*[:=]\s*["\']?)[^"\'\s,]+', re.IGNORECASE),
    re.compile(r'(secret["\']?\s*[:=]\s*["\']?)[^"\'\s,]+', re.IGNORECASE),
    re.compile(r'(gitauto_session=)[^;\s]+', re.IGNORECASE),
    re.compile(r'(code_verifier=)[^&\s]+', re.IGNORECASE),
]


class SanitizingFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        original = super().format(record)
        sanitized = original
        for pattern in SENSITIVE_PATTERNS:
            sanitized = pattern.sub(r'\1[REDACTED]', sanitized)
        return sanitized


def setup_logger(name: str = "gitauto", level: str = "INFO") -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))
    
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = SanitizingFormatter(
            fmt="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        
    return logger


logger = setup_logger()
