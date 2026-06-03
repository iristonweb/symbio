import re
from urllib.parse import urlparse


def slugify(text: str, max_len: int = 160) -> str:
    s = re.sub(r"[^\w\s-]", "", (text or "").lower())
    s = re.sub(r"[\s_-]+", "-", s).strip("-")
    return s[:max_len] or "item"


def normalize_game_name(name: str) -> str:
    return slugify(name, 120)


def parse_host_port(address: str) -> tuple[str, int]:
    address = (address or "").strip().strip("`")
    if ":" in address:
        host, _, port_str = address.rpartition(":")
        try:
            return host.strip(), int(port_str.strip())
        except ValueError:
            pass
    return address, 0


def extract_external_id(url: str) -> str | None:
    path = urlparse(url).path.strip("/")
    parts = path.split("/")
    if len(parts) >= 2 and parts[-1].isdigit():
        return parts[-1]
    return path or None
