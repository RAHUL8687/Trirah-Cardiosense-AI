
from pathlib import Path
import json

import joblib
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    classification_report,
    confusion_matrix,
)
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


# --------------------------------------------------
# 1. Project paths and configuration
# --------------------------------------------------
ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "dataset" / "heart.csv"
MODEL_DIR = ROOT / "backend" / "models"

MODEL_DIR.mkdir(parents=True, exist_ok=True)

TARGET = "HeartDisease"
RANDOM_STATE = 42


# --------------------------------------------------
# 2. Load and validate dataset
# --------------------------------------------------
if not DATA_PATH.exists():
    raise FileNotFoundError(
        f"Dataset not found: {DATA_PATH}\n"
        "Place heart.csv inside the dataset folder."
    )

df = pd.read_csv(DATA_PATH)

if TARGET not in df.columns:
    raise ValueError(f"Missing target column: {TARGET}")

if df.empty:
    raise ValueError("The dataset is empty.")

if df[TARGET].isna().any():
    raise ValueError("Target column contains missing values.")

expected_targets = {0, 1}
actual_targets = set(df[TARGET].unique())

if not actual_targets.issubset(expected_targets):
    raise ValueError("HeartDisease must contain only 0 and 1.")

if actual_targets != expected_targets:
    raise ValueError("Both target classes (0 and 1) are required.")

df = df.drop_duplicates().reset_index(drop=True)

X = df.drop(columns=[TARGET]).copy()
y = df[TARGET].astype(int)

# Dataset-specific validation: zero is not a plausible
# value for resting blood pressure or cholesterol here.
# Treat such values as missing rather than valid measurements.
for col in ["RestingBP", "Cholesterol"]:
    X[col] = pd.to_numeric(X[col], errors="raise")
    X.loc[X[col] == 0, col] = np.nan

# Explicitly define feature types.
numeric_features = [
    "Age",
    "RestingBP",
    "Cholesterol",
    "FastingBS",
    "MaxHR",
    "Oldpeak",
]

categorical_features = [
    "Sex",
    "ChestPainType",
    "RestingECG",
    "ExerciseAngina",
    "ST_Slope",
]

required = set(numeric_features + categorical_features)
missing = required - set(X.columns)

if missing:
    raise ValueError(f"Missing required features: {sorted(missing)}")

X = X[numeric_features + categorical_features]

print("=" * 55)
print("TriRah CardioSense AI - Model Training")
print("=" * 55)
print(f"Dataset shape after duplicate removal: {df.shape}")
print(f"Target distribution:\n{y.value_counts().sort_index()}")
print(f"Missing values before preprocessing:\n{X.isna().sum()}")


# --------------------------------------------------
# 3. Split before fitting preprocessing
# --------------------------------------------------
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=RANDOM_STATE,
    stratify=y,
)


# --------------------------------------------------
# 4. Build leakage-safe preprocessing pipeline
# --------------------------------------------------
numeric_pipeline = Pipeline(
    steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ]
)

categorical_pipeline = Pipeline(
    steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore")),
    ]
)

preprocessor = ColumnTransformer(
    transformers=[
        ("numeric", numeric_pipeline, numeric_features),
        ("categorical", categorical_pipeline, categorical_features),
    ]
)


# --------------------------------------------------
# 5. Compare candidate classification models
# --------------------------------------------------
candidates = {
    "Logistic Regression": LogisticRegression(
        max_iter=2000,
        class_weight="balanced",
        random_state=RANDOM_STATE,
    ),
    "Random Forest": RandomForestClassifier(
        n_estimators=300,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    ),
}

results = []
trained_models = {}

for name, classifier in candidates.items():
    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", classifier),
        ]
    )

    # Cross-validation uses training data only.
    cv_scores = cross_val_score(
        pipeline,
        X_train,
        y_train,
        cv=5,
        scoring="roc_auc",
        n_jobs=-1,
    )

    pipeline.fit(X_train, y_train)

    predictions = pipeline.predict(X_test)
    probabilities = pipeline.predict_proba(X_test)[:, 1]

    metrics = {
        "model": name,
        "cv_roc_auc_mean": float(cv_scores.mean()),
        "cv_roc_auc_std": float(cv_scores.std()),
        "test_accuracy": float(
            accuracy_score(y_test, predictions)
        ),
        "test_precision": float(
            precision_score(y_test, predictions, zero_division=0)
        ),
        "test_recall": float(
            recall_score(y_test, predictions, zero_division=0)
        ),
        "test_f1": float(
            f1_score(y_test, predictions, zero_division=0)
        ),
        "test_roc_auc": float(
            roc_auc_score(y_test, probabilities)
        ),
    }

    results.append(metrics)
    trained_models[name] = pipeline

    print(f"\n--- {name} ---")
    print(json.dumps(metrics, indent=2))


# --------------------------------------------------
# 6. Select using training cross-validation only
# --------------------------------------------------
best_result = max(
    results,
    key=lambda result: result["cv_roc_auc_mean"],
)

best_name = best_result["model"]
best_model = trained_models[best_name]

# Evaluate the selected model on the held-out test set.
test_predictions = best_model.predict(X_test)
test_probabilities = best_model.predict_proba(X_test)[:, 1]

print("\n" + "=" * 55)
print(f"Selected model: {best_name}")
print("Held-out test classification report:")
print(
    classification_report(
        y_test,
        test_predictions,
        labels=[0, 1],
        zero_division=0,
    )
)

print("Confusion matrix:")
print(confusion_matrix(y_test, test_predictions))

print(f"Test ROC-AUC: {roc_auc_score(y_test, test_probabilities):.4f}")


# --------------------------------------------------
# 7. Save model, metrics and feature schema
# --------------------------------------------------
model_path = MODEL_DIR / "cardiosense_model.joblib"
metrics_path = MODEL_DIR / "model_metrics.json"

joblib.dump(best_model, model_path)

report = {
    "project": "TriRah CardioSense AI",
    "target": TARGET,
    "selected_model": best_name,
    "selection_metric": "mean 5-fold training ROC-AUC",
    "dataset_rows_after_duplicate_removal": int(len(df)),
    "training_rows": int(len(X_train)),
    "test_rows": int(len(X_test)),
    "features": list(X.columns),
    "cross_validation_roc_auc_mean": best_result["cv_roc_auc_mean"],
    "cross_validation_roc_auc_std": best_result["cv_roc_auc_std"],
    "test_metrics": {
        "accuracy": float(accuracy_score(y_test, test_predictions)),
        "precision": float(
            precision_score(y_test, test_predictions, zero_division=0)
        ),
        "recall": float(
            recall_score(y_test, test_predictions, zero_division=0)
        ),
        "f1": float(
            f1_score(y_test, test_predictions, zero_division=0)
        ),
        "roc_auc": float(
            roc_auc_score(y_test, test_probabilities)
        ),
    },
    "confusion_matrix": confusion_matrix(
        y_test, test_predictions
    ).tolist(),
    "candidate_results": results,
    "clinical_notice": (
        "Educational screening only; not a medical diagnosis."
    ),
}

metrics_path.write_text(json.dumps(report, indent=2))

print("\nTraining complete.")
print(f"Model saved to: {model_path}")
print(f"Metrics saved to: {metrics_path}")
