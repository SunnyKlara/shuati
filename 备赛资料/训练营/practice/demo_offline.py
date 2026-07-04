"""
离线全流程演示（不开网络）—— 一次跑完：识别 -> 标定转换 -> 分拣。
适合最快验证整套逻辑是否正确，也是每天热身用。

运行：python demo_offline.py
"""
from __future__ import annotations
from collections import Counter

import mock_dobot as dType
from sorter import Sorter
from calibration import HandEye
from vision_opencv import make_synthetic_scene, detect_shapes


def main(seed=7):
    # 1) 标定
    pix = [(0, 0), (640, 0), (0, 480), (640, 480)]
    rob = [(300, 100), (300, -100), (150, 100), (150, -100)]
    he = HandEye.calibrate(pix, rob)
    print(f"标定最大残差: {he.max_error(pix, rob):.3f} mm")

    # 2) 取图 + 识别
    img, truth = make_synthetic_scene(seed=seed)
    dets = detect_shapes(img)
    print(f"\n真实工件: {dict(Counter(truth))}")
    print(f"识别工件: {dict(Counter(d.label for d in dets))}")

    # 3) 像素 -> 机械臂坐标
    for d in dets:
        d.x, d.y = he.pixel_to_robot(d.x, d.y)

    # 4) 分拣
    print("\n开始分拣 ...")
    api = dType.load()
    dType.ConnectDobot(api, "", 115200)
    sorter = Sorter(dType, api)
    n = sorter.run_batch(dets)
    dType.DisconnectDobot(api)
    print(f"\n成功分拣 {n} 件 / 共识别 {len(dets)} 件")


if __name__ == "__main__":
    main()
