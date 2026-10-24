# TriRah CardioSense AI

### Intelligent Heart Disease Risk Screening with Machine Learning

TriRah CardioSense AI is a machine-learning-powered web application designed to estimate the likelihood of heart disease from selected clinical attributes. The project combines data analysis, machine learning, and an interactive web interface to present predictions and insights in an accessible format.

## Project Overview

The project uses a heart disease dataset containing 918 records and 12 columns, including clinical features and a binary target variable named `HeartDisease`.

The application aims to provide:
- Interactive patient-data input.
- Machine learning-based risk estimation.
- Data visualization and health-feature insights.
- Model performance and evaluation metrics.
- A responsive, modern dashboard.

## Technology Stack

**Machine Learning**
- Python
- Pandas and NumPy
- Matplotlib and Seaborn
- Scikit-learn

**Frontend**
- React
- Vite
- Tailwind CSS
- Recharts

**Backend**
- Python
- FastAPI
- Uvicorn
- Joblib

## Dataset Features

The dataset includes age, sex, chest pain type, resting blood pressure, cholesterol, fasting blood sugar, resting ECG, maximum heart rate, exercise-induced angina, oldpeak, ST slope, and heart disease status.

**Target variable:** `HeartDisease`

- `0`: No heart disease indicated by the dataset label.
- `1`: Heart disease indicated by the dataset label.

## Machine Learning Workflow

1. Data loading and validation.
2. Exploratory data analysis.
3. Data cleaning and preprocessing.
4. Categorical feature encoding.
5. Training and comparison of suitable classification models.
6. Model evaluation using appropriate classification metrics.
7. Saving the selected model and preprocessing pipeline.
8. Integrating predictions through a backend API.
9. Developing an interactive frontend dashboard.

## Project Structure

```text
TriRah-CardioSense-AI/
├── dataset/
├── notebooks/
├── backend/
├── frontend/
├── README.md
└── .gitignore
```

## Getting Started

Setup instructions for the machine learning environment, backend API, and frontend will be added as the project is developed.

## Responsible Use

TriRah CardioSense AI is an educational machine learning and risk-screening project. Its predictions are not a medical diagnosis and must not replace evaluation by a qualified healthcare professional. Model performance and limitations should be reviewed before any real-world use.

## Project Name

**TriRah CardioSense AI**

*Turning health data into understandable machine learning insights.*
