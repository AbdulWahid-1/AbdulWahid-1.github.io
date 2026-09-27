import json
import re
import sys
from datetime import datetime, timezone
import requests
from bs4 import BeautifulSoup

BADGE_LINK_RE = re.compile(r"/badges/\d+")
EARNED_RE = re.compile(r"Earned\s+([A-Za-z]+ \d{1,2},\s*\d{4})")

def fetch_badges(profile_url: str) -> list[dict]:
    headers = {"User-Agent": "Mozilla/5.0 (compatible; PortfolioBadgeSync/1.0)"}
    resp = requests.get(profile_url, headers=headers, timeout=20)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    badges = []
    seen_links = set()

    for a in soup.find_all("a", href=BADGE_LINK_RE):
        href = a["href"]
        if href in seen_links:
            continue
        seen_links.add(href)

        img = a.find("img")
        image_url = img["src"] if img and img.has_attr("src") else None

        container = a.find_parent(["div", "li"]) or a.parent
        text = container.get_text(" ", strip=True) if container else a.get_text(" ", strip=True)

        earned_match = EARNED_RE.search(text)
        earned_date = earned_match.group(1) if earned_match else None

        title = text
        if earned_match:
            title = text[: earned_match.start()].strip()
        title = title.strip(" -–|")

        if not title or not image_url:
            continue

        link = href if href.startswith("http") else f"https://www.cloudskillsboost.google{href}"

        badges.append({
            "title": title,
            "earned": earned_date,
            "image": image_url,
            "link": link,
        })

    return badges

def main():
    if len(sys.argv) != 3:
        print("Usage: python fetch_google_badges.py YOUR_PROFILE_URL YOUR_OUTPUT_PATH")
        sys.exit(1)

    profile_url, out_path = sys.argv[1], sys.argv[2]
    badges = fetch_badges(profile_url)

    payload = {
        "source": profile_url,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "count": len(badges),
        "badges": badges,
    }

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    print(f"Wrote {len(badges)} badges to {out_path}")
    if not badges:
        print("Warning: 0 badges found — check that the profile URL is correct and public.")

if __name__ == "__main__":
    main()