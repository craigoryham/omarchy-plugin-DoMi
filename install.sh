#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_SRC="$REPO_DIR/plugin/user.domi-clock"
PLUGIN_DST="$HOME/.config/omarchy/plugins/user.domi-clock"
LAUNCHER_SRC="$REPO_DIR/bin/domi-launch"
LAUNCHER_DST="$HOME/.local/bin/domi-launch"

mkdir -p "$HOME/.config/omarchy/plugins" "$HOME/.local/bin"

# Plugin: swap to symlink (back up originals)
if [ -d "$PLUGIN_DST" ] && [ ! -L "$PLUGIN_DST" ]; then
  echo "Backing up existing plugin to ${PLUGIN_DST}.bak"
  rm -rf "${PLUGIN_DST}.bak"
  mv "$PLUGIN_DST" "${PLUGIN_DST}.bak"
fi
ln -sfn "$PLUGIN_SRC" "$PLUGIN_DST"
echo "Plugin symlinked: $PLUGIN_DST -> $PLUGIN_SRC"

# Launcher: swap to symlink (back up originals)
if [ -f "$LAUNCHER_DST" ] && [ ! -L "$LAUNCHER_DST" ]; then
  echo "Backing up existing launcher to ${LAUNCHER_DST}.bak"
  mv "$LAUNCHER_DST" "${LAUNCHER_DST}.bak"
fi
ln -sfn "$LAUNCHER_SRC" "$LAUNCHER_DST"
echo "Launcher symlinked: $LAUNCHER_DST -> $LAUNCHER_SRC"

# Dev server
echo ""
echo "Install complete. After adding the widget to your shell.json,"
echo "run 'omarchy restart shell' to load it."
echo ""
echo "shell.json entry — add to bar.layout.center and set bar.centerAnchor:"
cat <<'EOF'
{
  "bar": {
    "centerAnchor": "user.domi-clock",
    "layout": {
      "center": [
        ...,
        { "id": "user.domi-clock" }
      ]
    }
  }
}
EOF
