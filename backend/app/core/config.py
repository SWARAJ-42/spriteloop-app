from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    DATABASE_URL: str
    FIREBASE_PROJECT_ID: str

    API_URL_RUNNING: str
    API_URL_JUMPING: str
    API_URL_WALKING: str
    API_URL_IDLE: str

    RUNPOD_API_KEY: str
    POLL_INTERVAL: int

    ENDPOINT: str
    DEPLOYMENT: str
    SUBSCRIPTION_KEY: str
    API_VERSION: str

    GEMINI_API_KEY: str
    POSE_MODEL: str

    class Config:
        env_file = ".env"


settings = Settings()