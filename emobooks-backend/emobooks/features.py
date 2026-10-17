"""The same 18 features, lexicons and ordering as the supplied training code."""
import re

import numpy as np
from nltk.stem import PorterStemmer
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

stemmer = PorterStemmer()
sentiment_analyzer = SentimentIntensityAnalyzer()

LEXICONS = (
    "anger angry angrily furious fury rage enraged hate hatred annoyed irritation mad revenge cruel disgust disgusted fight enemy wicked wrath insult betray betrayal hostile",
    "fear feared fearful afraid frightened scared terror terrified panic horror dread dangerous threat worry worried anxious anxiety nervous trembling scream alarm escape nightmare",
    "happy happiness joy joyful delight delighted smile smiling laugh laughing cheerful pleased pleasure glad wonderful lovely love hope hopeful optimism enjoy celebrate success beautiful friendly kindness excited excitement",
    "sad sadness unhappy sorrow cry crying tears grief miserable lonely loneliness lost loss death died dead hurt pain suffering heartbroken regret remorse depressed despair hopeless disappointed",
    "surprise surprised surprising suddenly sudden astonished amazed wonder unexpected unexpectedly shock shocked startled incredible unbelievable strange extraordinary realization realized reveal",
    "not no never neither nor none nobody nothing nowhere hardly barely cannot can't couldn't wouldn't shouldn't isn't wasn't weren't don't doesn't didn't won't",
    "very extremely really terribly absolutely completely totally deeply highly greatly awfully incredibly remarkably so too quite",
)
STEM_SETS = tuple({stemmer.stem(word.lower()) for word in words.split()} for words in LEXICONS)


def extract_features(text):
    sentiment = sentiment_analyzer.polarity_scores(text)
    words = re.findall(r"[A-Za-z']+", text)
    stems = [stemmer.stem(word.lower()) for word in words]
    n_words, n_chars = max(len(words), 1), max(len(text), 1)
    anger, fear, happy, sad, surprise, negation, intensity = (
        sum(stem in lexicon for stem in stems) / n_words for lexicon in STEM_SETS
    )
    return np.array([
        sentiment["neg"], sentiment["neu"], sentiment["pos"], sentiment["compound"],
        np.log1p(len(words)), sum(len(word) for word in words) / n_words,
        text.count("!") / n_words, text.count("?") / n_words,
        len(re.findall(r"[!?.,;:]", text)) / n_chars,
        sum(len(word) > 1 and word.isupper() for word in words) / n_words,
        negation, intensity, anger, fear, happy, sad, surprise,
        anger + fear + happy + sad + surprise,
    ], dtype=np.float32)
