from __future__ import annotations

import argparse
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import gdown
import requests


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Resume original image downloads from a public Google Drive folder."
    )
    parser.add_argument("folder_id")
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("--workers", type=int, default=3)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    files = gdown.download_folder(
        id=args.folder_id,
        skip_download=True,
        quiet=True,
    )
    images = [item for item in files if Path(item.path).suffix.lower() in IMAGE_EXTENSIONS]
    print(f"Found {len(images)} images in Drive folder {args.folder_id}.", flush=True)

    lock = threading.Lock()
    completed = 0

    def process(item: gdown.download.GoogleDriveFileToDownload) -> tuple[str, bool]:
        nonlocal completed

        output = args.output_dir / Path(item.path)
        downloaded = True
        if not output.exists() or output.stat().st_size == 0:
            output.parent.mkdir(parents=True, exist_ok=True)
            temporary_output = output.with_name(f"{output.name}.part")
            response = requests.get(
                f"https://drive.usercontent.google.com/download?id={item.id}&export=download&confirm=t",
                stream=True,
                timeout=(15, 180),
            )
            response.raise_for_status()
            if "text/html" in response.headers.get("content-type", ""):
                return item.path, False
            with temporary_output.open("wb") as destination:
                for chunk in response.iter_content(chunk_size=1024 * 1024):
                    if chunk:
                        destination.write(chunk)
            downloaded = temporary_output.stat().st_size > 0
            if downloaded:
                temporary_output.replace(output)
            else:
                temporary_output.unlink(missing_ok=True)

        with lock:
            completed += 1
            if completed % 25 == 0 or completed == len(images):
                print(f"Processed {completed}/{len(images)} images.", flush=True)
        return item.path, downloaded

    failures: list[str] = []
    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
        futures = {executor.submit(process, item): item.path for item in images}
        for future in as_completed(futures):
            try:
                path, downloaded = future.result()
                if not downloaded:
                    failures.append(path)
            except Exception as error:
                failures.append(f"{futures[future]}: {error}")

    failure_log = args.output_dir / "failed-downloads.txt"
    if failures:
        failure_log.write_text("\n".join(sorted(failures)) + "\n", encoding="utf-8")
        print(f"Finished with {len(failures)} failures; see {failure_log}.", flush=True)
    else:
        failure_log.unlink(missing_ok=True)
        print(f"Finished all {len(images)} images without failures.", flush=True)


if __name__ == "__main__":
    main()
