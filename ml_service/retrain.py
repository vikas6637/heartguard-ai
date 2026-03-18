"""
HeartGuard AI — Model Training Script (retrain.py)
Trains an SVM classifier on the UCI Heart Disease dataset.
Applies Box-Cox transformation, one-hot encoding, and saves the trained model.

Usage:
    cd ml_service
    python retrain.py

Output:
    model/best_svm_model.pkl    — trained SVM pipeline
    model/boxcox_lambdas.pkl    — Box-Cox lambda values
"""

import os
import pickle
import warnings
import numpy as np
import pandas as pd
from scipy.stats import boxcox
from sklearn.svm import SVC
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

warnings.filterwarnings('ignore')

# ── Paths ──
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, 'dataset', 'heart.csv')
MODEL_DIR = os.path.join(BASE_DIR, 'model')
MODEL_PATH = os.path.join(MODEL_DIR, 'best_svm_model.pkl')
LAMBDA_PATH = os.path.join(MODEL_DIR, 'boxcox_lambdas.pkl')

os.makedirs(MODEL_DIR, exist_ok=True)

print("=" * 60)
print("  HeartGuard AI — Model Training Pipeline")
print("=" * 60)


# ═══════════════════════════════════════════════════════════
# STEP 1: Load Dataset
# ═══════════════════════════════════════════════════════════
print("\n📂 Step 1: Loading dataset...")
df = pd.read_csv(DATA_PATH)
print(f"   Dataset shape: {df.shape}")
print(f"   Features: {list(df.columns[:-1])}")
print(f"   Target distribution:\n{df['target'].value_counts().to_string()}")
print(f"   Class balance: {df['target'].value_counts(normalize=True).to_dict()}")


# ═══════════════════════════════════════════════════════════
# STEP 2: Data Preprocessing
# ═══════════════════════════════════════════════════════════
print("\n🔧 Step 2: Preprocessing data...")

# Remove duplicates
original_len = len(df)
df = df.drop_duplicates()
print(f"   Removed {original_len - len(df)} duplicate rows → {len(df)} remaining")

# Separate features and target
X = df.drop('target', axis=1)
y = df['target']

# Offset oldpeak to avoid zero values (Box-Cox requires positive values)
X['oldpeak'] = X['oldpeak'] + 0.001

# One-hot encode categorical features (drop_first to avoid multicollinearity)
X = pd.get_dummies(X, columns=['cp', 'restecg', 'thal'], drop_first=True)

print(f"   Features after one-hot encoding: {X.shape[1]}")
print(f"   Columns: {list(X.columns)}")


# ═══════════════════════════════════════════════════════════
# STEP 3: Box-Cox Transformation
# ═══════════════════════════════════════════════════════════
print("\n📊 Step 3: Applying Box-Cox transformation...")

# Apply Box-Cox to continuous features that are skewed
boxcox_features = ['age', 'trestbps', 'chol', 'thalach', 'oldpeak']
lambdas = {}

for col in boxcox_features:
    vals = X[col].values.astype(float)
    # Ensure all values are positive for Box-Cox
    vals = np.where(vals <= 0, abs(vals) + 0.001, vals)
    transformed, lmbda = boxcox(vals)
    X[col] = transformed
    lambdas[col] = lmbda
    print(f"   {col}: λ = {lmbda:.4f}")

# Save lambdas for inference
with open(LAMBDA_PATH, 'wb') as f:
    pickle.dump(lambdas, f)
print(f"   ✓ Saved Box-Cox lambdas → {LAMBDA_PATH}")


# ═══════════════════════════════════════════════════════════
# STEP 4: Train/Test Split
# ═══════════════════════════════════════════════════════════
print("\n📊 Step 4: Splitting data...")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
print(f"   Training set: {X_train.shape[0]} samples")
print(f"   Test set:     {X_test.shape[0]} samples")


# ═══════════════════════════════════════════════════════════
# STEP 5: Model Training with GridSearchCV
# ═══════════════════════════════════════════════════════════
print("\n🧠 Step 5: Training SVM with hyperparameter tuning...")

# Create pipeline: StandardScaler → SVM
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('clf', SVC(probability=True, random_state=42))
])

# Hyperparameter grid
param_grid = {
    'clf__C': [0.1, 1, 10, 100],
    'clf__gamma': ['scale', 'auto', 0.01, 0.1],
    'clf__kernel': ['rbf', 'linear'],
}

# Grid search with 5-fold cross-validation
grid_search = GridSearchCV(
    pipeline, param_grid, cv=5, scoring='accuracy',
    n_jobs=-1, verbose=0
)
grid_search.fit(X_train, y_train)

best_model = grid_search.best_estimator_
print(f"   Best parameters: {grid_search.best_params_}")
print(f"   Best CV accuracy: {grid_search.best_score_:.4f}")


# ═══════════════════════════════════════════════════════════
# STEP 6: Evaluation
# ═══════════════════════════════════════════════════════════
print("\n📈 Step 6: Evaluating model...")

# Test set evaluation
y_pred = best_model.predict(X_test)
test_accuracy = accuracy_score(y_test, y_pred)
print(f"\n   Test Accuracy: {test_accuracy:.4f} ({test_accuracy*100:.1f}%)")

print(f"\n   Classification Report:")
print(classification_report(y_test, y_pred, target_names=['No Disease', 'Heart Disease']))

print(f"   Confusion Matrix:")
cm = confusion_matrix(y_test, y_pred)
print(f"   {cm}")

# Cross-validation score on full dataset
cv_scores = cross_val_score(best_model, X, y, cv=10, scoring='accuracy')
print(f"\n   10-Fold CV Accuracy: {cv_scores.mean():.4f} (±{cv_scores.std():.4f})")
print(f"   Individual folds: {[round(s, 3) for s in cv_scores]}")


# ═══════════════════════════════════════════════════════════
# STEP 7: Save Model
# ═══════════════════════════════════════════════════════════
print("\n💾 Step 7: Saving model...")

with open(MODEL_PATH, 'wb') as f:
    pickle.dump(best_model, f)

model_size = os.path.getsize(MODEL_PATH) / 1024
print(f"   ✓ Model saved → {MODEL_PATH} ({model_size:.1f} KB)")
print(f"   ✓ Lambdas saved → {LAMBDA_PATH}")

print("\n" + "=" * 60)
print("  ✅ Training Complete!")
print(f"  Model: SVM (kernel={grid_search.best_params_['clf__kernel']}, C={grid_search.best_params_['clf__C']})")
print(f"  Test Accuracy: {test_accuracy*100:.1f}%")
print(f"  CV Accuracy: {cv_scores.mean()*100:.1f}%")
print("=" * 60 + "\n")
