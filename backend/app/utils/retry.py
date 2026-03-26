import time


def retry_garmin_call(fn, max_retries=3):
    """Retry a Garmin API call with exponential backoff on HTTP 429.

    Garmin's API rate-limits cloud provider IPs (Render/AWS) far more
    aggressively than residential connections. This affects both data
    endpoints and OAuth SSO. Backoff schedule: 2s, 4s, 8s — sufficient
    for Garmin's typical 429 cooldown window.
    """
    for attempt in range(max_retries + 1):
        try:
            return fn()
        except Exception as e:
            if "429" in str(e) and attempt < max_retries:
                delay = (2 ** attempt) * 2
                print(f"Garmin 429, retrying in {delay}s (attempt {attempt + 1}/{max_retries})")
                time.sleep(delay)
                continue
            raise
