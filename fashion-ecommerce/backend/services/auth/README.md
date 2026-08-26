# auth Service

## Overview
auth service for the fashion e-commerce platform.

## Local Development

### Setup
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Run
```bash
uvicorn app.main:app --reload --port 8000
```

## API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Testing
```bash
pytest
```
