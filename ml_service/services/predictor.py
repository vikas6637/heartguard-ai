"""
Predictor service — loads the existing GradientBoosting model
and performs preprocessing + prediction matching the original CardioScan pipeline.
"""

import os
import pickle
import numpy as np
import pandas as pd
from scipy.stats import boxcox

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, 'model', 'best_svm_model.pkl')
LAMBDA_PATH = os.path.join(BASE_DIR, 'model', 'boxcox_lambdas.pkl')

EXPECTED_COLUMNS = [
    'age', 'sex', 'trestbps', 'chol', 'fbs', 'thalach', 'exang',
    'oldpeak', 'slope', 'ca',
    'cp_1', 'cp_2', 'cp_3',
    'restecg_1', 'restecg_2',
    'thal_1', 'thal_2', 'thal_3'
]

FEATURE_NAMES = {
    'age': 'Age', 'sex': 'Sex', 'trestbps': 'Resting BP', 'chol': 'Cholesterol',
    'fbs': 'Fasting Sugar', 'thalach': 'Max Heart Rate', 'exang': 'Exercise Angina',
    'oldpeak': 'ST Depression', 'slope': 'ST Slope', 'ca': 'Major Vessels',
    'cp_1': 'Chest Pain (Atypical)', 'cp_2': 'Chest Pain (Non-anginal)',
    'cp_3': 'Chest Pain (Asymptomatic)', 'restecg_1': 'ECG (ST-T Abnormality)',
    'restecg_2': 'ECG (LV Hypertrophy)', 'thal_1': 'Thal (Fixed)',
    'thal_2': 'Thal (Reversible)', 'thal_3': 'Thal (Not Described)',
}

DISEASE_THRESHOLD = 0.3

# ── Load model on import ──
_model = None
_lambdas = None


def load_model():
    global _model, _lambdas
    if _model is not None:
        return _model, _lambdas

    with open(MODEL_PATH, 'rb') as f:
        _model = pickle.load(f)
    with open(LAMBDA_PATH, 'rb') as f:
        _lambdas = pickle.load(f)
    print(f"✓ Model loaded from {MODEL_PATH}")
    print(f"  Lambdas: { {k: round(float(v), 4) for k, v in _lambdas.items()} }")
    return _model, _lambdas


def preprocess_input(input_data):
    """Preprocess raw input data to match model expectations."""
    model, lambdas = load_model()

    df = pd.DataFrame([input_data])

    # Type conversions
    for col in ['age', 'trestbps', 'chol', 'thalach', 'oldpeak']:
        df[col] = df[col].astype(float)
    for col in ['sex', 'fbs', 'exang', 'ca', 'slope']:
        df[col] = df[col].astype(int)
    for col in ['cp', 'restecg', 'thal']:
        df[col] = df[col].astype(int)

    # Oldpeak offset (same as training)
    df['oldpeak'] = df['oldpeak'] + 0.001

    # One-hot encode
    df = pd.get_dummies(df, columns=['cp', 'restecg', 'thal'], drop_first=True)

    # Box-Cox transform
    for col, lmbda in lambdas.items():
        if col in df.columns:
            val = float(df[col].values[0])
            if val <= 0:
                val = abs(val) + 0.001
            df[col] = float(boxcox(np.array([val]), lmbda=float(lmbda))[0])

    # Ensure all expected columns exist
    for col in EXPECTED_COLUMNS:
        if col not in df.columns:
            df[col] = 0

    return df[EXPECTED_COLUMNS]


def predict(input_data):
    """Run prediction and return result dict."""
    model, lambdas = load_model()
    processed = preprocess_input(input_data)

    prob_disease = float(model.predict_proba(processed)[0][1])
    has_disease = prob_disease >= DISEASE_THRESHOLD

    # Feature importance from the model
    feature_importance = {}
    if hasattr(model, 'named_steps'):
        clf = model.named_steps.get('clf', list(model.named_steps.values())[-1])  # type: ignore
    else:
        clf = model

    if hasattr(clf, 'feature_importances_'):
        for col, imp in zip(EXPECTED_COLUMNS, clf.feature_importances_):
            feature_importance[FEATURE_NAMES.get(col, col)] = round(float(imp) * 100, 2)

    return {
        'probability': prob_disease,
        'has_disease': has_disease,
        'feature_importance': feature_importance,
    }


def predict_with_shap(input_data):
    """Run prediction + SHAP values for explainability."""
    import shap

    model, lambdas = load_model()
    processed = preprocess_input(input_data)

    # Basic prediction
    result = predict(input_data)

    # SHAP explanation
    try:
        if hasattr(model, 'named_steps'):
            clf = model.named_steps.get('clf', list(model.named_steps.values())[-1])  # type: ignore
            scaler = model.named_steps.get('scaler', None)  # type: ignore
            if scaler:
                processed_scaled = pd.DataFrame(
                    scaler.transform(processed),
                    columns=EXPECTED_COLUMNS
                )
            else:
                processed_scaled = processed
        else:
            clf = model
            processed_scaled = processed

        explainer = shap.TreeExplainer(clf)
        shap_values = explainer.shap_values(processed_scaled)

        # For binary classification, shap_values may be a list [class_0, class_1]
        if isinstance(shap_values, list):
            sv = shap_values[1][0]  # SHAP for "disease" class
        else:
            sv = shap_values[0]

        shap_dict = {}
        for col, val in zip(EXPECTED_COLUMNS, sv):
            shap_dict[FEATURE_NAMES.get(col, col)] = round(float(val), 4)

        result['shap_values'] = shap_dict
        result['base_value'] = float(explainer.expected_value[1]) if isinstance(
            explainer.expected_value, (list, np.ndarray)
        ) else float(explainer.expected_value)

    except Exception as e:
        print(f"⚠ SHAP error: {e}")
        result['shap_values'] = {}
        result['base_value'] = 0.5

    return result
