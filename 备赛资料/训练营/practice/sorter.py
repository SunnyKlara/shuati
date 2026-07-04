"""
分拣编排逻辑 —— 把"识别结果"翻译成机械臂抓放动作。

可注入真实 SDK(DobotDllType) 或 mock_dobot，代码完全一致，
这就是现场要写的核心控制层。
"""
from __future__ import annotations
from protocol import Detection

# 各类别的放置坐标（赛前/标定后按现场填）
PLACE = {
    "circle":   (250.0,  80.0, -40.0),
    "square":   (250.0,   0.0, -40.0),
    "triangle": (250.0, -80.0, -40.0),
}
Z_SAFE = 50.0     # 安全高度
Z_PICK = -40.0    # 下降抓取高度（按工件实测）


class Sorter:
    def __init__(self, dType, api, place=None, z_safe=Z_SAFE, z_pick=Z_PICK):
        self.d = dType          # SDK 模块(真实或mock)
        self.api = api
        self.place = place or PLACE
        self.z_safe = z_safe
        self.z_pick = z_pick

    def setup(self):
        d, api = self.d, self.api
        d.SetQueuedCmdClear(api)
        d.SetPTPCommonParams(api, 100, 100, isQueued=1)
        d.SetHomeParams(api, 250, 0, 50, 0, isQueued=1)
        d.SetQueuedCmdStartExec(api)

    def _jump(self, x, y, z, r=0.0):
        return self.d.SetPTPCmd(
            self.api, self.d.PTPMode.PTPJUMPXYZMode, x, y, z, r, isQueued=1)[0]

    def _wait(self, idx):
        while idx > self.d.GetQueuedCmdCurrentIndex(self.api)[0]:
            self.d.dSleep(50)

    def pick_and_place(self, det: Detection) -> bool:
        """对一个识别结果执行抓取-放置。未知类别返回 False(跳过)。"""
        if det.label not in self.place:
            print(f"[Sorter] 未知类别 {det.label}，跳过")
            return False
        d, api = self.d, self.api
        # 1) 到工件上方 -> 下降
        self._jump(det.x, det.y, self.z_safe, det.r)
        self._jump(det.x, det.y, self.z_pick, det.r)
        # 2) 吸取
        d.SetEndEffectorSuctionCup(api, 1, 1, isQueued=1)
        # 3) 到放置区上方 -> 下降 -> 释放
        px, py, pz = self.place[det.label]
        self._jump(px, py, self.z_safe)
        idx = self._jump(px, py, pz)
        d.SetEndEffectorSuctionCup(api, 1, 0, isQueued=1)
        idx = self._jump(px, py, self.z_safe)
        self._wait(idx)
        return True

    def run_batch(self, detections) -> int:
        """
        对一批识别结果分拣。返回成功分拣件数。
        策略：按到当前点的距离就近排序，减少空跑(可按需调整)。
        """
        self.setup()
        # 就近排序：从 home(250,0) 开始
        cur = (250.0, 0.0)
        remaining = list(detections)
        ordered = []
        while remaining:
            remaining.sort(key=lambda d: (d.x - cur[0]) ** 2 + (d.y - cur[1]) ** 2)
            nxt = remaining.pop(0)
            ordered.append(nxt)
            cur = (nxt.x, nxt.y)

        count = 0
        for det in ordered:
            if self.pick_and_place(det):
                count += 1
        return count
