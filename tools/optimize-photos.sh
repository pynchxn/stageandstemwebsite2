#!/bin/sh
#
# optimize-photos.sh — regenerate Photos/web + Photos/thumb from the camera
# originals in Photos/. macOS only (uses `sips`, which ships with the OS).
#
# This is a DEV tool. Like test/, it is NOT uploaded to Fasthosts — only the
# generated Photos/web/ and Photos/thumb/ folders are.
#
#   Photos/<name>.(jpg|jpeg|png)   camera originals — you drop these in
#     -> Photos/web/<name>.jpg     <= 1600px long edge, q78  (lightbox / large view)
#     -> Photos/thumb/<name>.jpg   <=  800px long edge, q60  (the 3-across grid)
#
# All output is .jpg regardless of the source extension.
#
# To add a photo to the site:
#   1. drop the original into Photos/
#   2. run this script
#   3. add one <figure> line to the gallery in about.html
#      (and, for a one-off placement, point that page's <img src> at
#       Photos/web/<name>.jpg)
#
set -e

cd "$(dirname "$0")/../Photos"
mkdir -p web thumb

made=0
for f in *.jpg *.jpeg *.JPG *.JPEG *.png *.PNG; do
  [ -e "$f" ] || continue
  n="${f%.*}"
  sips -s format jpeg -s formatOptions 78 -Z 1600 "$f" --out "web/$n.jpg"   >/dev/null
  sips -s format jpeg -s formatOptions 60 -Z 800  "$f" --out "thumb/$n.jpg" >/dev/null
  echo "  $f  ->  web/$n.jpg + thumb/$n.jpg"
  made=$((made + 1))
done

echo ""
echo "Done — $made image(s). Commit Photos/web/ and Photos/thumb/ (not the originals)."
