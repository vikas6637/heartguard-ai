"""
HeartGuard AI — ML Microservice
Flask API providing prediction, SHAP explanation, and feature importance endpoints.
Runs on port 8000 by default.
"""

import os
import sys
import warnings
warnings.filterwarnings('ignore')

from flask import Flask, request, jsonify
from flask_cors import CORS

# Add parent dir to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from services.predictor import predict, predict_with_shap, load_model, FEATURE_NAMES, EXPECTED_COLUMNS

app = Flask(__name__)
CORS(app)


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'heartguard-ml'})


@app.route('/predict', methods=['POST'])
def predict_endpoint():
    """
    Basic prediction endpoint.
    Expects JSON with: age, sex, cp, trestbps, chol, fbs, restecg,
                        thalach, exang, oldpeak, slope, ca, thal
    Returns: probability, has_disease, feature_importance
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        required = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs',
                    'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal']
        for f in required:
            if f not in data:
                return jsonify({'error': f'Missing field: {f}'}), 400

        # Cast to proper types
        input_data = {
            'age': int(data['age']),
            'sex': int(data['sex']),
            'cp': int(data['cp']),
            'trestbps': int(data['trestbps']),
            'chol': int(data['chol']),
            'fbs': int(data['fbs']),
            'restecg': int(data['restecg']),
            'thalach': int(data['thalach']),
            'exang': int(data['exang']),
            'oldpeak': float(data['oldpeak']),
            'slope': int(data['slope']),
            'ca': int(data['ca']),
            'thal': int(data['thal']),
        }

        result = predict(input_data)
        return jsonify(result)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/predict/explain', methods=['POST'])
def explain_endpoint():
    """
    Prediction + SHAP explainability endpoint.
    Same input as /predict, but also returns shap_values and base_value.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        required = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs',
                    'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal']
        for f in required:
            if f not in data:
                return jsonify({'error': f'Missing field: {f}'}), 400

        input_data = {
            'age': int(data['age']),
            'sex': int(data['sex']),
            'cp': int(data['cp']),
            'trestbps': int(data['trestbps']),
            'chol': int(data['chol']),
            'fbs': int(data['fbs']),
            'restecg': int(data['restecg']),
            'thalach': int(data['thalach']),
            'exang': int(data['exang']),
            'oldpeak': float(data['oldpeak']),
            'slope': int(data['slope']),
            'ca': int(data['ca']),
            'thal': int(data['thal']),
        }

        result = predict_with_shap(input_data)
        return jsonify(result)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/importance', methods=['GET'])
def importance_endpoint():
    """Returns overall model feature importance."""
    try:
        model, _ = load_model()
        if hasattr(model, 'named_steps'):
            clf = model.named_steps.get('clf', list(model.named_steps.values())[-1])  # type: ignore
        else:
            clf = model

        if not hasattr(clf, 'feature_importances_'):
            return jsonify({'error': 'Model does not support feature_importances_'}), 500

        importances = clf.feature_importances_  # type: ignore
        pairs = sorted(
            [(FEATURE_NAMES.get(c, c), float(i))
             for c, i in zip(EXPECTED_COLUMNS, importances)],
            key=lambda x: x[1], reverse=True
        )

        return jsonify({
            'features': [p[0] for p in pairs],
            'importances': [round(float(p[1] * 100), 2) for p in pairs],
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("\n" + "=" * 50)
    print("  HeartGuard AI — ML Microservice")
    print("=" * 50)
    load_model()
    port = int(os.environ.get('ML_PORT', 8000))
    print(f"\n✓ ML API running on http://localhost:{port}\n")
    app.run(host='0.0.0.0', port=port, debug=False)
