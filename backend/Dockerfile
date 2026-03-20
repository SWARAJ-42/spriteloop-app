FROM python:3.13

WORKDIR /app

# System deps
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0

# Install torch separately (rarely changes)
RUN pip install torch torchvision --index-url https://download.pytorch.org/whl/cu126

# Copy only requirements
COPY requirements.txt .

# Install python deps
RUN pip install -r requirements.txt

# Copy app code LAST
COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]