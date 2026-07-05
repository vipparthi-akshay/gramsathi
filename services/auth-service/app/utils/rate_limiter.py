import time

from redis.asyncio import Redis


class RateLimiter:
    def __init__(self, redis_client: Redis):
        self.redis = redis_client

    async def check_rate_limit(
        self, key: str, max_requests: int, window_seconds: int
    ) -> bool:
        now = int(time.time())
        window_start = now - window_seconds
        pipeline = self.redis.pipeline()
        pipeline.zremrangebyscore(key, 0, window_start)
        pipeline.zcard(key)
        pipeline.expire(key, window_seconds)
        results = await pipeline.execute()
        current_count = results[1]
        if current_count >= max_requests:
            return False
        pipeline = self.redis.pipeline()
        pipeline.zadd(key, {now: now})
        pipeline.expire(key, window_seconds)
        await pipeline.execute()
        return True

    async def get_remaining(
        self, key: str, max_requests: int, window_seconds: int
    ) -> int:
        now = int(time.time())
        window_start = now - window_seconds
        pipeline = self.redis.pipeline()
        pipeline.zremrangebyscore(key, 0, window_start)
        pipeline.zcard(key)
        pipeline.expire(key, window_seconds)
        results = await pipeline.execute()
        current_count = results[1]
        return max(0, max_requests - current_count)

    async def get_retry_after(
        self, key: str, window_seconds: int
    ) -> int:
        now = int(time.time())
        window_start = now - window_seconds
        pipeline = self.redis.pipeline()
        pipeline.zremrangebyscore(key, 0, window_start)
        pipeline.zrange(key, 0, 0, withscores=True)
        results = await pipeline.execute()
        entries = results[1]
        if entries:
            oldest_timestamp = int(entries[0][1])
            retry_after = window_seconds - (now - oldest_timestamp)
            return max(1, retry_after)
        return 0
