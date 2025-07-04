from flask_caching import Cache

cache = Cache()

def init_cache(app):
    app.config['CACHE_TYPE'] = 'RedisCache'
    app.config['CACHE_DEFAULT_TIMEOUT'] = 300
    app.config['CACHE_REDIS_URL'] = 'redis://localhost:6379/2'  # Use a separate Redis DB for cache if desired
    cache.init_app(app)
    return cache