#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# install-plugin.sh — Install drawio-editor plugin to an Obsidian vault
#
# Usage:
#   ./install-plugin.sh                        Interactive (auto-detect vaults)
#   ./install-plugin.sh /path/to/vault         Install to specific vault
#   ./install-plugin.sh --list                 List detected vaults and exit
#   ./install-plugin.sh --help                 Show this help

readonly PLUGIN_ID="drawio"
readonly PLUGIN_SOURCE_FILES=(main.js manifest.json styles.css)
readonly PLUGIN_SOURCE_DIRS=(webapp)
readonly OBSIDIAN_PLUGIN_SUBDIR=".obsidian/plugins"

# ── helpers ──────────────────────────────────────────────────────────────
cecho() { printf "\033[%sm%s\033[0m\n" "$1" "$2"; }
info()  { cecho "36" "$*" >&2; }
ok()    { cecho "32" "✓ $*"; }
warn()  { cecho "33" "! $*" >&2; }
err()   { cecho "31" "✗ $*" >&2; }
die()   { err "$*"; exit 1; }

usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTION] [VAULT_PATH]

Install the drawio-editor plugin to an Obsidian vault.

Options:
  --help        Show this help and exit
  --list        List detected Obsidian vaults and exit
  --dry-run     Show what would be done without copying

Without VAULT_PATH, detects vaults interactively.
EOF
  exit 0
}

# ── source file validation ───────────────────────────────────────────────
validate_sources() {
  local script_dir="$1"
  local missing=()

  for f in "${PLUGIN_SOURCE_FILES[@]}"; do
    if [[ ! -f "$script_dir/$f" ]]; then
      missing+=("$f")
    fi
  done

  for d in "${PLUGIN_SOURCE_DIRS[@]}"; do
    if [[ ! -d "$script_dir/$d" ]]; then
      missing+=("$d/")
    fi
  done

  if [[ ${#missing[@]} -gt 0 ]]; then
    die "Missing build outputs in $(cecho "33" "$script_dir"): ${missing[*]}"
  fi

  if [[ ! -f "$script_dir/manifest.json" ]]; then
    die "manifest.json not found in $script_dir"
  fi

  ok "All source files present in $script_dir"
}

# ── vault detection ──────────────────────────────────────────────────────
detect_vaults() {
  local configs=()
  local vaults=()

  case "$(uname -s)" in
    Linux)
      [[ -f "$HOME/.config/obsidian/obsidian.json" ]] && configs+=("$HOME/.config/obsidian/obsidian.json")
      [[ -f "$HOME/.var/app/md.obsidian.Obsidian/config/obsidian/obsidian.json" ]] && configs+=("$HOME/.var/app/md.obsidian.Obsidian/config/obsidian/obsidian.json")
      ;;
    Darwin)
      [[ -f "$HOME/Library/Application Support/obsidian/obsidian.json" ]] && configs+=("$HOME/Library/Application Support/obsidian/obsidian.json")
      ;;
    CYGWIN*|MINGW*|MSYS*)
      local win_appdata="${APPDATA:-$LOCALAPPDATA}"
      [[ -n "$win_appdata" && -f "$win_appdata/obsidian/obsidian.json" ]] && configs+=("$win_appdata/obsidian/obsidian.json")
      ;;
  esac

  for cfg in "${configs[@]}"; do
    if [[ -f "$cfg" ]]; then
      while IFS= read -r line; do
        line="${line#*\"path\":}"; line="${line#[[:space:]]}"; line="${line#\"}"; line="${line%\"}"; line="${line//\\\//\/}"
        if [[ -d "$line" && -d "$line/$OBSIDIAN_PLUGIN_SUBDIR" ]]; then
          vaults+=("$line")
        fi
      done < <(grep -Po '"path":\s*"[^"]*"' "$cfg" 2>/dev/null || true)
    fi
  done

  # Deduplicate
  local unique=()
  for v in "${vaults[@]}"; do
    local seen=0
    for u in "${unique[@]}"; do [[ "$u" == "$v" ]] && { seen=1; break; } done
    [[ $seen -eq 0 ]] && unique+=("$v")
  done

  printf '%s\n' "${unique[@]}"
}

# ── installation ─────────────────────────────────────────────────────────
install_to_vault() {
  local vault_path="$1"
  local target_dir="$vault_path/$OBSIDIAN_PLUGIN_SUBDIR/$PLUGIN_ID"

  mkdir -p "$target_dir"
  ok "Target directory ready: $target_dir"

  for f in "${PLUGIN_SOURCE_FILES[@]}"; do
    cp "$SCRIPT_DIR/$f" "$target_dir/$f"
    ok "Copied $f → $target_dir/"
  done

  for d in "${PLUGIN_SOURCE_DIRS[@]}"; do
    if [[ -d "$SCRIPT_DIR/$d" ]]; then
      cp -r "${SCRIPT_DIR:?}/$d" "$target_dir/"
      ok "Copied $d/ → $target_dir/"
    fi
  done

  echo ""
  ok "Plugin installed to $target_dir"
  echo ""
  info "Plugin ID: $(grep -Po '"id":\s*"\K[^"]+' "$SCRIPT_DIR/manifest.json" 2>/dev/null || echo "$PLUGIN_ID")"
  info "Version:   $(grep -Po '"version":\s*"\K[^"]+' "$SCRIPT_DIR/manifest.json" 2>/dev/null || echo "?")"
  info "Reload Obsidian (or enable in Settings → Community plugins → Installed plugins)"
}

dry_run_to_vault() {
  local vault_path="$1"
  local target_dir="$vault_path/$OBSIDIAN_PLUGIN_SUBDIR/$PLUGIN_ID"

  echo "─── Dry run ───"
  echo "Source: $SCRIPT_DIR"
  echo "Target: $target_dir"
  echo ""
  echo "Would create: $target_dir/  (if missing)"
  for f in "${PLUGIN_SOURCE_FILES[@]}"; do
    echo "Would copy:  $f → $target_dir/$f"
  done
  for d in "${PLUGIN_SOURCE_DIRS[@]}"; do
    echo "Would copy:  $d/ → $target_dir/$d/"
  done
  echo "─── End dry run ───"
}

# ── interactive vault selection ──────────────────────────────────────────
pick_vault() {
  local detected=("$@")

  if [[ ${#detected[@]} -eq 0 ]]; then
    info "No Obsidian vaults detected automatically."
    read -rp "Enter vault path (or empty to cancel): " custom_path
    if [[ -z "$custom_path" ]]; then
      die "Cancelled."
    fi
    echo "$custom_path"
    return
  fi

  echo "" >&2
  echo "Detected Obsidian vaults:" >&2
  for i in "${!detected[@]}"; do
    echo "  $((i+1))) ${detected[$i]}" >&2
  done
  echo "  $(( ${#detected[@]} + 1 ))) Enter a different path" >&2
  echo "  $(( ${#detected[@]} + 2 ))) Cancel" >&2
  echo "" >&2
  read -rp "Select destination [1-${#detected[@]}, or c for custom]: " choice

  case "$choice" in
    c|custom|C)
      read -rp "Enter vault path: " custom
      [[ -z "$custom" ]] && die "Cancelled."
      echo "$custom"
      ;;
    q|quit|exit|cancel)
      die "Cancelled."
      ;;
    *)
      if [[ "$choice" =~ ^[0-9]+$ ]] && [[ "$choice" -ge 1 ]] && [[ "$choice" -le "${#detected[@]}" ]]; then
        echo "${detected[$((choice-1))]}"
      else
        warn "Invalid selection."
        pick_vault "${detected[@]}"
      fi
      ;;
  esac
}

# ── main ──────────────────────────────────────────────────────────────────
main() {
  local DRY_RUN=false
  local LIST_ONLY=false
  local vault_path=""

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --help) usage ;;
      --list) LIST_ONLY=true; shift ;;
      --dry-run) DRY_RUN=true; shift ;;
      -*)
        die "Unknown option: $1. Use --help for usage."
        ;;
      *)
        vault_path="$1"
        shift
        ;;
    esac
  done

  SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")/.." && pwd)"

  # --list: show vaults and exit
  if $LIST_ONLY; then
    local vaults=()
    while IFS= read -r v; do vaults+=("$v"); done < <(detect_vaults)
    if [[ ${#vaults[@]} -eq 0 ]]; then
      echo "No Obsidian vaults detected."
    else
      echo "Detected Obsidian vaults:"
      for v in "${vaults[@]}"; do
        local plugin_dir="$v/$OBSIDIAN_PLUGIN_SUBDIR/drawio"
        local status
        if [[ -d "$plugin_dir" ]]; then
          status=" (drawio plugin already installed)"
        else
          status=""
        fi
        echo "  $v$status"
      done
    fi
    exit 0
  fi

  # Validate source files
  validate_sources "$SCRIPT_DIR"

  # If no vault path given, detect and prompt
  if [[ -z "$vault_path" ]]; then
    local detected_vaults=()
    while IFS= read -r v; do detected_vaults+=("$v"); done < <(detect_vaults)
    vault_path=$(pick_vault "${detected_vaults[@]}")
  fi

  if [[ -z "$vault_path" ]]; then
    die "No vault path specified."
  fi

  # Resolve tilde if present
  vault_path="${vault_path/#\~/$HOME}"

  # Validate vault
  local plugin_dir="$vault_path/$OBSIDIAN_PLUGIN_SUBDIR"
  if [[ ! -d "$plugin_dir" ]]; then
    warn "$plugin_dir does not exist"
    read -rp "Create .obsidian/plugins/ structure? [y/N]: " confirm
    if [[ "$confirm" =~ ^[yY] ]]; then
      mkdir -p "$plugin_dir"
      ok "Created $plugin_dir"
    else
      die "Aborted."
    fi
  fi

  if $DRY_RUN; then
    dry_run_to_vault "$vault_path"
    exit 0
  fi

  install_to_vault "$vault_path"
}

main "$@"
