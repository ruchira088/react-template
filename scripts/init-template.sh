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

DEFAULT_DISPLAY="$(echo "$NEW_NAME" | sed -E 's/(^|-)([a-z])/ \U\2/g; s/^ //')"
NEW_DISPLAY="${2:-$DEFAULT_DISPLAY}"

NEW_PASCAL="$(echo "$NEW_NAME" | sed -E 's/(^|-)([a-z])/\U\2/g')"

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

if [[ -n "$(git status --porcelain)" ]]; then
    echo "Working tree is dirty. Commit or stash your changes first so the rename is reviewable as a single diff." >&2
    exit 1
fi

mapfile -t KEBAB_FILES < <(git grep -lF 'react-template' || true)
mapfile -t DISPLAY_FILES < <(git grep -lF 'React Template' || true)
mapfile -t PASCAL_FILES < <(git grep -lF 'ReactTemplate' || true)

if [[ ${#KEBAB_FILES[@]} -eq 0 && ${#DISPLAY_FILES[@]} -eq 0 && ${#PASCAL_FILES[@]} -eq 0 ]]; then
    echo "No occurrences of 'react-template', 'React Template', or 'ReactTemplate' found. Nothing to do." >&2
    exit 0
fi

# Substitute Pascal first so a name like "react-template" -> "react-templatey"
# doesn't cause "ReactTemplate" to drift through an intermediate state.
for f in "${PASCAL_FILES[@]}"; do
    sed -i "s/ReactTemplate/${NEW_PASCAL}/g" "$f"
done

for f in "${DISPLAY_FILES[@]}"; do
    sed -i "s/React Template/${NEW_DISPLAY}/g" "$f"
done

for f in "${KEBAB_FILES[@]}"; do
    sed -i "s/react-template/${NEW_NAME}/g" "$f"
done

SCRIPT_PATH="$(realpath "$0")"
rm -- "$SCRIPT_PATH"

echo "Renamed to '${NEW_NAME}' (display: '${NEW_DISPLAY}', Pascal: '${NEW_PASCAL}')."
echo "Touched ${#KEBAB_FILES[@]} kebab / ${#DISPLAY_FILES[@]} display / ${#PASCAL_FILES[@]} Pascal files."
echo
echo "Next steps:"
echo "  npm install"
echo "  git add -A && git commit -m 'Initialize from react-template'"
