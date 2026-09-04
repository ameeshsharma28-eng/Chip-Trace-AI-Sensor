"""NumPy softmax classifier and Gaussian anomaly scorer (no sklearn required)."""

from __future__ import annotations

import numpy as np


def standardize_fit(X: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    mean = X.mean(axis=0)
    std = X.std(axis=0)
    std[std < 1e-6] = 1.0
    return mean.astype(np.float32), std.astype(np.float32)


def standardize_apply(X: np.ndarray, mean: np.ndarray, std: np.ndarray) -> np.ndarray:
    return (X - mean) / std


class SoftmaxClassifier:
    def __init__(self, n_classes: int):
        self.n_classes = n_classes
        self.W = None
        self.b = None
        self.mean = None
        self.std = None
        self.temperature = 1.0
        self.classes_ = np.arange(n_classes)

    def _proba(self, Xn: np.ndarray) -> np.ndarray:
        logits = (Xn @ self.W + self.b) / max(self.temperature, 1e-3)
        logits = logits - logits.max(axis=1, keepdims=True)
        exp = np.exp(np.clip(logits, -50, 50))
        return exp / (exp.sum(axis=1, keepdims=True) + 1e-9)

    def fit(
        self,
        X: np.ndarray,
        y: np.ndarray,
        X_val: np.ndarray | None = None,
        y_val: np.ndarray | None = None,
        lr: float = 0.15,
        epochs: int = 120,
    ) -> "SoftmaxClassifier":
        y = y.astype(int)
        self.mean, self.std = standardize_fit(X)
        Xn = standardize_apply(X, self.mean, self.std)
        n, d = Xn.shape
        k = self.n_classes
        counts = np.bincount(y, minlength=k).astype(np.float32)
        counts[counts == 0] = 1.0
        class_w = counts.sum() / (k * counts)
        sample_w = class_w[y]
        sample_w = sample_w / sample_w.mean()
        self.W = np.zeros((d, k), dtype=np.float32)
        self.b = np.zeros(k, dtype=np.float32)
        Y = np.eye(k, dtype=np.float32)[y]
        for _ in range(epochs):
            P = self._proba(Xn)
            err = (P - Y) * sample_w[:, None]
            self.W -= lr * (Xn.T @ err) / n
            self.b -= lr * err.mean(axis=0)
            lr *= 0.985
        if X_val is not None and y_val is not None and len(y_val) > 0:
            self._fit_temperature(X_val, y_val)
        return self

    def _fit_temperature(self, X_val: np.ndarray, y_val: np.ndarray) -> None:
        Xn = standardize_apply(X_val, self.mean, self.std)
        logits = Xn @ self.W + self.b
        y_val = y_val.astype(int)
        best_t, best_nll = 1.0, 1e9
        for t in np.linspace(0.5, 3.0, 26):
            z = logits / t
            z = z - z.max(axis=1, keepdims=True)
            logp = z - np.log(np.exp(z).sum(axis=1, keepdims=True) + 1e-9)
            nll = float(-logp[np.arange(len(y_val)), y_val].mean())
            if nll < best_nll:
                best_nll, best_t = nll, float(t)
        self.temperature = best_t

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        Xn = standardize_apply(X, self.mean, self.std)
        return self._proba(Xn)

    def predict(self, X: np.ndarray) -> np.ndarray:
        return self.predict_proba(X).argmax(axis=1)


class GaussianAnomaly:
    def fit(self, X: np.ndarray) -> "GaussianAnomaly":
        self.mean, self.std = standardize_fit(X)
        Xn = standardize_apply(X, self.mean, self.std)
        dist = np.sqrt((Xn ** 2).sum(axis=1))
        self.dist_mean = float(dist.mean())
        self.dist_std = float(dist.std() + 1e-6)
        return self

    def decision_function(self, X: np.ndarray) -> np.ndarray:
        """Higher is more normal (sklearn IsolationForest convention)."""
        Xn = standardize_apply(X, self.mean, self.std)
        dist = np.sqrt((Xn ** 2).sum(axis=1))
        z = (dist - self.dist_mean) / self.dist_std
        return -z
