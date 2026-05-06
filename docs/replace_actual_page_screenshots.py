import shutil
import tempfile
import zipfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "无人移动点餐系统总体设计方案_严格套模板版_图文匹配.docx"
OUT = ROOT / "docs" / "无人移动点餐系统总体设计方案_严格套模板版_最终图文版.docx"
SHOT_DIR = ROOT / "docs" / "actual-page-screenshots"
IMG_DIR = ROOT / "docs" / "actual-doc-images"


def font(size, bold=False):
    candidates = [
        Path(r"C:\Windows\Fonts\msyhbd.ttc") if bold else Path(r"C:\Windows\Fonts\msyh.ttc"),
        Path(r"C:\Windows\Fonts\simhei.ttf"),
        Path(r"C:\Windows\Fonts\simsun.ttc"),
    ]
    for item in candidates:
        if item.exists():
            return ImageFont.truetype(str(item), size)
    return ImageFont.load_default()


def load(name):
    return Image.open(SHOT_DIR / name).convert("RGB")


def fit_center(img, size, bg="#ffffff", border=True):
    target_w, target_h = size
    canvas = Image.new("RGB", size, bg)
    scale = min(target_w / img.width, target_h / img.height)
    resized = img.resize((int(img.width * scale), int(img.height * scale)), Image.LANCZOS)
    x = (target_w - resized.width) // 2
    y = (target_h - resized.height) // 2
    canvas.paste(resized, (x, y))
    if border:
        d = ImageDraw.Draw(canvas)
        d.rounded_rectangle((x, y, x + resized.width - 1, y + resized.height - 1), radius=14, outline="#cbd5e1", width=2)
    return canvas


def cover_crop(img, size, anchor="top"):
    target_w, target_h = size
    scale = max(target_w / img.width, target_h / img.height)
    resized = img.resize((int(img.width * scale), int(img.height * scale)), Image.LANCZOS)
    x = (resized.width - target_w) // 2
    if anchor == "top":
        y = 0
    elif anchor == "bottom":
        y = resized.height - target_h
    else:
        y = (resized.height - target_h) // 2
    return resized.crop((x, y, x + target_w, y + target_h))


def label(draw, xy, text):
    draw.text(xy, text, font=font(22, True), fill="#0f172a")


def make_image20():
    # 登录/我的入口，使用项目真实 mine.html 未登录状态截图。
    img = fit_center(load("06-mine-login.png"), (780, 688), "#f8fafc")
    d = ImageDraw.Draw(img)
    label(d, (28, 24), "实际页面截图：我的页登录入口")
    return img


def make_image21():
    # 后台登录真实页面，替换模板中的代码截图。
    img = cover_crop(load("09-admin-login.png"), (974, 486), "center")
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, 974, 46), fill=(255, 255, 255))
    label(d, (24, 10), "实际页面截图：后台管理员登录")
    return img


def make_image22():
    # 点餐页真实截图，模板中该图出现两次，统一替换为核心点餐界面。
    img = cover_crop(load("02-menu.png"), (683, 612), "top")
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, 683, 38), fill=(255, 255, 255))
    label(d, (18, 6), "实际页面截图：点餐页")
    return img


def make_image23():
    # 提交订单真实截图，用于接口说明中的页面/参数位置。
    img = cover_crop(load("05-submit-order.png"), (564, 242), "top")
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, 564, 34), fill=(255, 255, 255))
    d.text((16, 6), "实际页面截图：提交订单页", font=font(18, True), fill="#0f172a")
    return img


def make_image24():
    # 关键功能页面效果：真实页面截图拼图。
    canvas = Image.new("RGB", (1268, 595), "#f1f5f9")
    d = ImageDraw.Draw(canvas)
    label(d, (28, 20), "关键功能页面实际截图")
    shots = [
        ("首页", load("01-home.png")),
        ("点餐", load("02-menu.png")),
        ("购物车", load("04-cart.png")),
        ("订单", load("12-order.png")),
    ]
    x = 28
    for title, shot in shots:
        crop = cover_crop(shot, (210, 450), "top")
        d.rounded_rectangle((x - 5, 82 - 5, x + 210 + 5, 82 + 450 + 5), radius=22, fill="#ffffff", outline="#cbd5e1", width=2)
        canvas.paste(crop, (x, 82))
        d.text((x + 70, 540), title, font=font(20, True), fill="#0f172a")
        x += 236
    admin = cover_crop(load("10-admin-dashboard.png"), (290, 220), "top")
    d.rounded_rectangle((980, 105, 1240, 485), radius=20, fill="#ffffff", outline="#cbd5e1", width=2)
    canvas.paste(admin.resize((240, 185), Image.LANCZOS), (990, 130))
    prod = cover_crop(load("11-admin-products.png"), (290, 220), "top")
    canvas.paste(prod.resize((240, 185), Image.LANCZOS), (990, 325))
    d.text((1050, 540), "后台管理", font=font(20, True), fill="#0f172a")
    return canvas


def build_images():
    IMG_DIR.mkdir(exist_ok=True)
    images = {
        "image20.png": make_image20(),
        "image21.png": make_image21(),
        "image22.png": make_image22(),
        "image23.png": make_image23(),
        "image24.png": make_image24(),
    }
    for name, image in images.items():
        image.save(IMG_DIR / name, "PNG")


def patch_docx():
    build_images()
    if OUT.exists():
        OUT.unlink()
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        with zipfile.ZipFile(SOURCE, "r") as zin:
            zin.extractall(tmp_path)
        media = tmp_path / "word" / "media"
        for name in ["image20.png", "image21.png", "image22.png", "image23.png", "image24.png"]:
            shutil.copyfile(IMG_DIR / name, media / name)
        with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as zout:
            for file in tmp_path.rglob("*"):
                if file.is_file():
                    zout.write(file, file.relative_to(tmp_path).as_posix())
    print(OUT)


if __name__ == "__main__":
    patch_docx()
