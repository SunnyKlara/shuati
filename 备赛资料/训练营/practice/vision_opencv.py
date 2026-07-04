"""
OpenCV 形状识别 —— 比赛 Python 模块的核心（备用/自研识别方案）。

输入一张图，输出每个工件的 (label, 像素中心u,v, 角度)。
再经 calibration.HandEye 转成机械臂坐标。

依赖 opencv-python(-headless) + numpy。
"""
from __future__ import annotations
import cv2
import numpy as np
from protocol import Detection


def classify_contour(c) -> tuple[str, float]:
    """返回 (形状标签, 旋转角度)。"""
    peri = cv2.arcLength(c, True)
    approx = cv2.approxPolyDP(c, 0.04 * peri, True)
    v = len(approx)
    # 最小外接旋转矩形，拿角度
    rect = cv2.minAreaRect(c)
    angle = rect[2]
    if v == 3:
        return "triangle", angle
    if v == 4:
        return "square", angle
    area = cv2.contourArea(c)
    circ = 4 * np.pi * area / (peri * peri + 1e-6)   # 圆度，越接近1越圆
    if circ > 0.8:
        return "circle", 0.0
    return "polygon", angle


def detect_shapes(img, min_area: float = 500.0):
    """
    img: BGR 图像(numpy)。
    返回 [Detection(label, u, v, r), ...]，坐标为像素坐标。
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    # Otsu 自适应二值化（反色：工件比背景暗时取 INV）
    _, thr = cv2.threshold(blur, 0, 255,
                           cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    cnts, _ = cv2.findContours(thr, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    results = []
    for c in cnts:
        area = cv2.contourArea(c)
        if area < min_area:
            continue
        M = cv2.moments(c)
        if M["m00"] == 0:
            continue
        cx = M["m10"] / M["m00"]
        cy = M["m01"] / M["m00"]
        label, angle = classify_contour(c)
        results.append(Detection(label, round(cx, 1), round(cy, 1), round(angle, 1)))
    return results


def make_synthetic_scene(width=640, height=480, seed=None):
    """
    生成一张合成测试图：随机摆放 圆/方/三角 工件。
    便于无相机时练习识别+分拣全流程。返回 (img, 真实标签列表)。
    """
    rng = np.random.default_rng(seed)
    img = np.full((height, width, 3), 230, np.uint8)   # 浅灰背景
    truth = []
    shapes = ["circle", "square", "triangle"]
    placed = []  # (cx,cy,radius) 防重叠

    def ok(cx, cy, r):
        for (px, py, pr) in placed:
            if (cx - px) ** 2 + (cy - py) ** 2 < (r + pr + 20) ** 2:
                return False
        return True

    n = 8
    tries = 0
    while len(truth) < n and tries < 500:
        tries += 1
        s = shapes[rng.integers(0, 3)]
        cx, cy = int(rng.integers(60, width - 60)), int(rng.integers(60, height - 60))
        size = int(rng.integers(28, 42))
        if not ok(cx, cy, size):
            continue
        color = (60, 60, 60)
        if s == "circle":
            cv2.circle(img, (cx, cy), size, color, -1)
        elif s == "square":
            cv2.rectangle(img, (cx - size, cy - size), (cx + size, cy + size), color, -1)
        else:
            pts = np.array([[cx, cy - size],
                            [cx - size, cy + size],
                            [cx + size, cy + size]], np.int32)
            cv2.fillPoly(img, [pts], color)
        placed.append((cx, cy, size))
        truth.append(s)
    return img, truth


if __name__ == "__main__":
    img, truth = make_synthetic_scene(seed=42)
    dets = detect_shapes(img)
    print("真实:", sorted(truth))
    print("识别:", sorted(d.label for d in dets))
    for d in dets:
        print(f"  {d.label:8s} @ px({d.x},{d.y}) angle={d.r}")
