"""
手眼标定（眼在手外 / Eye-to-Hand）—— 求像素坐标到机械臂坐标的仿射变换。

原理：
    [X]   [a b c]   [u]
    [Y] = [d e f] * [v]
                    [1]
    给定 N(>=3) 组对应点 (u,v) <-> (X,Y)，用最小二乘解出 6 个参数。
    这就是比赛里"标定"的数学内核：在软件里点几个点记录对应关系，
    实质就是在解这个方程。理解它，标定出问题时才知道怎么救。

依赖 numpy。
"""
from __future__ import annotations
import numpy as np


class HandEye:
    def __init__(self, matrix: np.ndarray | None = None):
        # matrix 形状 (2,3)
        self.matrix = matrix

    @classmethod
    def calibrate(cls, pixel_pts, robot_pts) -> "HandEye":
        """
        pixel_pts: [(u,v), ...]   像素坐标
        robot_pts: [(X,Y), ...]   对应的机械臂坐标
        至少 3 组（建议 4~9 组，越多越稳）。
        """
        pixel_pts = np.asarray(pixel_pts, dtype=float)
        robot_pts = np.asarray(robot_pts, dtype=float)
        if len(pixel_pts) < 3:
            raise ValueError("标定至少需要 3 组对应点")
        if len(pixel_pts) != len(robot_pts):
            raise ValueError("像素点与机械臂点数量不一致")

        # 构造 A * params = b，分别对 X、Y 求解
        n = len(pixel_pts)
        A = np.hstack([pixel_pts, np.ones((n, 1))])   # (n,3): [u, v, 1]
        # 最小二乘
        coef_x, *_ = np.linalg.lstsq(A, robot_pts[:, 0], rcond=None)
        coef_y, *_ = np.linalg.lstsq(A, robot_pts[:, 1], rcond=None)
        matrix = np.vstack([coef_x, coef_y])          # (2,3)
        return cls(matrix)

    def pixel_to_robot(self, u: float, v: float) -> tuple[float, float]:
        if self.matrix is None:
            raise RuntimeError("尚未标定")
        p = np.array([u, v, 1.0])
        X = float(self.matrix[0] @ p)
        Y = float(self.matrix[1] @ p)
        return X, Y

    def residuals(self, pixel_pts, robot_pts) -> np.ndarray:
        """返回每个标定点的残差距离(mm)，用来验证标定质量。"""
        pixel_pts = np.asarray(pixel_pts, dtype=float)
        robot_pts = np.asarray(robot_pts, dtype=float)
        errs = []
        for (u, v), (X, Y) in zip(pixel_pts, robot_pts):
            px, py = self.pixel_to_robot(u, v)
            errs.append(((px - X) ** 2 + (py - Y) ** 2) ** 0.5)
        return np.array(errs)

    def max_error(self, pixel_pts, robot_pts) -> float:
        """最大残差(mm)。比赛中应 < 2mm 才算标定合格。"""
        return float(self.residuals(pixel_pts, robot_pts).max())
