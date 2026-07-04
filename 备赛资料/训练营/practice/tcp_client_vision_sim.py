"""
视觉端模拟器 —— 模拟 DobotVisionStudio：识别工件后通过 TCP 把结果发给机械臂端。

练习时它会：
  1) 生成一张合成场景图(8个随机工件)；
  2) 用 OpenCV 识别形状 + 像素坐标；
  3) 用手眼标定矩阵把像素坐标转成机械臂坐标；
  4) 逐条发给 tcp_server，收到 OK 再发下一条，最后发 END。

运行：先启动 tcp_server.py，再运行本文件。
"""
from __future__ import annotations
import socket
import time

from calibration import HandEye
from vision_opencv import make_synthetic_scene, detect_shapes

HOST, PORT = "127.0.0.1", 6000


def build_calibration() -> HandEye:
    """
    用一组已知对应点构造手眼标定。
    现场是真机走点；这里用一个合理的像素->机械臂线性映射模拟。
    像素 (0..640, 0..480) 映射到机械臂工作区 X(150..300), Y(-100..100)。
    """
    pix = [(0, 0), (640, 0), (0, 480), (640, 480)]
    rob = [(300, 100), (300, -100), (150, 100), (150, -100)]
    return HandEye.calibrate(pix, rob)


def main():
    he = build_calibration()
    img, truth = make_synthetic_scene(seed=7)
    dets = detect_shapes(img)
    print(f"[vision] 识别到 {len(dets)} 件 (真实 {len(truth)} 件)")

    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.connect((HOST, PORT))
    print("[vision] 已连接机械臂端")

    for d in dets:
        X, Y = he.pixel_to_robot(d.x, d.y)     # 像素 -> 机械臂坐标
        d.x, d.y = round(X, 2), round(Y, 2)
        sock.sendall(d.to_bytes())
        print(f"[vision] 发送 {d.to_line().strip()}")
        ack = sock.recv(64).decode().strip()    # 等回执
        print(f"[vision] 回执 {ack}")
        time.sleep(0.05)

    sock.sendall(b"END\n")
    time.sleep(0.2)
    sock.close()
    print("[vision] 完成")


if __name__ == "__main__":
    main()
