"""Build a small static playtest release; never silently accept unreviewed art."""
from pathlib import Path
from PIL import Image, ImageOps
import hashlib
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dist"
if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir()
shutil.copy2(ROOT / "index.html", OUT / "index.html")
shutil.copytree(ROOT / "src", OUT / "src")
manifest = json.loads((ROOT / "art" / "batch01-manifest.json").read_text())
card_art, provisional, missing, verified, report = {}, [], [], [], {}
battlefield = None
for ident, (kind, accepted, fallback) in manifest.items():
    path = ROOT / "art" / "source" / kind / (ident + ".png")
    if not path.is_file():
        missing.append(ident)
        report[ident] = {"status":"missing"}
        continue
    data = path.read_bytes()
    digest = hashlib.sha1(f"blob {len(data)}".encode() + bytes([0]) + data).hexdigest()
    if digest == accepted:
        verified.append(ident)
        status = "verified"
    elif fallback and digest == fallback:
        provisional.append(ident)
        status = "provisional"
    else:
        missing.append(ident)
        report[ident] = {"status":"unapproved", "git_blob":digest}
        continue
    with Image.open(path) as source:
        image = ImageOps.exif_transpose(source).convert("RGB")
        image.thumbnail((1440, 810) if kind == "battlefield" else (360, 504), Image.Resampling.LANCZOS)
        relative = Path("assets") / ("battlefields" if kind == "battlefield" else "cards") / (ident + ".webp")
        target = OUT / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        image.save(target, "WEBP", quality=83, method=6)
    url = "./" + relative.as_posix()
    if kind == "battlefield":
        battlefield = url
    else:
        card_art[ident] = url
    report[ident] = {"status":status,"git_blob":digest,"webp_bytes":target.stat().st_size}
exports = {"cardArt":card_art,"battlefieldArt":battlefield,"provisional":provisional,"missingArt":missing}
(OUT / "src" / "art-status.mjs").write_text("\n".join("export const "+k+" = "+json.dumps(v)+";" for k,v in exports.items())+"\n")
(OUT / "art-status.json").write_text(json.dumps(report,indent=2)+"\n")
(OUT / ".nojekyll").touch()
(OUT / "PLAY.txt").write_text("Battle Master: First Ford playable preview.\nServe this folder over HTTP (python -m http.server 8080), then open http://localhost:8080 in a browser.\nLandscape recommended. This is not the full campaign. See art-status.json for asset status.\n")
print("Verified:",verified,"Provisional:",provisional,"Missing:",missing)
