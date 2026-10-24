
from pathlib import Path
import json
import logging
import math

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal


# --------------------------------------------------
# Configuration
# --------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "cardiosense_model.joblib"
METRICS_PATH = BASE_DIR / "models" / "model_metrics.json"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cardiosense")

app = FastAPI(
    title="TriRah CardioSense AI",
    description=(
        "Educational heart-disease prediction API. "
        "Not intended for medical diagnosis."
    ),
    version="1.0.0",
)

# Development frontend origins. Update these when deploying.
app.add_middleware(
    CORSMiddleware,
   allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


# --------------------------------------------------
# Load model and evaluation metadata
# --------------------------------------------------
model = None
metrics = None

if MODEL_PATH.exists():
    try:
        model = joblib.load(MODEL_PATH)
        logger.info("CardioSense model loaded.")
    except Exception:
        logger.exception("Could not load the model.")

if METRICS_PATH.exists():
    try:
        metrics = json.loads(METRICS_PATH.read_text())
    except (OSError, json.JSONDecodeError):
        logger.exception("Could not read model metrics.")


# --------------------------------------------------
# Request schema
# --------------------------------------------------
class PatientInput(BaseModel):
    Age: int = Field(ge=18, le=120)
    Sex: Literal["M", "F"]

    ChestPainType: Literal["TA", "ATA", "NAP", "ASY"]

    RestingBP: float = Field(gt=0, le=300)
    Cholesterol: float = Field(ge=0, le=1000)

    FastingBS: Literal[0, 1]

    RestingECG: Literal["Normal", "ST", "LVH"]

    MaxHR: int = Field(ge=1, le=250)

    ExerciseAngina: Literal["Y", "N"]

    Oldpeak: float = Field(ge=-10, le=15)

    ST_Slope: Literal["Up", "Flat", "Down"]


# --------------------------------------------------
# API endpoints
# --------------------------------------------------
@app.get("/")
def root():
    return {
        "name": "TriRah CardioSense AI",
        "message": "Heart-disease prediction API",
        "docs": "/docs",
        "health": "/api/health",
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok" if model is not None else "model_unavailable",
        "model_loaded": model is not None,
    }


@app.get("/api/metrics")
def get_metrics():
    if metrics is None:
        raise HTTPException(
            status_code=503,
            detail="Model evaluation metrics are unavailable.",
        )

    return metrics


@app.post("/api/predict")
def predict(patient: PatientInput):
    if model is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "Model is not available. "
                "Run backend/train_model.py first."
            ),
        )

    # Keep the same feature names and order as model training.
    patient_data = pd.DataFrame(
        [patient.model_dump()]
    )

    try:
        prediction = int(model.predict(patient_data)[0])
        probabilities = model.predict_proba(patient_data)[0]

        # Identify the probability corresponding to class 1.
        classes = list(model.named_steps["classifier"].classes_)
        positive_index = classes.index(1)
        score = float(probabilities[positive_index])

        if not math.isfinite(score):
            raise ValueError("Model returned a non-finite score.")

    except Exception:
        logger.exception("Prediction failed.")
        raise HTTPException(
            status_code=500,
            detail="Prediction could not be completed.",
        )

    return {
        "project": "TriRah CardioSense AI",
        "prediction": prediction,
        "result": (
            "Heart disease indicated by model"
            if prediction == 1
            else "Heart disease not indicated by model"
        ),
        "model_score_percent": round(score * 100, 2),
        "disclaimer": (
            "This is an experimental machine-learning estimate, "
            "not a diagnosis or a measure of an individual's "
            "actual clinical risk. Consult a qualified clinician."
        ),
    }
