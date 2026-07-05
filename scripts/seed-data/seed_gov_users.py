#!/usr/bin/env python3
"""Seed sample government officer accounts for demo purposes."""

import asyncio
import argparse
import os
import sys
import hashlib
import random

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text

DISTRICT_OFFICERS = {
    "Maharashtra": [
        {"username": "dm.mumbai", "name": "Rajesh Deshmukh", "role": "district_magistrate"},
        {"username": "dm.pune", "name": "Sunil Pawar", "role": "district_magistrate"},
        {"username": "dm.nagpur", "name": "Anita Kulkarni", "role": "district_magistrate"},
        {"username": "bdo.mumbai1", "name": "Suresh Patil", "role": "block_development_officer"},
        {"username": "bdo.pune1", "name": "Meena Jadhav", "role": "block_development_officer"},
        {"username": "scheme.mumbai", "name": "Vijay Shinde", "role": "scheme_officer"},
        {"username": "scheme.pune", "name": "Pooja Joshi", "role": "scheme_officer"},
    ],
    "Rajasthan": [
        {"username": "dm.jaipur", "name": "Arun Singh Rathore", "role": "district_magistrate"},
        {"username": "dm.jodhpur", "name": "Kavita Shekhawat", "role": "district_magistrate"},
        {"username": "bdo.jaipur1", "name": "Mohan Lal Sharma", "role": "block_development_officer"},
        {"username": "scheme.jaipur", "name": "Nirmala Chouhan", "role": "scheme_officer"},
        {"username": "scheme.udaipur", "name": "Ramesh Meena", "role": "scheme_officer"},
    ],
    "Tamil Nadu": [
        {"username": "dm.chennai", "name": "K. Murugan", "role": "district_magistrate"},
        {"username": "dm.coimbatore", "name": "S. Nirmala Devi", "role": "district_magistrate"},
        {"username": "bdo.chennai1", "name": "M. Rajendran", "role": "block_development_officer"},
        {"username": "scheme.chennai", "name": "L. Karpagam", "role": "scheme_officer"},
        {"username": "scheme.madurai", "name": "K. Pandian", "role": "scheme_officer"},
    ],
    "Bihar": [
        {"username": "dm.patna", "name": "Anand Kumar Sharma", "role": "district_magistrate"},
        {"username": "dm.gaya", "name": "Prabhat Sinha", "role": "district_magistrate"},
        {"username": "bdo.patna1", "name": "Ram Naresh Pandey", "role": "block_development_officer"},
        {"username": "scheme.patna", "name": "Sushila Devi", "role": "scheme_officer"},
        {"username": "scheme.muzaffarpur", "name": "Binod Kumar Singh", "role": "scheme_officer"},
    ],
    "Uttar Pradesh": [
        {"username": "dm.lucknow", "name": "Rajeev Gupta", "role": "district_magistrate"},
        {"username": "dm.kanpur", "name": "Neha Srivastava", "role": "district_magistrate"},
        {"username": "dm.varanasi", "name": "Vishal Mishra", "role": "district_magistrate"},
        {"username": "bdo.lucknow1", "name": "Dinesh Tiwari", "role": "block_development_officer"},
        {"username": "bdo.kanpur1", "name": "Santosh Yadav", "role": "block_development_officer"},
        {"username": "scheme.lucknow", "name": "Aradhana Shukla", "role": "scheme_officer"},
        {"username": "scheme.agra", "name": "Mohammad Rizwan", "role": "scheme_officer"},
    ],
}

STATE_ADMINS = [
    {"username": "admin.maharashtra", "name": "Prakash Desai", "state": "Maharashtra"},
    {"username": "admin.rajasthan", "name": "Manju Chauhan", "state": "Rajasthan"},
    {"username": "admin.tamilnadu", "name": "R. Subramanian", "state": "Tamil Nadu"},
    {"username": "admin.bihar", "name": "Shashi Bhushan", "state": "Bihar"},
    {"username": "admin.up", "name": "Rohit Saxena", "state": "Uttar Pradesh"},
]

SUPER_ADMINS = [
    {"username": "super.gramsathi", "name": "Dr. Ananya Sharma", "role": "super_admin"},
    {"username": "super.tech", "name": "Vikram Joshi", "role": "super_admin"},
]

ROLES_PERMISSIONS = {
    "super_admin": {"can_manage_all": True, "can_view_reports": True, "can_manage_users": True, "can_approve_schemes": True},
    "state_admin": {"can_manage_all": False, "can_view_reports": True, "can_manage_users": True, "can_approve_schemes": True, "scope": "state"},
    "district_magistrate": {"can_manage_all": False, "can_view_reports": True, "can_manage_users": False, "can_approve_schemes": True, "scope": "district"},
    "block_development_officer": {"can_manage_all": False, "can_view_reports": True, "can_manage_users": False, "can_approve_schemes": False, "scope": "block"},
    "scheme_officer": {"can_manage_all": False, "can_view_reports": True, "can_manage_users": False, "can_approve_schemes": False, "scope": "block", "scheme_focus": True},
}


async def seed_gov_users(connection_string: str):
    engine = create_async_engine(connection_string, echo=False)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS government_users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                username VARCHAR(100) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                role VARCHAR(100) NOT NULL,
                state VARCHAR(100),
                district VARCHAR(100),
                permissions JSONB DEFAULT '{}',
                is_active BOOLEAN DEFAULT TRUE,
                last_login TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        """))

    inserted = 0
    async with session_factory() as session:
        for state, officers in DISTRICT_OFFICERS.items():
            for officer in officers:
                perms = ROLES_PERMISSIONS.get(officer["role"], {})
                exists = await session.execute(
                    text("SELECT id FROM government_users WHERE username = :username"),
                    {"username": officer["username"]},
                )
                if not exists.fetchone():
                    await session.execute(
                        text("""
                            INSERT INTO government_users (username, name, role, state, permissions)
                            VALUES (:username, :name, :role, :state, :permissions)
                        """),
                        {
                            "username": officer["username"],
                            "name": officer["name"],
                            "role": officer["role"],
                            "state": state,
                            "permissions": perms,
                        },
                    )
                    inserted += 1

        for admin in STATE_ADMINS:
            perms = ROLES_PERMISSIONS["state_admin"]
            exists = await session.execute(
                text("SELECT id FROM government_users WHERE username = :username"),
                {"username": admin["username"]},
            )
            if not exists.fetchone():
                await session.execute(
                    text("""
                        INSERT INTO government_users (username, name, role, state, permissions)
                        VALUES (:username, :name, :role, :state, :permissions)
                    """),
                    {
                        "username": admin["username"],
                        "name": admin["name"],
                        "role": "state_admin",
                        "state": admin["state"],
                        "permissions": perms,
                    },
                )
                inserted += 1

        for super_admin in SUPER_ADMINS:
            perms = ROLES_PERMISSIONS["super_admin"]
            exists = await session.execute(
                text("SELECT id FROM government_users WHERE username = :username"),
                {"username": super_admin["username"]},
            )
            if not exists.fetchone():
                await session.execute(
                    text("""
                        INSERT INTO government_users (username, name, role, permissions)
                        VALUES (:username, :name, :role, :permissions)
                    """),
                    {
                        "username": super_admin["username"],
                        "name": super_admin["name"],
                        "role": "super_admin",
                        "permissions": perms,
                    },
                )
                inserted += 1

        await session.commit()

    await engine.dispose()
    return inserted


def main():
    parser = argparse.ArgumentParser(description="Seed government user accounts")
    parser.add_argument("--connection", help="PostgreSQL connection string (async)", default=None)
    args = parser.parse_args()

    conn = args.connection or os.getenv("DATABASE_URL")
    if not conn:
        print("ERROR: Provide --connection argument or set DATABASE_URL environment variable")
        sys.exit(1)

    inserted = asyncio.run(seed_gov_users(conn))
    print(f"Seeded {inserted} government user accounts successfully")


if __name__ == "__main__":
    main()
