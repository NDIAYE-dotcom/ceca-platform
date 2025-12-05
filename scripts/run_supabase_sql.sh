#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/run_supabase_sql.sh [path/to/script.sql]
# Defaults to sql/init_supabase.sql

SCRIPT=${1:-sql/init_supabase.sql}

if ! command -v supabase >/dev/null 2>&1; then
  echo "Supabase CLI not found. Install with Homebrew: brew install supabase/tap/supabase or npm install -g supabase"
  exit 1
fi

if [ ! -f "$SCRIPT" ]; then
  echo "SQL file not found: $SCRIPT"
  exit 1
fi

echo "Running Supabase SQL script: $SCRIPT"
supabase db query < "$SCRIPT"
echo "Done. Check Supabase Studio to confirm tables were created."
