"""Extract only the trusted model assets from the supplied ZIP, using bounded memory."""
import argparse
import hashlib
import json
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from emobooks.settings import Settings

ALLOWED = {
    "config.json", "feature_scaler.pkl", "model_a_best.pt", "model_b_best.pt",
    "per_class_results.csv", "tokenizer/added_tokens.json", "tokenizer/spm.model",
    "tokenizer/tokenizer.json", "tokenizer/tokenizer_config.json", "tokenizer/special_tokens_map.json",
}


def prepare(archive, destination):
    destination = destination.resolve()
    destination.mkdir(parents=True, exist_ok=True)
    manifest = {}
    with zipfile.ZipFile(archive) as source:
        for info in source.infolist():
            name = info.filename.removeprefix("final_hierarchical_emotion_model/")
            if name not in ALLOWED:
                continue
            target = (destination / name).resolve()
            if not target.is_relative_to(destination):
                raise ValueError("Invalid archive path.")
            target.parent.mkdir(parents=True, exist_ok=True)
            checksum = hashlib.sha256()
            with source.open(info) as reader, target.with_suffix(target.suffix + ".part").open("wb") as writer:
                while chunk := reader.read(1024 * 1024):
                    writer.write(chunk)
                    checksum.update(chunk)
            target.with_suffix(target.suffix + ".part").replace(target)
            manifest[name] = checksum.hexdigest()
            print(f"Prepared {name}", flush=True)
    missing = {"config.json", "feature_scaler.pkl", "model_a_best.pt", "model_b_best.pt", "tokenizer/spm.model"} - manifest.keys()
    if missing:
        raise ValueError(f"Incomplete model archive: {', '.join(sorted(missing))}")
    (destination / "manifest.json").write_text(json.dumps(manifest, sort_keys=True, indent=2), encoding="utf-8")
    print("Model prepared. Install the encoder config using the hf command in README.md.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument("--destination", type=Path, default=Settings.from_env().model_dir)
    args = parser.parse_args()
    prepare(args.archive, args.destination)
