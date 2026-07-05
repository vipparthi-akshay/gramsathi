#!/usr/bin/env python3
"""Generate and seed 5000 sample citizens with realistic Indian data."""

import asyncio
import argparse
import os
import sys
import random
import uuid
from datetime import date, timedelta
from typing import Optional

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text

STATES = {
    "Maharashtra": {"districts": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Kolhapur"]},
    "Rajasthan": {"districts": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Alwar", "Sikar"]},
    "Tamil Nadu": {"districts": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Vellore", "Erode"]},
    "Bihar": {"districts": ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga", "Purnia", "Sasaram", "Hajipur"]},
    "Uttar Pradesh": {"districts": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Prayagraj", "Ghaziabad", "Meerut", "Bareilly", "Aligarh", "Moradabad"]},
}

FIRST_NAMES = {
    "male": [
        "Aarav", "Vihaan", "Vivaan", "Ananya", "Diya", "Advik", "Kabir", "Arjun",
        "Reyansh", "Ayaan", "Ishaan", "Shaurya", "Pranav", "Dhruv", "Krishna",
        "Rahul", "Amit", "Vijay", "Sanjay", "Rajesh", "Suresh", "Mahesh",
        "Ramesh", "Dinesh", "Ganesh", "Manish", "Nitin", "Prakash", "Sunil",
        "Ashok", "Vikas", "Deepak", "Anil", "Harish", "Mohan", "Shyam",
        "Ravi", "Kishore", "Naresh", "Jitendra", "Pramod", "Vinod", "Rajendra",
        "Manoj", "Sachin", "Dhananjay", "Yogesh", "Siddharth", "Abhishek", "Harsh",
    ],
    "female": [
        "Aanya", "Aaradhya", "Ananya", "Diya", "Isha", "Myra", "Sara", "Aadhya",
        "Anaya", "Paridhi", "Riya", "Jiya", "Ishita", "Navya", "Priya",
        "Sunita", "Anita", "Geeta", "Neeta", "Kavita", "Savitri", "Laxmi",
        "Sita", "Radha", "Meena", "Shanti", "Kanta", "Shobha", "Rekha",
        "Usha", "Asha", "Nirmala", "Kamala", "Mala", "Anjali", "Poonam",
        "Sangeeta", "Neha", "Shweta", "Pooja", "Seema", "Deepika", "Shalini",
        "Vandana", "Ritu", "Nisha", "Komal", "Swati", "Divya", "Manju",
    ],
}

LAST_NAMES = [
    "Sharma", "Verma", "Gupta", "Kumar", "Singh", "Yadav", "Patel", "Reddy",
    "Nair", "Menon", "Iyer", "Deshmukh", "Joshi", "Kulkarni", "Patil", "Pawar",
    "Gaikwad", "Shinde", "More", "Jadhav", "Sawant", "Mane", "Chavan", "Rathore",
    "Shekhawat", "Chauhan", "Solanki", "Gehlot", "Trivedi", "Dave", "Shah",
    "Mehta", "Pandey", "Mishra", "Dubey", "Tiwari", "Shukla", "Srivastava",
    "Agarwal", "Jain", "Rawat", "Negi", "Rana", "Bisht", "Thakur", "Choudhary",
    "Khan", "Ansari", "Sheikh", "Qureshi", "Mirza", "Naidu", "Raju", "Venkatesh",
    "Murugan", "Pillai", "Gopalan", "Krishnan", "Swamy", "Rao", "Murthy", "Prasad",
]

STATUSES = ["pending", "under_review", "approved", "rejected", "additional_info_required", "processing"]

APPLICATION_STATUS_WEIGHTS = {
    "pending": 0.15,
    "under_review": 0.20,
    "approved": 0.35,
    "rejected": 0.15,
    "additional_info_required": 0.10,
    "processing": 0.05,
}

SCHEME_CODES = [
    "pm-kisan", "pm-ayushman", "pm-awas", "ujjwala", "mg-nrega",
    "pm-kaushal-vikas", "jan-dhan", "pm-svanidhi", "pm-mudra",
    "sukanya-samriddhi", "national-scholarship", "rural-pension",
]

CASTE_CATEGORIES = ["General", "OBC", "SC", "ST"]
GENDERS = ["male", "female"]
OCCUPATIONS = [
    "Farmer", "Agricultural Laborer", "Daily Wage Worker", "Teacher",
    "Shopkeeper", "Artisan", "Housewife", "Student", "Retired",
    "Driver", "Construction Worker", "Street Vendor", "Domestic Worker",
    "Government Employee", "Private Employee", "Self-Employed",
]
EDUCATION_LEVELS = [
    "No Formal Education", "Primary", "Middle", "Secondary",
    "Higher Secondary", "Graduate", "Post Graduate", "Vocational Training",
]
INCOME_RANGES = [
    (0, 50000, 0.15),
    (50000, 100000, 0.25),
    (100000, 200000, 0.30),
    (200000, 350000, 0.18),
    (350000, 500000, 0.08),
    (500000, 1000000, 0.03),
    (1000000, 2000000, 0.01),
]


def generate_aadhaar():
    return f"{random.randint(1000, 9999)} {random.randint(1000, 9999)} {random.randint(1000, 9999)}"


def generate_phone():
    prefixes = ["98765", "99887", "99876", "98760", "98761", "99880", "77600", "77601", "98900", "98901"]
    return f"{random.choice(prefixes)}{random.randint(10000, 99999)}"


def generate_income():
    r = random.random()
    cumulative = 0
    for low, high, weight in INCOME_RANGES:
        cumulative += weight
        if r <= cumulative:
            return random.randint(low, high)
    return random.randint(0, 50000)


def generate_dob(age_min=18, age_max=85):
    today = date.today()
    age = random.randint(age_min, age_max)
    start = today - timedelta(days=age * 365 + 365)
    end = today - timedelta(days=age * 365)
    delta = (end - start).days
    return start + timedelta(days=random.randint(0, delta))


def generate_family_members(gender, age, income):
    members = []
    count = random.choices([1, 2, 3, 4, 5], weights=[0.10, 0.25, 0.35, 0.20, 0.10])[0]

    for _ in range(count):
        m_gender = random.choice(GENDERS)
        m_age = 0
        m_relation = ""
        m_occupation = "Dependent"

        if random.random() < 0.15:
            m_age = random.randint(1, 12)
            m_relation = "Child"
            m_occupation = "Student"
        elif random.random() < 0.20:
            m_age = random.randint(13, 18)
            m_relation = "Child"
            m_occupation = "Student"
        elif random.random() < 0.40:
            m_age = random.randint(20, 55)
            m_relation = "Spouse"
            m_occupation = random.choice(OCCUPATIONS)
        else:
            m_age = random.randint(56, 80)
            m_relation = "Parent"
            m_occupation = "Retired"

        members.append({
            "gender": m_gender,
            "age": m_age,
            "relation": m_relation,
            "occupation": m_occupation,
            "education": random.choice(EDUCATION_LEVELS),
        })

    return members


def generate_person(state_index):
    state_name = list(STATES.keys())[state_index]
    gender = random.choice(GENDERS)
    first_name = random.choice(FIRST_NAMES[gender])
    last_name = random.choice(LAST_NAMES)
    dob = generate_dob()
    age = date.today().year - dob.year
    income = generate_income()
    family = generate_family_members(gender, age, income)

    return {
        "aadhaar": generate_aadhaar(),
        "name": f"{first_name} {last_name}",
        "gender": gender,
        "dob": dob.isoformat(),
        "age": age,
        "phone": generate_phone(),
        "email": f"{first_name.lower()}.{last_name.lower()}{random.randint(1, 999)}@example.com",
        "state": state_name,
        "district": random.choice(STATES[state_name]["districts"]),
        "village": f"{random.choice(['Gram', 'Nagal', 'Pur', 'Gaon', 'Nagar', 'Kheda', 'Palli', 'Wadi'])} {random.choice(['Bada', 'Chhota', 'Naya', 'Purana', 'Madhya'])}",
        "pincode": random.randint(100000, 999999),
        "caste": random.choice(CASTE_CATEGORIES),
        "occupation": random.choice(OCCUPATIONS),
        "education": random.choice(EDUCATION_LEVELS),
        "income": income,
        "bpl": random.random() < 0.30,
        "family_members": family,
        "is_active": True,
    }


async def seed_citizens(connection_string: str, count: int):
    engine = create_async_engine(connection_string, echo=False)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS citizens (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                aadhaar_hash VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                gender VARCHAR(10) NOT NULL,
                dob DATE NOT NULL,
                phone VARCHAR(15),
                email VARCHAR(255),
                state VARCHAR(100) NOT NULL,
                district VARCHAR(100) NOT NULL,
                village VARCHAR(255),
                pincode VARCHAR(10),
                caste VARCHAR(50),
                occupation VARCHAR(100),
                education VARCHAR(100),
                annual_income NUMERIC(12, 2) DEFAULT 0,
                bpl BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """))

        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS citizen_family_members (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                citizen_id UUID REFERENCES citizens(id),
                gender VARCHAR(10) NOT NULL,
                age INTEGER NOT NULL,
                relation VARCHAR(50) NOT NULL,
                occupation VARCHAR(100),
                education VARCHAR(100),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """))

        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS applications (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                citizen_id UUID REFERENCES citizens(id),
                scheme_code VARCHAR(50) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                application_data JSONB DEFAULT '{}',
                submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """))

    inserted = 0
    async with session_factory() as session:
        for i in range(count):
            state_idx = i % len(STATES)
            person = generate_person(state_idx)

            import hashlib
            aadhaar_hash = hashlib.sha256(person["aadhaar"].encode()).hexdigest()

            result = await session.execute(
                text("SELECT id FROM citizens WHERE aadhaar_hash = :hash"),
                {"hash": aadhaar_hash},
            )
            if result.fetchone():
                continue

            result = await session.execute(
                text("""
                    INSERT INTO citizens (aadhaar_hash, name, gender, dob, phone, email,
                                          state, district, village, pincode, caste,
                                          occupation, education, annual_income, bpl, is_active)
                    VALUES (:aadhaar_hash, :name, :gender, :dob, :phone, :email,
                            :state, :district, :village, :pincode, :caste,
                            :occupation, :education, :income, :bpl, :is_active)
                    RETURNING id
                """),
                {
                    "aadhaar_hash": aadhaar_hash,
                    "name": person["name"],
                    "gender": person["gender"],
                    "dob": person["dob"],
                    "phone": person["phone"],
                    "email": person["email"],
                    "state": person["state"],
                    "district": person["district"],
                    "village": person["village"],
                    "pincode": str(person["pincode"]),
                    "caste": person["caste"],
                    "occupation": person["occupation"],
                    "education": person["education"],
                    "income": person["income"],
                    "bpl": person["bpl"],
                    "is_active": person["is_active"],
                },
            )
            citizen_id = result.scalar_one()

            for member in person["family_members"]:
                await session.execute(
                    text("""
                        INSERT INTO citizen_family_members (citizen_id, gender, age, relation, occupation, education)
                        VALUES (:citizen_id, :gender, :age, :relation, :occupation, :education)
                    """),
                    {
                        "citizen_id": citizen_id,
                        "gender": member["gender"],
                        "age": member["age"],
                        "relation": member["relation"],
                        "occupation": member["occupation"],
                        "education": member["education"],
                    },
                )

            if random.random() < 0.4:
                num_apps = random.choices([1, 2, 3], weights=[0.6, 0.3, 0.1])[0]
                schemes = random.sample(SCHEME_CODES, min(num_apps, len(SCHEME_CODES)))
                for scheme_code in schemes:
                    status = random.choices(STATUSES, weights=[APPLICATION_STATUS_WEIGHTS[s] for s in STATUSES])[0]
                    await session.execute(
                        text("""
                            INSERT INTO applications (citizen_id, scheme_code, status, application_data)
                            VALUES (:citizen_id, :scheme_code, :status, :application_data)
                        """),
                        {
                            "citizen_id": citizen_id,
                            "scheme_code": scheme_code,
                            "status": status,
                            "application_data": {
                                "submission_channel": random.choice(["web", "mobile", "helpdesk", "gram_sabha"]),
                                "language": random.choice(["hi", "mr", "ta", "bn", "te"]),
                            },
                        },
                    )

            inserted += 1
            if inserted % 500 == 0:
                print(f"  Inserted {inserted}/{count} citizens...")
                await session.commit()

        await session.commit()

    await engine.dispose()
    return inserted


def main():
    parser = argparse.ArgumentParser(description="Seed sample citizens into PostgreSQL")
    parser.add_argument("--count", type=int, default=5000, help="Number of citizens to generate (default: 5000)")
    parser.add_argument("--connection", help="PostgreSQL connection string (async)", default=None)
    args = parser.parse_args()

    conn = args.connection or os.getenv("DATABASE_URL")
    if not conn:
        print("ERROR: Provide --connection argument or set DATABASE_URL environment variable")
        sys.exit(1)

    print(f"Generating {args.count} citizens...")
    inserted = asyncio.run(seed_citizens(conn, args.count))
    print(f"Seeded {inserted} citizens successfully")


if __name__ == "__main__":
    main()
