import numpy as np

from emobooks.features import extract_features
from emobooks.inference import combine_probabilities

EMOTIONS = ["angry_disgusted", "fearful", "happy", "sad", "surprised"]


def test_threshold_gate_is_preserved_instead_of_joint_argmax():
    category, scores, emotional = combine_probabilities(.35, [.01, .01, .60, .02, .01], EMOTIONS, .68)
    assert scores["happy"] > scores["neutral"]
    assert category == "neutral"  # The exported model's gate still chooses neutral.
    assert abs(sum(scores.values()) - 1) < 1e-6
    assert abs(emotional - .65) < 1e-6


def test_emotional_gate_uses_calibrated_conditional_scores():
    category, scores, emotional = combine_probabilities(.1, [.1, .2, .05, .5, .05], EMOTIONS, .68)
    assert category == "sad"
    assert abs(sum(scores.values()) - 1) < 1e-6


def test_feature_order_and_training_lexicons():
    features = extract_features("He was VERY angry! He never smiled.")
    assert features.shape == (18,)
    assert features.dtype == np.float32
    assert np.isfinite(features).all()
    assert abs(features[4] - np.log1p(7)) < 1e-6
    assert abs(features[6] - 1 / 7) < 1e-6  # exclamations per word
    assert abs(features[9] - 1 / 7) < 1e-6  # uppercase words per word
    assert abs(features[10] - 1 / 7) < 1e-6  # negation
    assert abs(features[11] - 1 / 7) < 1e-6  # intensifier
    assert abs(features[12] - 1 / 7) < 1e-6  # angry
    assert abs(features[14] - 1 / 7) < 1e-6  # smile, stemmed
    assert abs(features[17] - 2 / 7) < 1e-6
