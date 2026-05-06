import re
import shutil
import tempfile
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
DOCX = ROOT / "docs" / "无人移动点餐系统总体设计方案_严格套模板版.docx"
OUT = ROOT / "docs" / "无人移动点餐系统总体设计方案_严格套模板版_图文匹配.docx"
IMG_DIR = ROOT / "docs" / "generated-design-images"

NS_REL = "http://schemas.openxmlformats.org/package/2006/relationships"


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


def text_size(draw, text, fnt):
    box = draw.textbbox((0, 0), text, font=fnt)
    return box[2] - box[0], box[3] - box[1]


def wrap_text(draw, text, fnt, max_width):
    lines = []
    for part in str(text).split("\n"):
        line = ""
        for ch in part:
            test = line + ch
            if text_size(draw, test, fnt)[0] <= max_width:
                line = test
            else:
                if line:
                    lines.append(line)
                line = ch
        if line:
            lines.append(line)
    return lines or [""]


def draw_center_text(draw, box, text, fnt, fill="#1f2937", line_gap=6):
    x1, y1, x2, y2 = box
    lines = wrap_text(draw, text, fnt, x2 - x1 - 20)
    heights = [text_size(draw, line, fnt)[1] for line in lines]
    total = sum(heights) + line_gap * (len(lines) - 1)
    y = y1 + (y2 - y1 - total) / 2
    for line, h in zip(lines, heights):
        w = text_size(draw, line, fnt)[0]
        draw.text((x1 + (x2 - x1 - w) / 2, y), line, font=fnt, fill=fill)
        y += h + line_gap


def rect(draw, box, text, fill="#ffffff", outline="#2563eb", width=2, radius=18, size=24, bold=False):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)
    draw_center_text(draw, box, text, font(size, bold), fill="#111827")


def arrow(draw, start, end, fill="#334155", width=3):
    draw.line([start, end], fill=fill, width=width)
    x1, y1 = start
    x2, y2 = end
    dx, dy = x2 - x1, y2 - y1
    if abs(dx) + abs(dy) == 0:
        return
    import math
    ang = math.atan2(dy, dx)
    size = 12
    pts = [
        (x2, y2),
        (x2 - size * math.cos(ang - 0.45), y2 - size * math.sin(ang - 0.45)),
        (x2 - size * math.cos(ang + 0.45), y2 - size * math.sin(ang + 0.45)),
    ]
    draw.polygon(pts, fill=fill)


def canvas(w, h, title=None):
    img = Image.new("RGB", (w, h), "white")
    draw = ImageDraw.Draw(img)
    if title:
        draw.text((28, 20), title, font=font(30, True), fill="#0f172a")
        draw.line((28, 62, w - 28, 62), fill="#dbeafe", width=3)
    return img, draw


def save(img, name):
    IMG_DIR.mkdir(exist_ok=True)
    path = IMG_DIR / name
    img.save(path, "PNG")
    return path


def build_system_engineering():
    img, d = canvas(874, 625, "无人移动点餐系统工程结构")
    rect(d, (330, 250, 545, 375), "Spring Boot\n后端服务", "#dbeafe", "#1d4ed8", 3, 28, 26, True)
    nodes = [
        ((40, 80, 250, 155), "H5 前台用户端"),
        ((325, 80, 555, 155), "微信小程序端"),
        ((620, 80, 835, 155), "后台管理端"),
        ((45, 455, 255, 535), "图片资源\nimages/uploads"),
        ((335, 455, 545, 535), "MySQL 数据库\nunmanned_ordering"),
        ((625, 455, 835, 535), "DataGrip / IDEA\n开发运维"),
    ]
    for box, text in nodes:
        rect(d, box, text, "#f8fafc", "#2563eb", 2, 22, 22, True)
    centers = [(145, 155), (440, 155), (728, 155), (150, 455), (440, 455), (730, 455)]
    targets = [(438, 250), (438, 250), (438, 250), (360, 350), (440, 375), (525, 355)]
    for s, e in zip(centers, targets):
        arrow(d, s, e, "#64748b", 3)
    save(img, "image2.png")


def build_logic_structure():
    img, d = canvas(920, 1250, "系统逻辑结构")
    layers = [
        ("表现层", ["H5首页/点餐/购物车/订单/我的", "微信小程序页面", "后台管理页面"]),
        ("接口层", ["AuthController", "ProductController", "CartController", "OrderController", "AdminController"]),
        ("业务层", ["UserAuthService", "OrderingService", "AdminAuthService"]),
        ("持久层", ["ProductMapper", "CartMapper", "OrderMapper", "StoreMapper", "UserMapper"]),
        ("数据层", ["MySQL业务表", "images/uploads图片资源"]),
    ]
    y = 95
    last_center = None
    for title, items in layers:
        rect(d, (60, y, 185, y + 130), title, "#eff6ff", "#1d4ed8", 3, 18, 25, True)
        x = 220
        item_w = 195 if len(items) <= 3 else 130
        gap = 18
        for item in items:
            rect(d, (x, y + 22, x + item_w, y + 108), item, "#ffffff", "#94a3b8", 2, 14, 18)
            x += item_w + gap
        center = (460, y + 130)
        if last_center:
            arrow(d, last_center, (460, y), "#475569", 4)
        last_center = center
        y += 210
    save(img, "image3.png")


def build_architecture_wide():
    img, d = canvas(1269, 492, "前台、小程序、后台与后端联调架构")
    rect(d, (45, 95, 320, 180), "H5 前台\n移动端页面", "#f8fafc", "#2563eb", 2, 18, 25, True)
    rect(d, (45, 270, 320, 355), "微信小程序\n后续上线入口", "#f8fafc", "#2563eb", 2, 18, 25, True)
    rect(d, (470, 95, 790, 180), "REST API\n/api/**", "#dbeafe", "#1d4ed8", 3, 18, 27, True)
    rect(d, (470, 270, 790, 355), "后台管理\n/admin/**", "#f8fafc", "#2563eb", 2, 18, 25, True)
    rect(d, (930, 95, 1200, 180), "Spring Boot\nController / Service", "#dbeafe", "#1d4ed8", 3, 18, 24, True)
    rect(d, (930, 270, 1200, 355), "MyBatis + MySQL\n正式数据持久化", "#ecfeff", "#0891b2", 2, 18, 24, True)
    for s, e in [((320, 137), (470, 137)), ((320, 312), (470, 312)), ((790, 137), (930, 137)), ((1065, 180), (1065, 270)), ((790, 312), (930, 312))]:
        arrow(d, s, e, "#475569", 4)
    save(img, "image4.png")


def build_project_structure():
    img, d = canvas(900, 580, "整体项目结构")
    rect(d, (45, 90, 855, 150), "unmanned-mobile-ordering-system", "#e0f2fe", "#0284c7", 3, 18, 25, True)
    items = [
        ("frontend H5", "index/menu/detail/cart/order/mine"),
        ("admin", "dashboard/products/categories/coupons/orders/users"),
        ("miniprogram", "home/menu/detail/cart/order/mine"),
        ("backend", "controller/service/mapper/model/request"),
        ("database", "schema-mysql.sql / data-mysql.sql"),
        ("images", "商品图、Banner图、云豹小点Logo"),
    ]
    coords = [(70, 225), (335, 225), (600, 225), (70, 390), (335, 390), (600, 390)]
    for (title, detail), (x, y) in zip(items, coords):
        rect(d, (x, y, x + 225, y + 95), f"{title}\n{detail}", "#ffffff", "#64748b", 2, 14, 18, True)
        arrow(d, (450, 150), (x + 112, y), "#94a3b8", 2)
    save(img, "image5.png")


def build_layer_flow():
    img, d = canvas(920, 610, "系统请求处理分层")
    boxes = [
        ("视图层\nH5/小程序/后台", 60),
        ("接口层\nController", 235),
        ("业务层\nService", 410),
        ("持久层\nMapper", 585),
        ("数据层\nMySQL", 760),
    ]
    for text, x in boxes:
        rect(d, (x, 220, x + 120, 360), text, "#ffffff", "#2563eb", 2, 18, 22, True)
    for i in range(len(boxes) - 1):
        arrow(d, (boxes[i][1] + 120, 290), (boxes[i + 1][1], 290), "#334155", 4)
    d.text((120, 105), "示例：用户点击“提交订单” -> /api/orders -> createOrder -> OrderMapper -> orders/order_items", font=font(24), fill="#0f172a")
    save(img, "image6.png")


def build_function_tree():
    img, d = canvas(833, 539, "系统功能结构")
    rect(d, (255, 35, 580, 95), "无人移动点餐系统", "#ffffff", "#1f2937", 2, 10, 24, True)
    groups = [
        ("前台用户端", ["首页", "点餐", "详情", "购物车", "订单", "我的", "省钱卡"], 35),
        ("微信小程序端", ["首页", "点餐", "购物车", "订单", "我的"], 275),
        ("后台管理端", ["登录", "看板", "商品", "分类", "Banner", "优惠券", "订单", "用户"], 515),
    ]
    for title, children, x in groups:
        arrow(d, (417, 95), (x + 115, 160), "#334155", 3)
        rect(d, (x, 160, x + 230, 215), title, "#f8fafc", "#334155", 2, 8, 20, True)
        y = 245
        for child in children:
            rect(d, (x + 35, y, x + 195, y + 35), child, "#ffffff", "#64748b", 1, 6, 18)
            y += 42
    save(img, "image7.png")


def build_usecase_overview():
    img, d = canvas(900, 420, "功能用例概览")
    rect(d, (45, 155, 165, 245), "用户", "#fff7ed", "#f97316", 2, 45, 24, True)
    rect(d, (735, 155, 855, 245), "管理员", "#eff6ff", "#2563eb", 2, 45, 24, True)
    cases = [
        ((260, 60, 430, 115), "浏览商品"),
        ((470, 60, 640, 115), "加入购物车"),
        ((260, 155, 430, 210), "提交订单"),
        ((470, 155, 640, 210), "使用优惠券"),
        ((260, 250, 430, 305), "查看订单"),
        ((470, 250, 640, 305), "维护商品/订单"),
    ]
    for box, text in cases:
        rect(d, box, text, "#ffffff", "#94a3b8", 2, 28, 20)
        arrow(d, (165, 200), (box[0], (box[1] + box[3]) // 2), "#94a3b8", 2)
    arrow(d, (735, 200), (640, 278), "#94a3b8", 2)
    save(img, "image8.png")


def build_user_usecase():
    img, d = canvas(760, 600, "用户端用例图")
    rect(d, (40, 245, 150, 335), "点餐用户", "#fff7ed", "#f97316", 2, 45, 23, True)
    cases = [
        ((270, 55, 500, 105), "登录/游客访问"),
        ((270, 130, 500, 180), "浏览首页与商品"),
        ((270, 205, 500, 255), "选择规格加入购物车"),
        ((270, 280, 500, 330), "提交订单"),
        ((270, 355, 500, 405), "查看/取消订单"),
        ((270, 430, 500, 480), "开通省钱卡/领券"),
    ]
    for box, text in cases:
        rect(d, box, text, "#ffffff", "#64748b", 2, 24, 20)
        arrow(d, (150, 290), (box[0], (box[1] + box[3]) // 2), "#94a3b8", 2)
    save(img, "image9.png")


def build_coupon_usecase():
    img, d = canvas(760, 360, "省钱卡与优惠券用例图")
    rect(d, (40, 135, 150, 225), "会员用户", "#fff7ed", "#f97316", 2, 45, 23, True)
    steps = [("开通省钱卡", 230), ("领取专属券", 390), ("满足门槛使用", 550)]
    last = (150, 180)
    for text, x in steps:
        rect(d, (x, 130, x + 130, 230), text, "#ffffff", "#2563eb", 2, 28, 20, True)
        arrow(d, last, (x, 180), "#64748b", 3)
        last = (x + 130, 180)
    d.text((245, 260), "规则：未开通省钱卡不可领取；订单金额未达标不可使用。", font=font(22), fill="#0f172a")
    save(img, "image10.png")


def build_er_global():
    img, d = canvas(1000, 866, "系统实体属性图")
    entities = [
        ("用户\nusers", (70, 125)), ("用户资料\nuser_profiles", (70, 325)), ("用户优惠券\nuser_coupons", (70, 525)),
        ("商品\nproducts", (405, 125)), ("分类\ncategories", (405, 325)), ("购物车\ncart_items", (405, 525)),
        ("订单\norders", (735, 125)), ("订单明细\norder_items", (735, 325)), ("优惠券\ncoupons", (735, 525)),
        ("门店\nstores", (245, 700)), ("Banner\nbanners", (575, 700)),
    ]
    centers = {}
    for text, (x, y) in entities:
        rect(d, (x, y, x + 185, y + 85), text, "#ffffff", "#334155", 2, 14, 21, True)
        centers[text.split("\n")[0]] = (x + 92, y + 42)
    lines = [("用户", "用户资料"), ("用户", "购物车"), ("用户", "订单"), ("用户", "用户优惠券"), ("商品", "分类"), ("购物车", "商品"), ("订单", "订单明细"), ("订单明细", "商品"), ("用户优惠券", "优惠券"), ("Banner", "门店")]
    for a, b in lines:
        arrow(d, centers[a], centers[b], "#94a3b8", 2)
    save(img, "image11.png")


def simple_er(name, boxes, filename, size=(1000, 220)):
    img, d = canvas(*size, title=name)
    gap = (size[0] - 120) // len(boxes)
    y = 100
    centers = []
    for i, text in enumerate(boxes):
        x = 60 + i * gap
        rect(d, (x, y, x + gap - 40, y + 70), text, "#ffffff", "#64748b", 2, 12, 18, True)
        centers.append((x + (gap - 40) // 2, y + 35))
    for i in range(len(centers) - 1):
        arrow(d, centers[i], centers[i + 1], "#94a3b8", 2)
    save(img, filename)


def build_db_relation():
    img, d = canvas(1218, 936, "数据库表关系图")
    tables = {
        "users": (60, 90), "user_profiles": (60, 260), "user_coupons": (60, 430),
        "coupons": (60, 610), "cart_items": (440, 90), "products": (440, 290),
        "categories": (440, 500), "orders": (820, 150), "order_items": (820, 380),
        "banners": (820, 610), "stores": (440, 700), "saving_card_plans": (60, 780),
    }
    fields = {
        "users": ["id PK", "openid", "nickname", "token"],
        "user_profiles": ["user_id PK", "member_level", "points"],
        "user_coupons": ["id PK", "user_id FK", "coupon_id FK", "status"],
        "coupons": ["id PK", "min_amount", "discount_amount"],
        "cart_items": ["id PK", "user_id FK", "product_id FK", "spec", "quantity"],
        "products": ["id PK", "category_id FK", "name", "price", "enabled"],
        "categories": ["id PK", "name", "sort_order"],
        "orders": ["id PK", "user_id FK", "order_no", "status", "payable_amount"],
        "order_items": ["id PK", "order_id FK", "product_id FK", "price", "quantity"],
        "banners": ["id PK", "title", "image", "enabled"],
        "stores": ["id PK", "name", "notice"],
        "saving_card_plans": ["id PK", "name", "price", "benefits"],
    }
    centers = {}
    for table, (x, y) in tables.items():
        h = 38 + len(fields[table]) * 24
        d.rectangle((x, y, x + 280, y + h), fill="#ffffff", outline="#111827", width=2)
        d.rectangle((x, y, x + 280, y + 34), fill="#e5e7eb", outline="#111827", width=2)
        d.text((x + 10, y + 7), table, font=font(18, True), fill="#111827")
        yy = y + 42
        for f in fields[table]:
            d.text((x + 12, yy), f, font=font(16), fill="#374151")
            yy += 24
        centers[table] = (x + 140, y + h // 2)
    for a, b in [("users", "user_profiles"), ("users", "cart_items"), ("users", "orders"), ("users", "user_coupons"), ("coupons", "user_coupons"), ("categories", "products"), ("products", "cart_items"), ("orders", "order_items"), ("products", "order_items"), ("stores", "banners")]:
        arrow(d, centers[a], centers[b], "#64748b", 2)
    save(img, "image17.png")


def build_flow(filename, title, steps, size=(700, 770)):
    img, d = canvas(*size, title=title)
    x1, x2 = 155, size[0] - 155
    y = 90
    prev = None
    for i, step in enumerate(steps, 1):
        box = (x1, y, x2, y + 62)
        rect(d, box, f"{i}. {step}", "#ffffff", "#2563eb", 2, 16, 18)
        if prev:
            arrow(d, ((x1 + x2) // 2, prev + 62), ((x1 + x2) // 2, y), "#64748b", 3)
        prev = y
        y += 98
    save(img, filename)


def build_phone_screen(filename, title, panels, size=(780, 688)):
    img, d = canvas(*size)
    d.rounded_rectangle((250, 30, 530, size[1] - 30), radius=38, fill="#f8fafc", outline="#111827", width=4)
    d.rounded_rectangle((270, 70, 510, size[1] - 85), radius=20, fill="white", outline="#e5e7eb", width=2)
    d.text((292, 92), title, font=font(24, True), fill="#0f172a")
    y = 145
    for label, color in panels:
        rect(d, (292, y, 488, y + 58), label, color, "#d1d5db", 1, 14, 17, True)
        y += 72
    rect(d, (292, size[1] - 155, 488, size[1] - 105), "底部导航", "#e0f2fe", "#0284c7", 1, 12, 16)
    save(img, filename)


def build_code(filename, title, lines, size=(974, 486)):
    img = Image.new("RGB", size, "#1f2937")
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, size[0], 46), fill="#111827")
    d.text((20, 12), title, font=font(20, True), fill="#e5e7eb")
    y = 70
    for line in lines:
        d.text((30, y), line, font=font(20), fill="#d1fae5")
        y += 34
    save(img, filename)


def build_key_pages():
    img, d = canvas(1268, 595, "关键功能页面效果")
    pages = [
        ("首页\nBanner/推荐", "#dbeafe"),
        ("点餐\n分类+商品", "#fef3c7"),
        ("购物车\n数量/合计", "#dcfce7"),
        ("提交订单\n券/实付", "#fae8ff"),
        ("后台\n商品/订单", "#e0f2fe"),
    ]
    x = 45
    for title, color in pages:
        d.rounded_rectangle((x, 95, x + 210, 520), radius=28, fill="#f8fafc", outline="#111827", width=3)
        rect(d, (x + 20, 135, x + 190, 205), title, color, "#d1d5db", 1, 16, 22, True)
        for yy in [235, 305, 375]:
            rect(d, (x + 25, yy, x + 185, yy + 45), "业务数据", "#ffffff", "#e5e7eb", 1, 10, 16)
        x += 240
    save(img, "image24.png")


def build_all_images():
    build_system_engineering()
    build_logic_structure()
    build_architecture_wide()
    build_project_structure()
    build_layer_flow()
    build_function_tree()
    build_usecase_overview()
    build_user_usecase()
    build_coupon_usecase()
    build_er_global()
    simple_er("用户登录E-R图", ["users\n用户", "user_profiles\n用户资料", "token\n登录凭证"], "image12.png", (1000, 160))
    simple_er("商品点餐E-R图", ["categories\n分类", "products\n商品", "cart_items\n购物车"], "image13.png", (900, 260))
    simple_er("订单与购物车E-R图", ["users\n用户", "cart_items\n购物车", "orders\n订单", "order_items\n明细"], "image14.png", (1000, 380))
    simple_er("省钱卡与优惠券E-R图", ["saving_card_plans\n省钱卡", "user_profiles\n会员等级", "coupons\n优惠券", "user_coupons\n用户券"], "image15.png", (900, 340))
    simple_er("全局E-R图", ["门店", "分类", "商品", "用户", "购物车", "订单", "优惠券"], "image16.png", (1100, 650))
    build_db_relation()
    build_flow("image18.png", "用户点餐流程图", ["进入首页/点餐页", "选择分类和商品", "选择规格加入购物车", "进入提交订单页", "校验优惠券与金额", "生成订单并清空购物车"], (700, 770))
    build_flow("image19.png", "后台管理流程图", ["管理员登录", "校验X-Admin-Token", "维护商品/分类", "维护Banner/优惠券", "处理订单状态", "查看用户与看板"], (360, 820))
    build_phone_screen("image20.png", "用户登录", [("游客登录", "#dbeafe"), ("微信登录预留", "#dcfce7"), ("我的资产", "#fef3c7"), ("我的订单", "#fae8ff")], (780, 688))
    build_code("image21.png", "登录接口示例", ["POST /api/auth/dev-login", "POST /api/auth/wechat-login", "Header: X-User-Token", "返回: success, code, message, data"], (974, 486))
    build_phone_screen("image22.png", "点餐/订单", [("门店信息", "#dbeafe"), ("分类 + 商品列表", "#fef3c7"), ("购物车结算栏", "#dcfce7"), ("优惠券与实付金额", "#fae8ff"), ("订单状态", "#e0f2fe")], (683, 612))
    build_code("image23.png", "核心业务请求", ["GET /api/products", "POST /api/cart/items", "POST /api/orders", "GET /api/admin/dashboard"], (564, 242))
    build_key_pages()


def patch_docx():
    build_all_images()
    if OUT.exists():
        OUT.unlink()
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        with zipfile.ZipFile(DOCX, "r") as zin:
            zin.extractall(tmp_path)

        rels_path = tmp_path / "word" / "_rels" / "document.xml.rels"
        tree = ET.parse(rels_path)
        root = tree.getroot()
        # VML EMF relationships are changed to PNG targets. DrawingML PNG targets keep their names.
        rel_updates = {
            "rId10": "media/image3.png",
            "rId13": "media/image5.png",
            "rId15": "media/image6.png",
            "rId18": "media/image8.png",
            "rId20": "media/image9.png",
            "rId22": "media/image10.png",
            "rId24": "media/image11.png",
            "rId26": "media/image12.png",
            "rId28": "media/image13.png",
            "rId30": "media/image14.png",
            "rId32": "media/image15.png",
            "rId34": "media/image16.png",
            "rId37": "media/image18.png",
            "rId39": "media/image19.png",
        }
        for rel in root:
            rid = rel.attrib.get("Id")
            if rid in rel_updates:
                rel.attrib["Target"] = rel_updates[rid]
        ET.register_namespace("", NS_REL)
        tree.write(rels_path, encoding="UTF-8", xml_declaration=True)

        media_dir = tmp_path / "word" / "media"
        for img_path in IMG_DIR.glob("image*.png"):
            shutil.copyfile(img_path, media_dir / img_path.name)

        with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as zout:
            for file in tmp_path.rglob("*"):
                if file.is_file():
                    zout.write(file, file.relative_to(tmp_path).as_posix())
    print(OUT)


if __name__ == "__main__":
    patch_docx()
