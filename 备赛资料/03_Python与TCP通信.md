# 03 Python 控制机械臂 + TCP 通信（代码模板）

> 两条主线：
> 1. **Python 直接控制 Dobot Magician**（DobotDllType / DobotDllType64 SDK）。
> 2. **TCP 通信**：DobotVisionStudio（视觉端）把识别结果发给 Python（机械臂端）执行分拣。
>
> 比赛现场电脑统一提供，但**SDK 用法务必背熟**，到场能快速搭起来。

---

## 一、Dobot Magician Python SDK 基础（DobotDllType，本地名 dType）

> 来自 DobotDemoV2.0 → DobotDemoForPython。把 `DobotDllType.py` 与 dll 放同目录。

```python
import DobotDllType as dType
import time

# 连接状态码
CON_STR = {
    dType.DobotConnect.DobotConnect_NoError:  "DobotConnect_NoError",
    dType.DobotConnect.DobotConnect_NotFound: "DobotConnect_NotFound",
    dType.DobotConnect.DobotConnect_Occupied: "DobotConnect_Occupied",
}

# 1) 加载库 + 连接
api = dType.load()
state = dType.ConnectDobot(api, "", 115200)[0]   # 端口留空=自动找
print("Connect status:", CON_STR[state])

if state == dType.DobotConnect.DobotConnect_NoError:
    # 2) 清队列、设回零点、设运动参数
    dType.SetQueuedCmdClear(api)
    dType.SetHomeParams(api, 250, 0, 50, 0, isQueued=1)
    dType.SetPTPCommonParams(api, 100, 100, isQueued=1)   # 速度100% 加速100%
    dType.SetPTPCoordinateParams(api, 100, 100, 100, 100, isQueued=1)
    dType.SetHOMECmd(api, temp=0, isQueued=1)             # 回零（机械臂会自检）

    # 3) 运动到一个点（PTP 直线/门式）
    lastIndex = dType.SetPTPCmd(
        api, dType.PTPMode.PTPMOVLXYZMode, 210, -30, 0, 0, isQueued=1)[0]

    # 4) 启动队列执行并等待完成
    dType.SetQueuedCmdStartExec(api)
    while lastIndex > dType.GetQueuedCmdCurrentIndex(api)[0]:
        dType.dSleep(100)
    dType.SetQueuedCmdStopExec(api)

dType.DisconnectDobot(api)
```

### 常用指令速查

| 功能 | 函数 |
|---|---|
| 加载库 | `api = dType.load()` |
| 连接 / 断开 | `dType.ConnectDobot(api,"",115200)` / `dType.DisconnectDobot(api)` |
| 清队列 | `dType.SetQueuedCmdClear(api)` |
| 启动/停止/强停队列 | `SetQueuedCmdStartExec` / `StopExec` / `ForceStopExec` |
| 当前队列索引 | `dType.GetQueuedCmdCurrentIndex(api)[0]` |
| 设运动参数(速度/加速) | `dType.SetPTPCommonParams(api, v, a, isQueued)` |
| 设回零点 | `dType.SetHomeParams(api, x, y, z, r, isQueued)` |
| 回零 | `dType.SetHOMECmd(api, temp=0, isQueued=1)` |
| 点到点运动 | `dType.SetPTPCmd(api, mode, x, y, z, r, isQueued)` |
| **吸盘开/关** | `dType.SetEndEffectorSuctionCup(api, enableCtrl, on, isQueued)` |
| 夹爪开/关 | `dType.SetEndEffectorGripper(api, enableCtrl, grip, isQueued)` |

**PTP 运动模式**：
- `PTPMOVLXYZMode` 直线插补（走直线，分拣常用）
- `PTPMOVJXYZMode` 关节运动（更快，路径不保证直线）
- `PTPJUMPXYZMode` 门式抓取（先抬高→平移→下降，**抓放工件首选，避免碰撞**）

---

## 二、抓取-分拣 动作封装

```python
Z_SAFE   = 50      # 安全高度
Z_PICK   = -40     # 下降抓取高度（按实际工件标定）
PLACE = {          # 各类别的放置坐标（赛前/标定后填）
    "circle":   (250,  80, Z_PICK),
    "square":   (250,   0, Z_PICK),
    "triangle": (250, -80, Z_PICK),
}

def wait(api, idx):
    while idx > dType.GetQueuedCmdCurrentIndex(api)[0]:
        dType.dSleep(50)

def jump_to(api, x, y, z, r=0):
    return dType.SetPTPCmd(api, dType.PTPMode.PTPJUMPXYZMode, x, y, z, r, isQueued=1)[0]

def pick_and_place(api, x, y, label):
    # 到目标上方→下降抓→抬→到放置区→放
    jump_to(api, x, y, Z_SAFE)
    jump_to(api, x, y, Z_PICK)
    dType.SetEndEffectorSuctionCup(api, 1, 1, isQueued=1)   # 开吸盘
    px, py, pz = PLACE[label]
    jump_to(api, px, py, Z_SAFE)
    idx = jump_to(api, px, py, pz)
    dType.SetEndEffectorSuctionCup(api, 1, 0, isQueued=1)   # 关吸盘=放下
    jump_to(api, px, py, Z_SAFE)
    return idx
```

---

## 三、TCP 通信：视觉端 → 机械臂端

### 约定通信协议（双方必须一致）
```
每条消息一行，逗号分隔，\n 结束：
  label,X,Y,R
例：
  circle,210.5,-30.2,15.0
  square,180.0,40.0,0.0
  END                       # 一批结束标志
```

### 方案 A：Python 作 TCP 服务端，DobotVisionStudio 作客户端发结果
```python
import socket
import DobotDllType as dType

HOST, PORT = "0.0.0.0", 6000

def main():
    api = dType.load()
    if dType.ConnectDobot(api, "", 115200)[0] != dType.DobotConnect.DobotConnect_NoError:
        print("机械臂未连接"); return
    dType.SetQueuedCmdClear(api)
    dType.SetPTPCommonParams(api, 100, 100, isQueued=1)
    dType.SetQueuedCmdStartExec(api)

    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind((HOST, PORT)); srv.listen(1)
    print(f"等待视觉端连接 {PORT} ...")
    conn, addr = srv.accept(); print("已连接", addr)

    buf = ""
    while True:
        data = conn.recv(1024).decode("utf-8", "ignore")
        if not data: break
        buf += data
        while "\n" in buf:
            line, buf = buf.split("\n", 1)
            line = line.strip()
            if not line: continue
            if line == "END":
                print("本批分拣完成"); continue
            try:
                label, x, y, r = line.split(",")
                idx = pick_and_place(api, float(x), float(y), label)
                wait(api, idx)
                conn.sendall(b"OK\n")          # 回执，视觉端可据此发下一个
            except Exception as e:
                print("解析/执行失败:", line, e)
                conn.sendall(b"ERR\n")

    conn.close(); dType.DisconnectDobot(api)

if __name__ == "__main__":
    main()
```

### 方案 B：Python 作 TCP 客户端，去读 DobotVisionStudio（服务端）输出
```python
import socket
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.connect(("127.0.0.1", 5000))   # 视觉端口，按现场设置
buf = ""
while True:
    data = sock.recv(1024).decode("utf-8", "ignore")
    if not data: break
    buf += data
    while "\n" in buf:
        line, buf = buf.split("\n", 1)
        # 解析 line -> 调 pick_and_place(...)
        print("收到:", line.strip())
```

> **谁当服务端/客户端**取决于 DobotVisionStudio 的通信模块设置（它可配 TCP Client 或 Server）。
> 现场先确认软件那一端的角色和端口，再决定 Python 用 A 还是 B。

---

## 四、纯 OpenCV 备用方案（万一不用 DobotVisionStudio 做识别）

> 培训大纲含 "Python 模块：图像采集→二值化→模型训练→识别"。若要用 Python 自己识别形状：

```python
import cv2, numpy as np

cap = cv2.VideoCapture(0)          # 工业相机索引按现场
ok, frame = cap.read()
gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
_, thr = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
cnts, _ = cv2.findContours(thr, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

for c in cnts:
    area = cv2.contourArea(c)
    if area < 500:                 # 滤噪
        continue
    peri = cv2.arcLength(c, True)
    approx = cv2.approxPolyDP(c, 0.04 * peri, True)
    v = len(approx)
    if v == 3:   shape = "triangle"
    elif v == 4: shape = "square"
    else:
        circ = 4 * np.pi * area / (peri * peri)   # 圆度
        shape = "circle" if circ > 0.8 else "polygon"
    M = cv2.moments(c)
    cx, cy = M["m10"]/M["m00"], M["m01"]/M["m00"]   # 像素中心
    # cx,cy 经手眼标定矩阵 → 机械臂坐标
    print(shape, cx, cy)
```

像素→物理坐标（标定得到仿射矩阵 `Mwarp` 后）：
```python
import numpy as np
def pixel_to_robot(cx, cy, Mwarp):   # Mwarp 为 2x3 仿射矩阵
    p = np.array([cx, cy, 1.0])
    X = Mwarp[0] @ p
    Y = Mwarp[1] @ p
    return float(X), float(Y)
```

---

## 五、联调避坑
- **运动队列**：分拣多件时用队列顺序执行，靠 `GetQueuedCmdCurrentIndex` 等待完成，别让指令叠在一起。
- **JUMP 模式**抓放，避免平移时撞到其他工件。
- 抓取高度 `Z_PICK`、吸盘真空延时要实测调好（吸不住/放不下都丢分）。
- TCP **粘包**：一定要按 `\n` 分行解析（模板已处理 buf）。
- 坐标系方向：先用 1–2 个点验证 X/Y 正负方向再批量跑。
- 急停/异常：准备好 `SetQueuedCmdForceStopExec` + 清队列的恢复流程。
