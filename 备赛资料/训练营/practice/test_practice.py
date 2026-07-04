"""
单元测试 —— 验证协议、标定、分拣逻辑正确。
运行: python -m pytest test_practice.py -v   或   python test_practice.py
"""
from __future__ import annotations

from protocol import Detection, parse_line, split_stream
from calibration import HandEye
import mock_dobot as dType
from sorter import Sorter


# ---------- protocol ----------
def test_encode_decode_roundtrip():
    d = Detection("circle", 210.5, -30.2, 15.0)
    line = d.to_line().strip()
    back = parse_line(line)
    assert isinstance(back, Detection)
    assert back.label == "circle"
    assert abs(back.x - 210.5) < 1e-6
    assert abs(back.y + 30.2) < 1e-6


def test_control_words():
    assert parse_line("END") == "END"
    assert parse_line("OK") == "OK"


def test_parse_bad():
    for bad in ["", "a,b", "circle,1,2", "circle,x,2,3"]:
        try:
            parse_line(bad)
            assert False, f"应抛错: {bad!r}"
        except ValueError:
            pass


def test_split_stream_handles_partial():
    lines, rest = split_stream("circle,1,2,3\nsquare,4,5,6\ntria")
    assert lines == ["circle,1,2,3", "square,4,5,6"]
    assert rest == "tria"


# ---------- calibration ----------
def test_calibration_exact():
    pix = [(0, 0), (640, 0), (0, 480), (640, 480)]
    rob = [(300, 100), (300, -100), (150, 100), (150, -100)]
    he = HandEye.calibrate(pix, rob)
    assert he.max_error(pix, rob) < 1e-6
    # 中心像素应映射到工作区中心附近
    X, Y = he.pixel_to_robot(320, 240)
    assert abs(X - 225) < 1.0 and abs(Y - 0) < 1.0


def test_calibration_needs_3_points():
    try:
        HandEye.calibrate([(0, 0), (1, 1)], [(0, 0), (1, 1)])
        assert False
    except ValueError:
        pass


# ---------- sorter ----------
def test_sorter_pick_sequence():
    api = dType.load()
    dType.ConnectDobot(api)
    s = Sorter(dType, api)
    s.setup()
    ok = s.pick_and_place(Detection("circle", 200, 50, 0))
    assert ok
    # 必须出现：吸盘开 -> ... -> 吸盘关
    on = [i for i, h in enumerate(api.history) if h == "Suction ON"]
    off = [i for i, h in enumerate(api.history) if h == "Suction OFF"]
    assert on and off and on[0] < off[0]


def test_sorter_unknown_label_skipped():
    api = dType.load()
    dType.ConnectDobot(api)
    s = Sorter(dType, api)
    s.setup()
    assert s.pick_and_place(Detection("hexagon", 200, 50, 0)) is False


def test_run_batch_counts():
    api = dType.load()
    dType.ConnectDobot(api)
    s = Sorter(dType, api)
    dets = [Detection("circle", 200, 50, 0),
            Detection("square", 220, 0, 0),
            Detection("triangle", 240, -50, 0),
            Detection("unknown", 100, 0, 0)]
    n = s.run_batch(dets)
    assert n == 3   # unknown 被跳过


def _run_all():
    import traceback
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    passed = 0
    for fn in fns:
        try:
            fn()
            print(f"PASS {fn.__name__}")
            passed += 1
        except Exception:
            print(f"FAIL {fn.__name__}")
            traceback.print_exc()
    print(f"\n{passed}/{len(fns)} 通过")
    return passed == len(fns)


if __name__ == "__main__":
    import sys
    sys.exit(0 if _run_all() else 1)
