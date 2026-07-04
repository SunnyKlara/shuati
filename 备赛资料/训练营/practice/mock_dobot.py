"""
模拟 Dobot Magician —— 接口模仿真实 DobotDllType，便于无硬件练习。

真实比赛用 `import DobotDllType as dType`。这里提供同名风格的函数，
让你练习的代码结构能 1:1 迁移到现场。把 import 换成真实 SDK 即可。

会把每条动作打印出来 + 记录到 history，便于检查抓放顺序是否正确。
无第三方依赖。
"""
from __future__ import annotations
import time


class PTPMode:
    PTPMOVJXYZMode = 0   # 关节运动（快，路径不保证直线）
    PTPMOVLXYZMode = 1   # 直线插补
    PTPJUMPXYZMode = 2   # 门式抓取（抬起-平移-下降），抓放首选


class DobotConnect:
    DobotConnect_NoError = 0
    DobotConnect_NotFound = 1
    DobotConnect_Occupied = 2


class _MockApi:
    def __init__(self):
        self.x, self.y, self.z, self.r = 250.0, 0.0, 50.0, 0.0
        self.suction = False
        self.queue_index = 0
        self.history: list[str] = []
        self.connected = False

    def _log(self, msg: str):
        self.history.append(msg)
        print(f"[Dobot] {msg}")


def load() -> _MockApi:
    return _MockApi()


def ConnectDobot(api: _MockApi, port: str = "", baud: int = 115200):
    api.connected = True
    api._log(f"Connect port={port or 'auto'} baud={baud}")
    return [DobotConnect.DobotConnect_NoError]


def DisconnectDobot(api: _MockApi):
    api.connected = False
    api._log("Disconnect")


def SetQueuedCmdClear(api: _MockApi):
    api.queue_index = 0
    api._log("QueueClear")


def SetQueuedCmdStartExec(api: _MockApi):
    api._log("QueueStart")


def SetQueuedCmdStopExec(api: _MockApi):
    api._log("QueueStop")


def SetPTPCommonParams(api: _MockApi, v, a, isQueued=1):
    api._log(f"SetPTPCommonParams v={v} a={a}")
    api.queue_index += 1
    return [api.queue_index]


def SetHomeParams(api: _MockApi, x, y, z, r, isQueued=1):
    api._log(f"SetHomeParams ({x},{y},{z},{r})")
    api.queue_index += 1
    return [api.queue_index]


def SetHOMECmd(api: _MockApi, temp=0, isQueued=1):
    api.x, api.y, api.z, api.r = 250.0, 0.0, 50.0, 0.0
    api._log("Home")
    api.queue_index += 1
    return [api.queue_index]


def SetPTPCmd(api: _MockApi, mode, x, y, z, r, isQueued=1):
    name = {0: "MOVJ", 1: "MOVL", 2: "JUMP"}.get(mode, str(mode))
    api.x, api.y, api.z, api.r = x, y, z, r
    api._log(f"PTP[{name}] -> ({x:.1f},{y:.1f},{z:.1f},{r:.1f})")
    api.queue_index += 1
    return [api.queue_index]


def SetEndEffectorSuctionCup(api: _MockApi, enableCtrl, on, isQueued=1):
    api.suction = bool(on)
    api._log(f"Suction {'ON' if on else 'OFF'}")
    api.queue_index += 1
    return [api.queue_index]


def GetQueuedCmdCurrentIndex(api: _MockApi):
    # 模拟瞬间完成
    return [api.queue_index]


def dSleep(ms: int):
    time.sleep(ms / 1000.0)
