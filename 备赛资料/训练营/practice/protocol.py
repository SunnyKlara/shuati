"""
通信协议解析/封装 —— 视觉端与机械臂端约定的消息格式。

约定（与 03_Python与TCP通信.md 一致）：
    每条消息一行，逗号分隔，\\n 结束：
        label,X,Y,R
    例：
        circle,210.5,-30.2,15.0
    特殊消息：
        END     一批分拣结束
        OK      机械臂执行成功回执
        ERR     机械臂执行失败回执

无第三方依赖，方便单元测试。
"""
from __future__ import annotations
from dataclasses import dataclass


@dataclass
class Detection:
    """一次识别结果：类别 + 机械臂坐标(或像素坐标) + 旋转角。"""
    label: str
    x: float
    y: float
    r: float = 0.0

    def to_line(self) -> str:
        """打包成一行待发送的字符串（含换行）。"""
        return f"{self.label},{self.x:.2f},{self.y:.2f},{self.r:.2f}\n"

    def to_bytes(self) -> bytes:
        """打包成可直接 socket.sendall 的字节。"""
        return self.to_line().encode("utf-8")


def parse_line(line: str) -> Detection | str:
    """
    解析一行消息。
    返回 Detection，或控制字 "END"/"OK"/"ERR"。
    解析失败抛 ValueError。
    """
    line = line.strip()
    if not line:
        raise ValueError("empty line")
    if line in ("END", "OK", "ERR"):
        return line
    parts = line.split(",")
    if len(parts) != 4:
        raise ValueError(f"字段数应为4，实际{len(parts)}: {line!r}")
    label = parts[0].strip()
    if not label:
        raise ValueError("label 为空")
    try:
        x, y, r = float(parts[1]), float(parts[2]), float(parts[3])
    except ValueError as e:
        raise ValueError(f"坐标解析失败: {line!r}") from e
    return Detection(label, x, y, r)


def split_stream(buffer: str) -> tuple[list[str], str]:
    """
    处理 TCP 粘包：把累积缓冲区按 \\n 切成若干完整行 + 剩余不完整片段。
    返回 (完整行列表, 剩余buffer)。
    """
    lines = []
    while "\n" in buffer:
        line, buffer = buffer.split("\n", 1)
        if line.strip():
            lines.append(line.strip())
    return lines, buffer
