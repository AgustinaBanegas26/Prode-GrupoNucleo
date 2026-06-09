"""Generate Expo app icons from the existing Grupo Núcleo logo."""
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "images" / "icononucleo.png"
ASSETS = ROOT / "assets"
SIZE = 1024
BG_COLOR = (0, 0, 0, 255)


def fit_on_canvas(image: Image.Image, canvas_size: int, padding_ratio: float = 0.08) -> Image.Image:
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    max_side = int(canvas_size * (1 - padding_ratio * 2))
    fitted = ImageOps.contain(image.convert("RGBA"), (max_side, max_side), Image.Resampling.LANCZOS)
    offset = ((canvas_size - fitted.width) // 2, (canvas_size - fitted.height) // 2)
    canvas.paste(fitted, offset, fitted)
    return canvas


def to_monochrome(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    mono = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    mono_pixels = mono.load()

    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a < 16:
                continue
            luminance = int(0.299 * r + 0.587 * g + 0.114 * b)
            if luminance > 40:
                mono_pixels[x, y] = (255, 255, 255, a)

    return mono


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(f"Source logo not found: {SOURCE}")

    ASSETS.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE).convert("RGBA")

    icon_canvas = fit_on_canvas(source, SIZE, padding_ratio=0.06)
    icon_rgb = Image.new("RGB", (SIZE, SIZE), BG_COLOR[:3])
    icon_rgb.paste(icon_canvas, mask=icon_canvas.split()[3])
    icon_rgb.save(ASSETS / "icon.png", format="PNG", optimize=True)

    foreground = fit_on_canvas(source, SIZE, padding_ratio=0.18)
    foreground.save(ASSETS / "android-icon-foreground.png", format="PNG", optimize=True)

    background = Image.new("RGB", (SIZE, SIZE), BG_COLOR[:3])
    background.save(ASSETS / "android-icon-background.png", format="PNG", optimize=True)

    monochrome = to_monochrome(foreground)
    monochrome.save(ASSETS / "android-icon-monochrome.png", format="PNG", optimize=True)

    print("Generated:")
    for name in (
        "icon.png",
        "android-icon-foreground.png",
        "android-icon-background.png",
        "android-icon-monochrome.png",
    ):
        path = ASSETS / name
        print(f"  {path} ({path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
