"""
机械臂端 TCP 服务端 —— 接收视觉端发来的识别结果并驱动机械臂分拣。

练习用 mock_dobot；现场把 `import mock_dobot as dType`
换成 `import DobotDllType as dType` 即可。

运行：
    python tcp_server.py
然后另开一个终端运行 tcp_client_vision_sim.py
"""
from __future__ import annotations
import socket
import argparse

import mock_dobot as dType          # 现场改为: import DobotDllType as dType
from sorter import Sorter
from protocol import parse_line, split_stream

HOST, PORT = "127.0.0.1", 6000


def main(host=HOST, port=PORT):
    api = dType.load()
    if dType.ConnectDobot(api, "", 115200)[0] != dType.DobotConnect.DobotConnect_NoError:
        print("机械臂未连接"); return
    sorter = Sorter(dType, api)
    sorter.setup()

    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind((host, port)); srv.listen(1)
    print(f"[server] 等待视觉端连接 {host}:{port} ...")
    conn, addr = srv.accept()
    print("[server] 已连接", addr)

    buf, done = "", 0
    try:
        while True:
            data = conn.recv(1024).decode("utf-8", "ignore")
            if not data:
                break
            buf += data
            lines, buf = split_stream(buf)
            for line in lines:
                try:
                    msg = parse_line(line)
                except ValueError as e:
                    print("[server] 解析失败:", e)
                    conn.sendall(b"ERR\n")
                    continue
                if msg == "END":
                    print(f"[server] 本批完成，共分拣 {done} 件")
                    continue
                if isinstance(msg, str):
                    continue
                ok = sorter.pick_and_place(msg)
                done += 1 if ok else 0
                conn.sendall(b"OK\n" if ok else b"ERR\n")
    finally:
        conn.close()
        dType.DisconnectDobot(api)
        print("[server] 关闭")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--host", default=HOST)
    ap.add_argument("--port", type=int, default=PORT)
    args = ap.parse_args()
    main(args.host, args.port)
