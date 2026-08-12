#!/usr/bin/env bash
#
# One-shot template initializer.
#
# Renames every reference of "react-template" (kebab), "React Template"
# (display name in the UI/meta tags), and "ReactTemplate" (PascalCase form
# used by the CDK stack name) to the new project's equivalents, then deletes
# itself. Run once after cloning the template.
#
# Usage:
#   ./scripts/init-template.sh <new-project-name> ["New Display Name"]
#
# <new-project-name>     kebab-case identifier; replaces "react-template".
#                        Must match ^[a-z][a-z0-9-]*[a-z0-9]$ so it is valid
#                        for npm package names, S3 bucket suffixes, Docker
#                        tags, and ghcr.io image paths.
#
# "New Display Name"     optional human-readable form; replaces "React
#                        Template" in meta tags and the UI. Defaults to a
#                        Title-Cased version of the kebab name.
#
# A PascalCase form (used only by the CDK stack name) is derived from the
# kebab name and replaces "ReactTemplate".
#
# What is NOT renamed (change by hand if you want to):
#   - GHCR namespace        "ruchira088"
#   - AWS account ID        "365562660444"
#   - AWS region            "ap-southeast-2"
#   - Base domain           "ruchij.com"
#
# Portability: this has to run on a stock macOS install as well as GNU/Linux,
# so it assumes only bash 3.2 and POSIX sed. GNU-only constructs (`sed -i`
# without a suffix, `\U` in a replacement) are avoided -- see the notes below.

set -euo pipefail

usage() {
    echo "Usage: $0 <new-project-name> [\"New Display Name\"]" >&2
    exit 1
}

[[ $# -ge 1 && $# -le 2 ]] || usage

NEW_NAME="$1"
if [[ ! "$NEW_NAME" =~ ^[a-z][a-z0-9-]*[a-z0-9]$ ]]; then
    echo "Invalid project name: '$NEW_NAME'" >&2
    echo "Must be lowercase kebab-case (letters, digits, dashes), 2+ chars, no leading/trailing dash." >&2
    exit 1
fi

# Case conversion via awk. `sed -E 's/(^|-)([a-z])/\U\2/g'` would be shorter but
# `\U` is a GNU extension: BSD sed emits a literal "U" instead of upper-casing,
# silently producing a stack name like "UmyUcoolUapp".
capitalize() {
    printf '%s' "$1" | awk -F'-' -v sep="$2" \
        '{for (i = 1; i <= NF; i++) printf "%s%s%s", (i > 1 ? sep : ""), toupper(substr($i, 1, 1)), substr($i, 2)}'
}

NEW_PASCAL="$(capitalize "$NEW_NAME" '')"
NEW_DISPLAY="${2:-$(capitalize "$NEW_NAME" ' ')}"

# Resolved before the `cd` below so the self-delete works regardless of the
# directory the script was invoked from. `realpath` is avoided: older macOS
# does not ship it.
#
# Both paths are resolved with `pwd -P` so the prefix-strip that derives
# SCRIPT_REL below cannot be defeated by a symlink appearing in one and not the
# other -- on macOS /tmp is a symlink to /private/tmp, which is exactly the case
# where git and the shell disagree about how to spell the same directory.
SCRIPT_PATH="$(cd "$(dirname "$0")" && pwd -P)/$(basename "$0")"

REPO_ROOT="$(cd "$(git rev-parse --show-toplevel)" && pwd -P)"
cd "$REPO_ROOT"

if [[ -n "$(git status --porcelain)" ]]; then
    echo "Working tree is dirty. Commit or stash your changes first so the rename is reviewable as a single diff." >&2
    exit 1
fi

# This script matches all three tokens itself, and is excluded: it gets deleted
# at the end, so rewriting it is pointless -- and harmful, because bash reads a
# script lazily as it executes and the rewrite below edits files in place.
SCRIPT_REL="${SCRIPT_PATH#"$REPO_ROOT"/}"
FILES="$(git grep -lF -e 'react-template' -e 'React Template' -e 'ReactTemplate' \
    | grep -vxF "$SCRIPT_REL" || true)"

if [[ -z "$FILES" ]]; then
    echo "No occurrences of 'react-template', 'React Template', or 'ReactTemplate' found. Nothing to do." >&2
    exit 0
fi

# On the right-hand side of a sed `s///`, `&` expands to the whole match and
# `\` escapes; the `/` delimiter has to be escaped too. Without this a display
# name like "Foo & Bar/Baz" would be corrupted or abort the script.
escape() {
    printf '%s' "$1" | sed 's|[\\/&]|\\&|g'
}

# `sed -i` is not portable -- BSD requires a backup-suffix argument that GNU
# rejects -- so output goes through a temp file. It is copied back with `cat`
# rather than moved so the original file keeps its permissions.
#
# Pascal is substituted first so a name like "react-templatey" cannot drift
# "ReactTemplate" through an intermediate state; sed applies `-e` in order.
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

COUNT=0
while IFS= read -r file; do
    sed -e "s/ReactTemplate/$(escape "$NEW_PASCAL")/g" \
        -e "s/React Template/$(escape "$NEW_DISPLAY")/g" \
        -e "s/react-template/$(escape "$NEW_NAME")/g" \
        "$file" > "$TMP"
    cat "$TMP" > "$file"
    COUNT=$((COUNT + 1))
done <<< "$FILES"

rm -- "$SCRIPT_PATH"

echo "Renamed to '${NEW_NAME}' (display: '${NEW_DISPLAY}', Pascal: '${NEW_PASCAL}')."
echo "Updated ${COUNT} files."
echo
echo "Next steps:"
echo "  npm install"
echo "  git add -A && git commit -m 'Initialize from react-template'"
