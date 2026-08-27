import time
from collections import defaultdict
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

class RateLimiterMiddleware(BaseHTTPMiddleware):
    """
    Sliding window in-memory Rate Limiter Middleware for FastAPI.
    Enforces per-IP request limits with custom thresholds for sensitive endpoints.
    """
    def __init__(self, app, default_limit: int = 120, window_seconds: int = 60):
        super().__init__(app)
        self.default_limit = default_limit
        self.window_seconds = window_seconds
        # In-memory storage: IP -> List of request timestamps
        self.request_history = defaultdict(list)

        # Specific strict rate limits for critical endpoints: (path_prefix, max_requests, window_secs)
        self.custom_limits = [
            # Strict limits on Auth & OTP to prevent brute-force
            ("/login", 15, 60),
            ("/register", 10, 60),
            ("/send-otp", 6, 60),
            ("/verify-otp", 12, 60),
            ("/forgot-password", 10, 60),
            ("/reset-password-with-otp", 10, 60),
            # Booking creation limit to prevent spam bookings
            ("/bookings", 40, 60),
            # Reviews spam prevention
            ("/reviews", 25, 60),
        ]

    def _get_client_ip(self, request: Request) -> str:
        # Check standard reverse proxy headers first
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip.strip()
        if request.client:
            return request.client.host
        return "127.0.0.1"

    def _get_limit_for_path(self, path: str, method: str):
        # OPTIONS pre-flight requests are never rate-limited
        if method == "OPTIONS":
            return 10000, 60

        for prefix, max_req, win_sec in self.custom_limits:
            if path.startswith(prefix):
                return max_req, win_sec
        return self.default_limit, self.window_seconds

    async def dispatch(self, request: Request, call_next):
        # Allow OPTIONS preflight through immediately
        if request.method == "OPTIONS":
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        path = request.url.path
        max_requests, window = self._get_limit_for_path(path, request.method)

        now = time.time()
        key = f"{client_ip}:{path.split('/')[1] if len(path.split('/')) > 1 else 'root'}"

        # Clean timestamps older than the sliding window
        window_start = now - window
        timestamps = self.request_history[key]
        self.request_history[key] = [ts for ts in timestamps if ts > window_start]

        current_count = len(self.request_history[key])

        # Check if limit exceeded
        if current_count >= max_requests:
            oldest_timestamp = self.request_history[key][0]
            retry_after = int(max(1, window - (now - oldest_timestamp)))
            
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests. Rate limit exceeded.",
                    "error": "RATE_LIMIT_EXCEEDED",
                    "retry_after_seconds": retry_after,
                    "limit": max_requests,
                    "window_seconds": window
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(max_requests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(now + retry_after))
                }
            )

        # Record this request timestamp
        self.request_history[key].append(now)
        remaining = max_requests - (current_count + 1)

        # Process the request
        response: Response = await call_next(request)

        # Inject standard rate limit observability headers
        response.headers["X-RateLimit-Limit"] = str(max_requests)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))
        response.headers["X-RateLimit-Reset"] = str(int(now + window))

        return response
