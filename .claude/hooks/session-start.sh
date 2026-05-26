#!/bin/bash
set -euo pipefail

# Uniquement en environnement remote Claude Code
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "⚙️  Installation du hook pre-push..."
cp "$CLAUDE_PROJECT_DIR/scripts/pre-push" "$CLAUDE_PROJECT_DIR/.git/hooks/pre-push"
chmod +x "$CLAUDE_PROJECT_DIR/.git/hooks/pre-push"
echo "✅ Hook pre-push installé"
