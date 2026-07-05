import numpy as np
import pandas as pd
import random
import logging
from typing import Dict, List, Tuple, Optional
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

logger = logging.getLogger(__name__)

INDIAN_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal"
]

STATE_DISTRICTS = {
    "Uttar Pradesh": ["Lucknow", "Varanasi", "Agra", "Kanpur", "Allahabad", "Gorakhpur", "Ghaziabad"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad"],
    "Bihar": ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga"],
    "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Burdwan", "Nadia"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner"],
    "Karnataka": ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"],
    "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur", "Ujjain"],
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool"],
    "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Alappuzha"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
    "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Sambalpur", "Puri"],
    "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar"],
    "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Raigarh"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Nainital", "Rishikesh", "Haldwani"],
    "Himachal Pradesh": ["Shimla", "Dharamshala", "Manali", "Kullu", "Solan"]
}

CASTE_CATEGORIES = ["General", "OBC", "SC", "ST"]
GENDERS = ["Male", "Female", "Non-Binary"]
EDUCATION_LEVELS = [
    "No Formal Education", "Primary", "Middle", "High School",
    "Higher Secondary", "Graduate", "Post Graduate", "Technical Diploma"
]
OCCUPATIONS = [
    "Farmer", "Agricultural Laborer", "Daily Wager", "Government Employee",
    "Private Sector", "Self-Employed", "Student", "Homemaker", "Unemployed", "Retired"
]
SCHEME_CATEGORIES = [
    "education_aid", "agriculture_support", "housing_assistance",
    "healthcare_benefit", "women_empowerment", "disability_pension",
    "senior_citizen_pension", "employment_guarantee"
]


def generate_synthetic_citizen_data(n_samples: int = 100000, seed: int = 42) -> pd.DataFrame:
    """Generate realistic synthetic Indian citizen data for model development.

    Args:
        n_samples: Number of samples to generate.
        seed: Random seed for reproducibility.

    Returns:
        DataFrame with synthetic citizen features.
    """
    rng = np.random.default_rng(seed)
    random.seed(seed)

    state_weight = {
        "Uttar Pradesh": 0.17, "Maharashtra": 0.09, "Bihar": 0.08,
        "West Bengal": 0.075, "Tamil Nadu": 0.06, "Rajasthan": 0.055,
        "Karnataka": 0.055, "Gujarat": 0.05, "Madhya Pradesh": 0.05,
        "Andhra Pradesh": 0.045, "Kerala": 0.035, "Telangana": 0.035,
        "Punjab": 0.03, "Haryana": 0.025, "Odisha": 0.025,
        "Assam": 0.02, "Jharkhand": 0.02, "Chhattisgarh": 0.018,
        "Uttarakhand": 0.012, "Himachal Pradesh": 0.008
    }
    states = list(state_weight.keys())
    state_probs = [state_weight[s] for s in states]
    state_probs = np.array(state_probs) / sum(state_probs)

    states_col = rng.choice(states, size=n_samples, p=state_probs)
    districts_col = []
    for s in states_col:
        districts_col.append(rng.choice(STATE_DISTRICTS.get(s, ["Other"])))

    ages = np.clip(rng.normal(loc=38, scale=15, size=n_samples).astype(int), 18, 85)
    genders = rng.choice(GENDERS, size=n_samples, p=[0.49, 0.49, 0.02])
    caste_categories = rng.choice(CASTE_CATEGORIES, size=n_samples, p=[0.30, 0.40, 0.18, 0.12])

    education_probs = {
        "No Formal Education": 0.12, "Primary": 0.10, "Middle": 0.13,
        "High School": 0.20, "Higher Secondary": 0.18,
        "Graduate": 0.14, "Post Graduate": 0.08, "Technical Diploma": 0.05
    }
    education_levels = rng.choice(
        list(education_probs.keys()),
        size=n_samples,
        p=list(education_probs.values())
    )

    occupation_probs = [0.22, 0.12, 0.10, 0.06, 0.15, 0.11, 0.08, 0.08, 0.05, 0.03]
    occupations = rng.choice(OCCUPATIONS, size=n_samples, p=occupation_probs)

    land_holdings = np.zeros(n_samples)
    for i in range(n_samples):
        if occupations[i] == "Farmer":
            land_holdings[i] = rng.lognormal(mean=1.5, sigma=0.8)
        elif occupations[i] == "Agricultural Laborer":
            land_holdings[i] = rng.uniform(0, 0.5)
        else:
            land_holdings[i] = rng.exponential(scale=0.3) * rng.choice([0, 1], p=[0.4, 0.6])

    land_holdings = np.round(land_holdings, 2)

    annual_incomes = np.zeros(n_samples)
    for i in range(n_samples):
        base_income = {
            "No Formal Education": 80000, "Primary": 100000, "Middle": 120000,
            "High School": 150000, "Higher Secondary": 180000,
            "Graduate": 350000, "Post Graduate": 500000, "Technical Diploma": 300000
        }[education_levels[i]]

        occupation_multiplier = {
            "Farmer": 0.8, "Agricultural Laborer": 0.5, "Daily Wager": 0.6,
            "Government Employee": 2.5, "Private Sector": 1.8,
            "Self-Employed": 1.5, "Student": 0.1, "Homemaker": 0.0,
            "Unemployed": 0.0, "Retired": 0.7
        }[occupations[i]]

        income = base_income * occupation_multiplier * rng.uniform(0.7, 1.5)
        if land_holdings[i] > 2:
            income += land_holdings[i] * 30000 * rng.uniform(0.5, 1.5)

        annual_incomes[i] = max(0, int(income))

    is_farmer = (occupations == "Farmer") | (occupations == "Agricultural Laborer")

    has_disability = rng.binomial(1, p=0.04, size=n_samples)

    family_size = np.clip(rng.poisson(lam=4.5, size=n_samples), 1, 15).astype(int)

    data = pd.DataFrame({
        "age": ages,
        "gender": genders,
        "caste_category": caste_categories,
        "state": states_col,
        "district": districts_col,
        "annual_income": annual_incomes,
        "is_farmer": is_farmer.astype(int),
        "has_disability": has_disability,
        "education_level": education_levels,
        "occupation": occupations,
        "land_holding": land_holdings,
        "family_size": family_size,
        "citizen_id": [f"SYNT_{i:07d}" for i in range(n_samples)]
    })

    return data


def compute_eligibility_labels(data: pd.DataFrame) -> pd.DataFrame:
    """Compute ground-truth eligibility labels based on policy rules.

    Each scheme category is a binary label derived from government scheme criteria.

    Args:
        data: DataFrame with citizen features.

    Returns:
        DataFrame with binary eligibility columns per scheme category.
    """
    labels = pd.DataFrame(index=data.index)

    age = data["age"].values
    income = data["annual_income"].values
    caste = data["caste_category"].values
    education = data["education_level"].values
    occupation = data["occupation"].values
    has_disability = data["has_disability"].values
    is_farmer = data["is_farmer"].values
    land = data["land_holding"].values
    gender = data["gender"].values
    family = data["family_size"].values

    labels["education_aid"] = (
        (age.between(6, 24)) &
        (income < 250000) &
        (caste.isin(["SC", "ST", "OBC"]))
    ).astype(int)

    labels["agriculture_support"] = (
        (is_farmer == 1) &
        (land < 5) &
        (income < 300000)
    ).astype(int)

    labels["housing_assistance"] = (
        (income < 200000) &
        (land < 1) &
        (caste.isin(["SC", "ST", "OBC"])) &
        (family >= 3)
    ).astype(int)

    labels["healthcare_benefit"] = (
        (income < 300000) &
        (age > 40)
    ).astype(int)

    labels["women_empowerment"] = (
        (gender == "Female") &
        (income < 250000) &
        (age.between(18, 60))
    ).astype(int)

    labels["disability_pension"] = (
        (has_disability == 1) &
        (income < 500000) &
        (age.between(18, 80))
    ).astype(int)

    labels["senior_citizen_pension"] = (
        (age >= 60) &
        (income < 300000) &
        (caste.isin(["SC", "ST", "OBC"]))
    ).astype(int)

    labels["employment_guarantee"] = (
        (age.between(18, 60)) &
        (income < 200000) &
        (occupation.isin(["Daily Wager", "Agricultural Laborer", "Unemployed"]))
    ).astype(int)

    return labels


FEATURES = {
    "numeric": ["age", "annual_income", "land_holding", "family_size"],
    "categorical": [
        "gender", "caste_category", "state", "district",
        "education_level", "occupation"
    ],
    "binary": ["is_farmer", "has_disability"]
}
TARGET_COLUMNS = SCHEME_CATEGORIES


def build_preprocessing_pipeline() -> ColumnTransformer:
    """Build sklearn ColumnTransformer for feature preprocessing.

    Returns:
        Configured ColumnTransformer with imputers, encoders, and scalers.
    """
    numeric_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

    categorical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="constant", fill_value="Unknown")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    binary_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent"))
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, FEATURES["numeric"]),
            ("cat", categorical_transformer, FEATURES["categorical"]),
            ("bin", binary_transformer, FEATURES["binary"])
        ],
        remainder="drop"
    )

    return preprocessor


def load_from_dataframe(
    df: pd.DataFrame
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Load features and labels from a DataFrame with train/test split.

    Args:
        df: DataFrame containing features and target columns.

    Returns:
        Tuple of (X_train, X_test, y_train, y_test).
    """
    X = df[[col for col in FEATURES["numeric"] + FEATURES["categorical"] + FEATURES["binary"]
            if col in df.columns]]
    y = df[TARGET_COLUMNS]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y.sum(axis=1).clip(upper=1)
    )

    return X_train, X_test, y_train, y_test


def load_from_bigquery(query: str) -> pd.DataFrame:
    """Load data from BigQuery.

    Args:
        query: SQL query string.

    Returns:
        DataFrame with query results.
    """
    try:
        from google.cloud import bigquery
        client = bigquery.Client()
        df = client.query(query).to_dataframe()
        logger.info(f"Loaded {len(df)} records from BigQuery")
        return df
    except ImportError:
        logger.error("google-cloud-bigquery not installed")
        raise
    except Exception as e:
        logger.error(f"Failed to load data from BigQuery: {e}")
        raise


def validate_data(df: pd.DataFrame) -> Dict[str, bool]:
    """Validate data quality using Great Expectations.

    Args:
        df: DataFrame to validate.

    Returns:
        Dictionary of expectation results.
    """
    try:
        import great_expectations as ge
        ge_df = ge.from_pandas(df)

        results = {
            "age_range": ge_df.expect_column_values_to_be_between("age", 18, 85).success,
            "income_non_negative": ge_df.expect_column_values_to_be_between("annual_income", 0, 1e8).success,
            "gender_valid": ge_df.expect_column_values_to_be_in_set("gender", GENDERS).success,
            "caste_valid": ge_df.expect_column_values_to_be_in_set("caste_category", CASTE_CATEGORIES).success,
            "state_valid": ge_df.expect_column_values_to_be_in_set("state", INDIAN_STATES).success,
            "education_valid": ge_df.expect_column_values_to_be_in_set("education_level", EDUCATION_LEVELS).success,
            "occupation_valid": ge_df.expect_column_values_to_be_in_set("occupation", OCCUPATIONS).success,
            "family_size_positive": ge_df.expect_column_values_to_be_between("family_size", 1, 15).success,
            "land_holding_non_negative": ge_df.expect_column_values_to_be_between("land_holding", 0, None).success,
            "no_nulls_critical": ge_df.expect_column_values_to_not_be_null("age").success
        }

        logger.info(f"Data validation passed: {sum(results.values())}/{len(results)}")
        return results

    except ImportError:
        logger.warning("Great Expectations not installed. Skipping validation.")
        return {"great_expectations_not_available": False}


def generate_training_dataset(
    n_samples: int = 100000,
    output_path: Optional[str] = None,
    seed: int = 42
) -> pd.DataFrame:
    """Generate complete synthetic dataset with features and labels.

    Args:
        n_samples: Number of samples.
        output_path: Optional path to save CSV.
        seed: Random seed.

    Returns:
        Complete DataFrame with features and labels.
    """
    logger.info(f"Generating {n_samples} synthetic citizen records...")
    data = generate_synthetic_citizen_data(n_samples=n_samples, seed=seed)
    labels = compute_eligibility_labels(data)
    result = pd.concat([data, labels], axis=1)

    validation_results = validate_data(result)
    failed = [k for k, v in validation_results.items() if not v]
    if failed:
        logger.warning(f"Data validation warnings for: {failed}")

    scheme_counts = labels.sum()
    logger.info("Eligibility distribution:")
    for col in TARGET_COLUMNS:
        logger.info(f"  {col}: {scheme_counts[col]} ({100*scheme_counts[col]/n_samples:.1f}%)")

    if output_path:
        result.to_csv(output_path, index=False)
        logger.info(f"Dataset saved to {output_path}")

    return result


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    df = generate_training_dataset(n_samples=100000)
    print(f"Generated {len(df)} records")
    print(df.head())
    print(df.describe())
