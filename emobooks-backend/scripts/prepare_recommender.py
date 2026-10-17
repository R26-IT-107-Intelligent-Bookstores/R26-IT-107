"""Extract the supplied Goodreads V2 artifacts without executing archive code."""
import argparse
import hashlib
import json
import shutil
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from emobooks.settings import Settings

ALLOWED = {"model_best.pt", "training_config.json", "results.json", "README.txt",
           "book_ids.json", "user_ids.json", "books_metadata.csv", "book_text_embeddings.npy",
           "user_train_text_profiles.npy", "training_history.csv", "ranking_history.png"}


def prepare(archive, destination):
    destination = destination.resolve()
    destination.mkdir(parents=True, exist_ok=True)
    manifest = {}
    with zipfile.ZipFile(archive) as source:
        for info in source.infolist():
            name = info.filename.removeprefix("goodreads_hybrid_recommender_v2/")
            if name not in ALLOWED:
                continue
            if info.file_size > 1024 ** 3:
                raise ValueError("Unexpectedly large recommender artifact.")
            target = (destination / name).resolve()
            if not target.is_relative_to(destination):
                raise ValueError("Invalid archive path.")
            temporary = target.with_suffix(target.suffix + ".part")
            with source.open(info) as reader, temporary.open("wb") as writer:
                shutil.copyfileobj(reader, writer, length=1024 * 1024)
            temporary.replace(target)
            checksum = hashlib.sha256()
            with target.open("rb") as prepared:
                while chunk := prepared.read(1024 * 1024):
                    checksum.update(chunk)
            manifest[name] = checksum.hexdigest()
            print(f"Prepared {name}")
    if "model_best.pt" not in manifest:
        raise ValueError("The archive is missing model_best.pt.")
    (destination / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print("Prepared. Download the Sentence-BERT encoder using the hf command in README.md.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("archive", type=Path)
    parser.add_argument("--destination", type=Path, default=Settings.from_env().recommender_dir)
    args = parser.parse_args()
    prepare(args.archive, args.destination)
