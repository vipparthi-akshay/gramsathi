# GramSathi Dialect Detection

## Overview

GramSathi uses a multi-strategy approach for dialect identification:

1. **Primary**: Google Gemini API's built-in dialect recognition capability
2. **Fallback**: Fine-tuned lightweight classification model for offline inference

## Approach

### Gemini API Strategy

Send raw audio/text input to Gemini with a prompt requesting dialect identification.
Gemini's multilingual NLU can identify dialects with high accuracy without dedicated training.

### Fine-Tuning Approach (Fallback)

If latency or cost constraints require offline inference, we fine-tune a sequence classifier:

- Base: `bert-base-multilingual-cased` or `distilbert-base-multilingual-cased`
- Dataset: 50,000+ labelled dialect utterances per language
- Architecture: Linear classification head on pooled embeddings
- Framework: Hugging Face Transformers + PyTorch
- Export: ONNX for fast CPU inference

```python
# Example fine-tuning snippet
from transformers import AutoTokenizer, AutoModelForSequenceClassification

model = AutoModelForSequenceClassification.from_pretrained(
    "bert-base-multilingual-cased",
    num_labels=48  # 48 dialect classes across all languages
)
```

## Supported Dialects

### Hindi Family (7 dialects)
| Dialect | Region | Distinguishing Features |
|---------|--------|------------------------|
| Bhojpuri | Bihar/Eastern UP | "ka", "ba" verb endings |
| Awadhi | Awadh/Uttar Pradesh | "-it" suffix, "ham" for main |
| Bundeli | Bundelkhand/Madhya Pradesh | "-yo" suffix |
| Chhattisgarhi | Chhattisgarh | "-we" verbal suffix |
| Haryanvi | Haryana | "ka se", "kade" |
| Marwari | Rajasthan | "kan", "kau" |
| Braj | Braj/Vrindavan | "-yo", "rai" |

### Marathi Family (4 dialects)
| Dialect | Region | Distinguishing Features |
|---------|--------|------------------------|
| Vidarbhi | Vidarbha | Short feminine verb forms |
| Konkan | Konkan coast | "hānv", present verb forms |
| Varhadi | Wardha/Nagpur | "kasa ahas" |
| Ahirani | Khandesh | "bara vait" |

### Bengali Family (4 dialects)
| Dialect | Region |
|---------|--------|
| Standard | West Bengal |
| Sylheti | Sylhet division |
| Chittagonian | Chittagong |
| Rajbanshi | North Bengal |

### Tamil Family (5 dialects)
| Dialect | Region |
|---------|--------|
| Standard | Tamil Nadu |
| Chennai | Chennai urban |
| Madurai | Madurai/south |
| Coimbatore | Kongu Nadu |
| Sri Lankan | Northern Sri Lanka |

### Telugu Family (2 dialects)
| Dialect | Region |
|---------|--------|
| Standard | Coastal Andhra |
| Telangana | Telangana region |
| Rayalaseema | Rayalaseema region |

### Additional Languages (17 languages with regional variations)
| Language | Dialect Coverage |
|----------|-----------------|
| Gujarati | Saurashtra, Ahmedabad, Standard |
| Kannada | North Karnataka, Dakshina Kannada, Standard |
| Malayalam | Kasaragod, Thiruvananthapuram, Standard |
| Punjabi | Majhi, Doabi, Malwai |
| Odia | Sambalpuri, Balasore, Standard |
| Assamese | Kamrupi, Standard |
| Urdu | Dakhini, Lucknowi, Standard |
| Maithili | Standard |
| Santali | Standard |
| Kashmiri | Srinagar, Standard |
| Nepali | Standard |
| Sindhi | Standard |
| Konkani | Goan, Karwari |
| Dogri | Standard |
| Bodo | Standard |
| Manipuri | Standard |

## Total: 23 languages, 48 dialect variants

## Data Collection Strategy

### Sources
1. **Field recordings**: GramSathi field agent app captures consent-based voice samples
2. **Public datasets**: Common Voice, OdiEnCorp, IIT Madras speech corpora
3. **MT transcription**: Recordings transcribed by Gemini with human verification
4. **Synthetic generation**: LLM-generated dialect phrases with human review

### Quality Requirements
- Minimum 1,000 utterances per dialect variant
- At least 100 unique speakers per variant
- Gender balance (>40% each)
- Age distribution (18-70+)
- Rural/urban diversity

### Privacy Considerations
- All voice data PII-safe (no full names, addresses)
- Consent obtained per recording session
- Right-to-deletion compliant (GDPR/Section 5)
- Audio stored encrypted at rest

## Evaluation Methodology

### Metrics
- **Dialect classification accuracy** per language family
- **Confusion matrix** across closely-related dialects
- **Character error rate (CER)** for downstream ASR
- **Inference latency** (p50/p99 for real-time use)
- **Fairness disparity** across demographic groups

### Validation Protocol
1. Hold-out test set: 20% of collected data (stratified by dialect)
2. Cross-validation: 5-fold within each language family
3. Human evaluation: 3 annotators per 500-sample subset
4. Live A/B test: Gemini API vs fine-tuned model on 10% production traffic

### Acceptance Criteria
- Per-dialect F1 >= 0.85 for dialects with >= 2,000 samples
- Macro F1 >= 0.80 across all dialects
- p99 inference latency < 500 ms (excluding transport)
- Demographic fairness (equal opportunity difference < 0.1)
