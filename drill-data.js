/* ========================================================================
   现场代码刷题题库 —— 基于"案例程序(标准答案) vs 正式比赛桌面(考卷)"对比
   每题结构：
   { id, mod, level(L1填空/L2改错/L3默写), type(fill/choice/judge/write),
     prompt, code(可选,展示代码块), options(选择题), answer, memory(记忆点),
     why(为什么这么写), params(现场必改参数,可选) }
   ======================================================================== */

const MODULES = [
  { key:'conn',  icon:'🔌', name:'机械臂连接+初始化', diff:1,
    desc:'复用率最高！下料/上料开头都靠它。load→Connect→清警报→设参数→开队列→回零' },
  { key:'move',  icon:'🤖', name:'move() 抓放函数', diff:2,
    desc:'整个程序调用最多的函数。夹爪开合 + 上方/落点/抬起三段式运动' },
  { key:'coord', icon:'📍', name:'坐标点与码垛逻辑', diff:2,
    desc:'P点定义、4类放置点P3、码垛分垛分层算法 (k/j/add_up)' },
  { key:'tcp_s', icon:'🖥️', name:'下料机 TCP服务端', diff:3,
    desc:'8081端口服务端、accept三个客户端、4个线程函数收发逻辑' },
  { key:'tcp_c', icon:'📡', name:'上料机 TCP客户端', diff:2,
    desc:'connect 8081、主循环收run、码垛取料、传送带与光电传感器' },
  { key:'cls',   icon:'🧠', name:'深度学习分类 main', diff:2,
    desc:'修缩进bug、补TCP连接、predict识别、读RFID、发种类给下料机' },
  { key:'rfid',  icon:'🏷️', name:'RFID 与文件拷贝', diff:1,
    desc:'现场缺3个文件要拷贝！read_card_text读json、get_decoded_text' },
];

const QUESTIONS = [
/* ============ 模块1：连接+初始化 (conn) ============ */
{id:101,mod:'conn',level:'L1',type:'fill',
 prompt:'加载机械臂动态库 DobotDll.dll（必须第一步）：',
 code:'api = dType.____()',
 answer:'load',
 memory:'<b>load</b> = 装载DLL。记法：用之前先"load"进来。',
 why:'dType.load() 返回一个 api 句柄，后面所有指令第一个参数都要传它。没有它谁都调不动。'},

{id:102,mod:'conn',level:'L1',type:'fill',
 prompt:'连接下料机械臂，波特率固定，取返回元组的状态码：',
 code:'state = dType.ConnectDobot(api, "COM6", ____)[____]',
 answer:'115200 ; 0',
 memory:'波特率永远 <b>115200</b>；返回是元组，<b>[0]</b> 才是状态码。',
 why:'ConnectDobot 返回 (状态码, ...)。115200 是 Dobot 固定串口速率，写错连不上。',
 params:'COM口现场必改！下料案例=COM6，上料现场=COM5，以设备管理器实际为准。'},

{id:103,mod:'conn',level:'L1',type:'fill',
 prompt:'用状态码当索引，打印中文连接状态：',
 code:'print("连接状态:", ["已连接","未找到设备","端口占用"][____])',
 answer:'state',
 memory:'状态码 <b>0/1/2</b> 正好对应列表三个位置。',
 why:'state=0已连接，1未找到，2端口占用。用列表索引一行就能转成中文，是固定写法。'},

{id:104,mod:'conn',level:'L3',type:'write',
 prompt:'【默写】写出"初始化四件套"：清警报、设门型运动参数(100,110)、设光电传感器(端口1,版本2)、设夹爪末端(长59.7)。全部队列模式。',
 answer:'dType.ClearAllAlarmsState(api)\ndType.SetPTPJumpParams(api, 100, 110, isQueued=1)\ndType.SetInfraredSensor(api, 1, 2, version=1)\ndType.SetEndEffectorParams(api, 59.7, 0, 0, 1)',
 memory:'顺序：<b>清警报→跳跃参数→传感器→末端</b>。',
 why:'ClearAllAlarms清掉上次报警否则不动；SetPTPJumpParams门型抬升高度;SetEndEffectorParams最后那个1=夹爪类型。',
 params:'上料机的 SetInfraredSensor 第3参是 1 不是 2（端口不同）。'},

{id:105,mod:'conn',level:'L1',type:'fill',
 prompt:'清空指令队列 + 开始执行队列（两行）：',
 code:'dType.SetQueuedCmdClear(api)\ndType.SetQueuedCmd________(api)',
 answer:'StartExec',
 memory:'先 <b>Clear</b> 清干净，再 <b>StartExec</b> 开闸放行。',
 why:'Dobot指令是进队列再执行。不StartExec，后面发的指令全堵在队列里不动。'},

{id:106,mod:'conn',level:'L1',type:'fill',
 prompt:'机械臂回零（队列模式）：',
 code:'dType.SetHOMECmd(api, ____, isQueued=____)',
 answer:'1 ; 1',
 memory:'回零 <b>SetHOMECmd(api,1,isQueued=1)</b>，背成固定串。',
 why:'回零让机械臂找到机械原点，保证后面坐标准确。isQueued=1 进队列顺序执行。'},

{id:107,mod:'conn',level:'L2',type:'choice',
 prompt:'下面哪行是现场版骨架"漏掉"、需要你补上的初始状态指令？',
 options:['dType.load()','dType.SetEndEffectorGripper(api, 0, 0, isQueued=1)  # 夹爪打开','dType.ConnectDobot(api,"COM6",115200)','dType.SetHOMECmd(api,1,isQueued=1)'],
 answer:'B',
 memory:'现场骨架只到回零；<b>夹爪先打开</b>这步要自己补。',
 why:'抓取前夹爪必须是张开状态，否则抓不住。案例版有这行，现场版被删了。'},

{id:108,mod:'conn',level:'L2',type:'judge',
 prompt:'判断：上料机比下料机初始化时多一行 dType.SetEMotor(api,0,0,-10000,1) 来初始化传送带（先停）。',
 answer:'对',
 memory:'<b>只有上料机</b>管传送带，所以多一行 SetEMotor。',
 why:'传送带由上料机控制。开头先发停止(速度负值/使能0)，避免一上电就乱转。'},

/* ============ 模块2：move() 抓放 (move) ============ */
{id:201,mod:'move',level:'L1',type:'fill',
 prompt:'move函数定义，6个参数：坐标xyzr + 抓放前后夹爪 + 是否保持：',
 code:'def move(x, y, z, r, ____, ____, ____):',
 answer:'air1 ; air2 ; keep',
 memory:'<b>air1</b>=到点前夹爪态，<b>air2</b>=到点后夹爪态，<b>keep</b>=是否保持。',
 why:'一个move同时管"去哪"和"夹爪怎么动"。air1/air2控制抓或放，keep=0时结尾松开。'},

{id:202,mod:'move',level:'L3',type:'write',
 prompt:'【默写】写出move函数体核心5步：①设夹爪air1 ②到目标上方z+20 ③下到z ④设夹爪air2并等1秒 ⑤抬回z+20。(下料版偏移20，等待dSleep(1000))',
 answer:'dType.SetEndEffectorGripper(api, 1, air1, isQueued=1)\ndType.SetPTPCmdEx(api, 1, x, y, z + 20, r, isQueued=1)\ndType.SetPTPCmdEx(api, 1, x, y, z, r, isQueued=1)\ndType.SetEndEffectorGripper(api, air2, 1, isQueued=1)\ndType.dSleep(1000)\ndType.SetPTPCmdEx(api, 1, x, y, z + 20, r, isQueued=1)\nif keep == 0:\n    dType.SetEndEffectorGripper(api, 0, air1, isQueued=1)',
 memory:'三段式：<b>上方→落点→抬起</b>，中间夹爪动作 + dSleep等夹紧。',
 why:'先到上方再垂直下落避免撞料；dSleep让夹爪真正夹稳再抬；keep=0松爪用于"放下后回到张开"。',
 params:'上料版偏移是 z+50、dSleep(100)；下料版是 z+20、dSleep(1000)。别记反。'},

{id:203,mod:'move',level:'L1',type:'fill',
 prompt:'PTP点到点运动指令（mode=1直线，队列）：',
 code:'dType.____(api, 1, x, y, z, r, isQueued=1)',
 answer:'SetPTPCmdEx',
 memory:'移动就用 <b>SetPTPCmdEx</b>，第二个参数 1 = 模式。',
 why:'本赛题运动统一用 SetPTPCmdEx（带Ex是阻塞到位版），不是吸盘那套。mode=1为运动模式。'},

{id:204,mod:'move',level:'L1',type:'fill',
 prompt:'控制夹爪：启用夹爪、闭合/张开状态：',
 code:'dType.________________(api, 1, 0, isQueued=1)  # 启用,张开',
 answer:'SetEndEffectorGripper',
 memory:'夹爪 <b>SetEndEffectorGripper(api, 使能, 开合)</b>。',
 why:'末端是夹爪不是吸盘，所以用 Gripper 不是 SuctionCup。第2参使能，第3参0张开/1闭合（按设备实测）。'},

{id:205,mod:'move',level:'L2',type:'judge',
 prompt:'判断：因为末端是夹爪，所以运动指令应该用 SetPTPCmd 配合 SetEndEffectorSuctionCup 吸盘控制。',
 answer:'错',
 memory:'夹爪→<b>Gripper</b>，吸盘才用 SuctionCup。本赛是夹爪！',
 why:'这是高频陷阱。本系统末端是夹爪，必须用 SetEndEffectorGripper；用吸盘指令会抓不起来。'},

/* ============ 模块3：坐标与码垛 (coord) ============ */
{id:301,mod:'coord',level:'L1',type:'fill',
 prompt:'下料机抓取计数列表，记录4个种类已放数量：',
 code:'add_up = [____, ____, ____, ____]',
 answer:'0 ; 0 ; 0 ; 0',
 memory:'4类各一个计数器，全 <b>0</b> 起步。',
 why:'每放一件对应类别+1，用来算放第几垛第几层，凑满8件结束。'},

{id:302,mod:'coord',level:'L1',type:'fill',
 prompt:'分类标签列表（现场必改成实际主题）：',
 code:"sampleClss = ['1.jqr', '2.jxb', '3.plc', '4.sjxt']",
 answer:'sampleClss',
 memory:'<b>sampleClss</b> 必须和分类程序返回的字符串<b>一字不差</b>。',
 why:'下料机用 sampleClss.index(data) 找种类下标。标签对不上会直接 ValueError 崩溃。',
 params:'现场必改！要和深度学习模型训练的类别名完全一致（可能是省份名等）。'},

{id:303,mod:'coord',level:'L2',type:'choice',
 prompt:'码垛算法：add_up[index] 为 0/1 放第一垛、2/3 放第二垛。下面哪个表达式正确算出垛号 k？',
 options:['k = add_up[index] % 2','k = 0 if add_up[index] < 2 else 1','k = add_up[index] // 4','k = 1 if add_up[index] < 2 else 0'],
 answer:'B',
 memory:'<b>k</b>：小于2第一垛(0)，否则第二垛(1)。',
 why:'每类2件×2垛位放置点。前2件放k=0，后2件放k=1。注意每类只有2件，这里其实是分两个放置点。'},

{id:304,mod:'coord',level:'L2',type:'choice',
 prompt:'计算层数偏移 j（底层0/上层1），哪个对？',
 options:['j = add_up[index] // 2','j = add_up[index] % 2','j = 1 - add_up[index]','j = add_up[index] * 10'],
 answer:'B',
 memory:'<b>j = add_up % 2</b>：偶数底层，奇数上层。delta_z = j*10。',
 why:'同一垛位堆两层，偶数件放底层(z)，奇数件放上层(z+10mm)。'},

{id:305,mod:'coord',level:'L3',type:'write',
 prompt:'【默写】放完一件后：计数+1，判断是否满8件，没满就通知上料和分类继续(send "run")。',
 answer:'add_up[index] += 1\nsum_add = sum(add_up)\nif sum_add < 8:\n    tcpCliSock3.send("run".encode("utf-8"))\n    tcpCliSock2.send("run".encode("utf-8"))',
 memory:'<b>+1 → 求和 → &lt;8 才发 run</b>。满8件就停，不再发run。',
 why:'总共8件。每放一件计数，未满8则让上料(sock3)和分类(sock2)继续下一轮；满了就自然停。'},

/* ============ 模块4：下料机TCP服务端 (tcp_s) ============ */
{id:401,mod:'tcp_s',level:'L1',type:'fill',
 prompt:'创建TCP服务端、绑定端口、监听：',
 code:'socket_server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\nsocket_server.bind(("127.0.0.1", ____))\nsocket_server.listen(5)',
 answer:'8081',
 memory:'下料机是<b>服务端</b>，端口 <b>8081</b>，最先启动。',
 why:'整个系统下料机当服务端先起，其它程序都连它的8081。listen(5)=最多5个排队连接。'},

{id:402,mod:'tcp_s',level:'L1',type:'fill',
 prompt:'接受一个客户端连接，并开线程处理：',
 code:'tcpCliSock1, addr1 = socket_server.____()\nThread(target=vision, args=(tcpCliSock1, "视觉端")).start()',
 answer:'accept',
 memory:'<b>accept()</b> 阻塞等连接，返回 (连接对象, 地址)。',
 why:'accept按顺序接收三个客户端：视觉→分类→上料。顺序错了线程绑错对象。'},

{id:403,mod:'tcp_s',level:'L2',type:'choice',
 prompt:'下料机 accept 连接客户端的正确顺序是？（对应TCP启动顺序）',
 options:['上料→分类→视觉','视觉→分类→上料','分类→视觉→上料','随便,谁先连接谁'],
 answer:'B',
 memory:'连接顺序=启动顺序：<b>视觉→分类→上料</b>。',
 why:'accept是阻塞顺序的，谁先连就配第一个线程。必须按 视觉(sock1)→分类(sock2)→上料(sock3) 启动，否则错位。',
 params:'启动总顺序：下料机(服务端先开)→视觉→分类→上料→(语音)。'},

{id:404,mod:'tcp_s',level:'L1',type:'fill',
 prompt:'接收数据并解码（TCP收发万能写法）：',
 code:'data = socket.recv(1024).____("utf-8")',
 answer:'decode',
 memory:'收=<b>recv().decode</b>，发=<b>send(...encode())</b>。',
 why:'网络传的是字节，收到要 decode 成字符串才能比较；发送前要 encode 成字节。'},

{id:405,mod:'tcp_s',level:'L2',type:'choice',
 prompt:'发送字符串给客户端，下面哪行正确？',
 options:['sock.send("run")','sock.send("run".encode("utf-8"))','sock.send(encode("run"))','sock.recv("run")'],
 answer:'B',
 memory:'发送必须 <b>.encode("utf-8")</b>，漏了直接报错。',
 why:'send只接受bytes。"run".encode("utf-8") 转成字节。这是最高频的低级错误。'},

{id:406,mod:'tcp_s',level:'L3',type:'write',
 prompt:'【默写】分类线程 classification 开头：收数据→打印→用 sampleClss 找下标→移动到抓取点P6。',
 answer:'data = socket.recv(1024).decode("utf-8")\nprint(f"{name}发送{data}")\nindex = sampleClss.index(str(data))\nmove(P6[0], P6[1], P6[2], P6[3], 0, 1, 1)',
 memory:'收种类字符串 → <b>index</b> 定位 → move到抓取点。',
 why:'分类程序发来的是种类名，index()转成0-3下标，再去P3取对应放置坐标。'},

/* ============ 模块5：上料机TCP客户端 (tcp_c) ============ */
{id:501,mod:'tcp_c',level:'L1',type:'fill',
 prompt:'上料机作为客户端连接下料机服务端：',
 code:'socket_client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)\nsocket_client.connect(("127.0.0.1", ____))',
 answer:'8081',
 memory:'客户端用 <b>connect</b>，连下料机的 <b>8081</b>。',
 why:'上料/分类/视觉都是客户端，统一 connect 到 127.0.0.1:8081。'},

{id:502,mod:'tcp_c',level:'L2',type:'choice',
 prompt:'上料机主循环收到数据后，哪种情况才继续执行码垛？',
 options:['收到任何数据都执行','if data != "run": continue（只有run才往下）','if data == "stop"','无条件执行'],
 answer:'B',
 memory:'<b>不是run就continue跳过</b>，只有"run"触发上料。',
 why:'下料机发"run"作为节拍信号。上料机只在收到run时取一件料，避免重复动作。'},

{id:503,mod:'tcp_c',level:'L1',type:'fill',
 prompt:'取完料放到拍照位后，通知下料机已到位：',
 code:'socket_client.send("________".encode("utf-8"))',
 answer:'arrive1',
 memory:'上料到位发 <b>arrive1</b>（RFID位）、传送带到位发 <b>arrive2</b>。',
 why:'arrive1触发视觉拍第一张(RFID面)，arrive2触发拍第二张。信号名写错下料机不响应。'},

{id:504,mod:'tcp_c',level:'L3',type:'write',
 prompt:'【默写】启动传送带后，循环检测光电传感器，检测到物体(返回1)就停传送带并发arrive2。',
 answer:'dType.SetEMotor(api, 0, 1, 10000, 1)\nwhile True:\n    i = dType.GetInfraredSensor(api, 1)\n    if i[0] == 1:\n        break\ndType.SetEMotor(api, 0, 0, -10000, 1)\nsocket_client.send("arrive2".encode("utf-8"))',
 memory:'<b>开带→轮询传感器→i[0]==1停带→发arrive2</b>。',
 why:'传送带把料送到末端，光电传感器i[0]=1说明料到位，立刻停带防止冲出，再通知下料机。'},

/* ============ 模块6：深度学习分类 (cls) ============ */
{id:601,mod:'cls',level:'L2',type:'choice',
 prompt:'现场版 main.py 有个致命bug，是什么？',
 options:['import写错了','if result==0 缩进跑到while循环外面，永远执行不到','predict函数名错','少了cv2'],
 answer:'B',
 memory:'现场版 <b>if 缩进错位</b>，掉出了while。',
 why:'代码里 if result==0 顶格写，脱离了while循环体。必须缩进回while内部。这是故意埋的改错点。'},

{id:602,mod:'cls',level:'L1',type:'fill',
 prompt:'分类程序连接下料机服务端：',
 code:'socket_client.connect(("127.0.0.1", ____))',
 answer:'8081',
 memory:'分类也是客户端，连 <b>8081</b>。',
 why:'分类程序在下料机之后、上料机之前启动，作为第2个客户端连入。'},

{id:603,mod:'cls',level:'L3',type:'write',
 prompt:'【默写】收到含"M"的数据后：读图→predict→若result==0则continue→打印结果。',
 answer:'img = cv2.imread(imagePath)\nresult = predict(img)\nif result == 0:\n    continue\nprint(f"结果:{result[0]},编号:{result[1]},置信度:{result[2]}")',
 memory:'<b>读图→predict→判0→取result[0]种类</b>。',
 why:'predict返回(种类,编号,置信度)。result==0代表识别失败跳过本轮。result[0]是要发给下料机的种类名。'},

{id:604,mod:'cls',level:'L1',type:'fill',
 prompt:'识别出种类后，把种类名发回下料机：',
 code:'socket_client.send(result[____].encode("utf-8"))',
 answer:'0',
 memory:'<b>result[0]</b>=种类名，正好对应 sampleClss。',
 why:'下料机收到后用 sampleClss.index() 转下标。所以这里发的必须是种类名(result[0])。'},

{id:605,mod:'cls',level:'L2',type:'judge',
 prompt:'判断：本赛题物料分类用的是 OpenCV 形状识别，不是深度学习。',
 answer:'错',
 memory:'用 <b>ResNet18 深度学习</b>分类，不是OpenCV形状。',
 why:'高频陷阱。分类靠训练好的ResNet18模型(predict)，OpenCV只负责读图。'},

/* ============ 模块7：RFID与文件拷贝 (rfid) ============ */
{id:701,mod:'rfid',level:'L2',type:'choice',
 prompt:'现场版"深度学习分类"文件夹缺失哪些文件，需要从RFID64bit拷过来？',
 options:['DobotDllType.py','RFID.py、read_card_text.py、comPro64.dll','ResNet.py','train.py'],
 answer:'B',
 memory:'缺3个：<b>RFID.py + read_card_text.py + comPro64.dll</b>。',
 why:'main.py 里 import 了 read_card_text，且RFID读卡依赖comPro64.dll。不拷进来分类程序import就报错。',
 params:'现场第一步操作：从 RFID64bit/ 复制这3个文件到 深度学习分类/。'},

{id:702,mod:'rfid',level:'L1',type:'fill',
 prompt:'从分类main导入RFID解码文本的函数：',
 code:'from read_card_text import ________________',
 answer:'get_decoded_text',
 memory:'<b>get_decoded_text()</b> 读 card_result.json 里的 decoded_text。',
 why:'RFID.py读卡后把结果写进card_result.json；get_decoded_text()只负责读出那个文本(省份;时间)。'},

{id:703,mod:'rfid',level:'L3',type:'write',
 prompt:'【默写】拿到RFID解码文本后，按分号拆成产地和时间两部分。文本格式"广东省;2026..."。',
 answer:'code = get_decoded_text()\nif code:\n    sp_code1 = str(code).split(";")[0]\n    sp_code2 = str(code).split(";")[1]',
 memory:'<b>split(";")</b> 拆"产地;时间"，[0]产地 [1]时间。',
 why:'RFID卡里存的是"省份;时间"格式。split分号后[0]是产地、[1]是时间，用于结果显示。'},

{id:704,mod:'rfid',level:'L1',type:'fill',
 prompt:'RFID读卡的块号和默认密钥（read_card中）：',
 code:'TARGET_BLOCK = ____\nDEFAULT_KEY_A = "____________"',
 answer:'1 ; FFFFFFFFFFFF',
 memory:'读<b>块1</b>，默认密钥 <b>12个F</b>（出厂默认）。',
 why:'数据写在块1(属扇区0)，MIFARE卡出厂密钥全FF。这俩参数一般不用改。'},
];

/* 各模块讲解文章 */
const STUDY = {
conn:`<div class="article"><h3>这块在干嘛</h3>
<p>Dobot机械臂不能直接用Python控制，要通过 <span class="k">DobotDll.dll</span> 发指令。<code>DobotDllType.py</code> 是它的Python封装——<b>不用改</b>，只管调用。</p>
<p>启动就像"开机仪式"，顺序不能乱：</p>
<pre class="code">load → Connect → 清警报 → 设参数 → 清队列 → 开队列 → (开夹爪) → 回零</pre>
<h3>现场考点</h3>
<div class="warn">现场版只留了"连接+初始化"骨架，<b>夹爪打开、坐标、move、TCP全删了</b>，要自己补。</div>
<div class="tip">必改：COM口（设备管理器看）。上料机传感器第3参=1，下料机=2。</div></div>`,
move:`<div class="article"><h3>这块在干嘛</h3>
<p><code>move()</code> 是调用最多的函数，把"夹爪开合 + 三段式运动"打包。</p>
<pre class="code">设夹爪air1 → 到上方(z+偏移) → 落到z → 设夹爪air2+等待 → 抬回上方 → keep=0则松爪</pre>
<h3>关键参数</h3>
<p><span class="k">air1</span>到点前夹爪态、<span class="k">air2</span>到点后夹爪态、<span class="k">keep</span>是否保持夹持。</p>
<div class="warn">末端是<b>夹爪Gripper</b>，不是吸盘SuctionCup！运动用<b>SetPTPCmdEx</b>。</div></div>`,
coord:`<div class="article"><h3>这块在干嘛</h3>
<p>P点是事先示教好的坐标。下料机有4类放置点(P3)，每类分垛(k)分层(j)码放。</p>
<pre class="code">k = 0 if add_up[index] &lt; 2 else 1   # 哪个垛位
j = add_up[index] % 2                # 哪一层(*10偏移)
add_up[index] += 1                   # 计数
满8件结束</pre>
<div class="tip">必改：sampleClss标签要和模型类别一字不差，否则index()崩溃。</div></div>`,
tcp_s:`<div class="article"><h3>这块在干嘛</h3>
<p>下料机是<span class="k">TCP服务端</span>(端口8081)，<b>最先启动</b>。用accept按顺序接3个客户端，每个开一个线程。</p>
<pre class="code">视觉端(sock1) → 分类端(sock2) → 上料端(sock3)</pre>
<p>收发万能写法：<code>recv(1024).decode("utf-8")</code> / <code>send(s.encode("utf-8"))</code></p>
<div class="warn">accept顺序=启动顺序，错位整个流程乱套。</div></div>`,
tcp_c:`<div class="article"><h3>这块在干嘛</h3>
<p>上料机是<span class="k">客户端</span>，connect到8081。主循环只在收到"run"时取一件料。</p>
<pre class="code">收run → 码垛取料 → 放RFID位 → 发arrive1
→ 等OK → 取回 → 放传送带 → 开带
→ 光电传感器i[0]==1停带 → 发arrive2</pre>
<div class="tip">arrive1=RFID面拍照，arrive2=传送带到位。</div></div>`,
cls:`<div class="article"><h3>这块在干嘛</h3>
<p>用训练好的<span class="k">ResNet18</span>(predict)识别物料种类，读RFID取产地时间，把种类发回下料机。</p>
<div class="warn">现场版main.py有bug：<b>if result==0 缩进跑到while外面</b>，要修回循环内。</div>
<div class="warn">还缺3个文件，要从RFID64bit拷过来(见RFID模块)。</div>
<div class="tip">predict返回 (种类, 编号, 置信度)，result[0]是种类名。</div></div>`,
rfid:`<div class="article"><h3>这块在干嘛</h3>
<p>RFID.py读卡(块1,密钥全F)→写card_result.json；read_card_text.py负责读出decoded_text("省份;时间")。</p>
<h3>现场第一步操作</h3>
<div class="warn">从 <b>RFID64bit/</b> 复制 <b>RFID.py、read_card_text.py、comPro64.dll</b> 到 <b>深度学习分类/</b>，否则分类程序import报错。</div>
<pre class="code">code = get_decoded_text()
sp_code1 = code.split(";")[0]  # 产地
sp_code2 = code.split(";")[1]  # 时间</pre></div>`,
};

/* 速查卡 */
const CHEAT = `
<div class="article"><h3>🚀 现场操作顺序（保底）</h3>
<ul>
<li><b>①拷文件</b>：RFID64bit的3个文件→深度学习分类</li>
<li><b>②补下料机Main.py</b>(最重要,30min)</li>
<li><b>③补上料机Main.py</b>(20min)</li>
<li><b>④修分类main.py缩进bug</b>(10min)</li>
<li><b>⑤联调</b>，按顺序启动</li>
</ul></div>
<div class="article"><h3>🔌 程序启动顺序（背死）</h3>
<pre class="code">下料机(服务端先开) → 视觉 → 分类 → 上料 → (语音)</pre>
<div class="warn">顺序错=accept错位=全乱。下料机必须第一个。</div></div>
<div class="article"><h3>⚙️ 必改参数表</h3>
<table class="tbl"><tr><th>参数</th><th>位置</th><th>说明</th></tr>
<tr><td>COM口</td><td>各Main.py连接行</td><td>设备管理器实际值,下料常COM6,上料COM5</td></tr>
<tr><td>sampleClss</td><td>下料机</td><td>4个标签=模型类别名,一字不差</td></tr>
<tr><td>P点坐标</td><td>各Main.py</td><td>示教得到,抓取/放置/拍照点</td></tr>
<tr><td>传感器第3参</td><td>SetInfraredSensor</td><td>下料=2,上料=1</td></tr>
</table></div>
<div class="article"><h3>📌 固定值速记</h3>
<ul>
<li>波特率永远 <b>115200</b></li>
<li>服务端端口 <b>8081</b></li>
<li>ConnectDobot返回取 <b>[0]</b> 状态码</li>
<li>运动指令 <b>SetPTPCmdEx(api,1,x,y,z,r,isQueued=1)</b></li>
<li>夹爪 <b>SetEndEffectorGripper</b>(不是吸盘!)</li>
<li>RFID读<b>块1</b>,密钥<b>12个F</b></li>
<li>收<b>.decode</b> 发<b>.encode</b>("utf-8")</li>
</ul></div>
<div class="article"><h3>🔁 信号流速记</h3>
<pre class="code">上料到位→arrive1→视觉拍RFID面
传送带到位→arrive2→视觉拍正面
视觉出M码→分类predict→发种类→下料抓放
未满8件→下料发run→上料分类继续</pre></div>
`;
