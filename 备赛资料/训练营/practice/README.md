# 练习工程（无硬件即可跑通全流程）

这是一套**模拟比赛全链路**的可运行代码：识别 → 手眼标定 → TCP 通信 → 机械臂分拣。
即使现在手上没有 Dobot，也能在自己电脑上把代码模式和逻辑练熟。
**现场只需把 `import mock_dobot as dType` 换成 `import DobotDllType as dType`，逻辑零改动。**

## 安装
```
pip install -r requirements.txt
```
（本机已装好 numpy + opencv-python-headless）

## 模块说明
| 文件 | 作用 | 对应比赛环节 |
|---|---|---|
| `protocol.py` | 通信协议封装/解析、粘包处理 | TCP 联调 |
| `calibration.py` | 手眼标定（像素→机械臂坐标，最小二乘） | 标定 |
| `vision_opencv.py` | OpenCV 形状识别 + 合成测试场景 | Python 识别 |
| `mock_dobot.py` | 模拟 Dobot SDK（接口仿真） | 机械臂控制 |
| `sorter.py` | 抓放编排（JUMP 抓取、就近排序） | 分拣逻辑 |
| `tcp_server.py` | 机械臂端：收识别结果→分拣 | 联调 |
| `tcp_client_vision_sim.py` | 视觉端模拟器：识别→发坐标 | 联调 |
| `demo_offline.py` | 不开网络，一次跑完整流程 | 全流程热身 |
| `test_practice.py` | 单元测试 | 自检 |

## 怎么练（建议每天）
1. **热身**：`python demo_offline.py` —— 看识别正确率、标定残差、分拣顺序。
2. **联调**：两个终端，先 `python tcp_server.py`，再 `python tcp_client_vision_sim.py`。
3. **自检**：`python test_practice.py`（应 9/9 通过）。
4. **改造练习**（重要，见下）。

## 进阶练习题（动手改代码，才是真训练）
1. 在 `vision_opencv.py` 增加**颜色识别**（HSV），让 label 变成 `red_circle` 这种。
2. 给 `sorter.py` 加**异常恢复**：某件抓取失败时跳过并继续，最后报告失败件数。
3. 把通信协议改成**带序号+校验**（如 `seq,label,X,Y,R,checksum`），并在 `protocol.py` 解析。
4. 在 `calibration.py` 用 **9 点标定** + 故意加噪声，观察 `max_error` 变化，理解"为什么标定点要多、要准"。
5. 实现**分拣顺序优化**：当前是就近贪心，试试让总路程最短（小规模可暴力）。
6. 把 `mock_dobot` 换成 `AlexGustafsson/dobot-python` 的真实接口风格，提前适应现场 API 差异。

> 每道题都对应一个现场可能遇到的真实问题。改完跑 `test_practice.py` 确保没改坏。
