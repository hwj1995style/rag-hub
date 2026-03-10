from pathlib import Path
from parser_worker.parsers.text_parser import parse_plain_text


SUPPORTED_TEXT_TYPES = {'txt', 'md', 'csv', 'html'}
SUPPORTED_SIMPLE_TYPES = {'pdf', 'docx', 'doc', 'ppt', 'pptx', 'xlsx', 'xls'}


def parse_file(path: Path, source_type: str) -> str:
    normalized = (source_type or '').lower()
    if normalized in SUPPORTED_TEXT_TYPES:
        return parse_plain_text(path)
    if normalized in SUPPORTED_SIMPLE_TYPES:
        # Placeholder parser. Real implementations should use dedicated libraries.
        return parse_plain_text(path)
    return parse_plain_text(path)
