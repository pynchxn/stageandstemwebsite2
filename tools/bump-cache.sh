#!/bin/sh
#
# bump-cache.sh — re-stamp the ?v= cache-busting token on every local CSS/JS
# link across the site's HTML pages, so returning visitors' browsers refetch
# the files instead of using a stale cached copy.
#
# This is a DEV tool. Like test/, it is NOT uploaded to Fasthosts.
#
# You normally DON'T need this: .htaccess sets HTML/CSS/JS to revalidate on
# every load, so a plain re-upload is already picked up on the next page view.
# Run it only to force EVERY visitor (including ones with an old copy cached
# from before .htaccess) to refetch immediately — e.g. after a big redesign.
#
#   sh tools/bump-cache.sh              # token = today's date, e.g. 20260909
#   sh tools/bump-cache.sh 20260910     # or pass an explicit YYYYMMDD
#
# Then re-upload ALL the .html files (and .htaccess, the first time).
#
set -e

cd "$(dirname "$0")/.."

V="${1:-$(date +%Y%m%d)}"

# Assets to stamp — local stylesheets and scripts only. External refs
# (Google Fonts, DesignMyNight, Eventbrite) are left untouched.
assets='style-stage\.css|style-bistro\.css|newsletter\.js|gallery\.js|events\.js'

changed=0
for f in *.html; do
  [ -e "$f" ] || continue
  before=$(cat "$f")
  # href="asset"  or  href="asset?v=NNN"   ->   href="asset?v=$V"   (idempotent).
  # Anchored on the href="/src=" quote so prose mentions in comments are left alone.
  sed -i '' -E "s/((href|src)=\"($assets))(\?v=[0-9]+)?\"/\1?v=$V\"/g" "$f"
  if [ "$before" != "$(cat "$f")" ]; then
    echo "  stamped  $f  ->  ?v=$V"
    changed=$((changed + 1))
  fi
done

echo ""
echo "Done — $changed file(s) stamped with ?v=$V."
echo "Re-upload the changed .html files to public_html (and .htaccess the first time)."
