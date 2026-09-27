import json
import sys
from datetime import datetime, timezone
import requests

def fetch_credly(profile_url: str) -> list[dict]:
    base_url = profile_url.split('?')[0].rstrip('/')
    if not base_url.endswith('.json'):
        if base_url.endswith('/badges'):
            api_url = base_url + '.json'
        else:
            api_url = base_url + '/badges.json'
    else:
        api_url = base_url
        
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json"
    }
    
    print(f"Fetching from Credly API: {api_url}")
    resp = requests.get(api_url, headers=headers, timeout=20)
    resp.raise_for_status()
    

    payload = resp.json()
    data = payload.get("data", [])

    badges = []
    for item in data:

        template = item.get("badge_template", {})
        title = template.get("name", "Credly Certification")
        
        image = item.get("image_url", "")
        
        badge_id = item.get("id")
        link = f"https://www.credly.com/badges/{badge_id}/public_url" if badge_id else profile_url

        badges.append({
            "title": title.strip(),
            "image": image,
            "link": link
        })

    return badges

def main():
    if len(sys.argv) != 3:
        print("Usage: python fetch_credly_badges.py YOUR_CREDLY_URL YOUR_OUTPUT_PATH")
        sys.exit(1)

    profile_url, out_path = sys.argv[1], sys.argv[2]
    badges = fetch_credly(profile_url)

    payload = {
        "source": profile_url,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "count": len(badges),
        "badges": badges,
    }

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    print(f"Successfully wrote {len(badges)} Credly badges to {out_path}")

if __name__ == "__main__":
    main()