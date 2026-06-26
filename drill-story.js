/* ========================================================================
   叙事化五层拆解 —— 每个模块一篇"啊原来如此"的长讲解
   配合 drill-data.js 的刷题使用：刷题看 STUDY(短提示)，理解看 STORY(长叙事)
   五层结构：L1动机 / L2本质 / L3方案 / L4拿分 / L5关联
   ======================================================================== */

const STORY = {

/* ============================ 模块1：连接+初始化 ============================ */
conn: `
<div class="story">

<p class="scene">早上 8 点，佛冈校区实训楼 403 室。你抽到 7 号工位，桌上两条 Dobot 机械臂、一台相机、一截传送带，电脑桌面躺着一个"赛项文件夹"。你双击打开 <code>下料机器臂/Main.py</code>——里面只有十几行，连接机械臂之后就空了。裁判说"开始"，80 分钟倒计时启动。这一刻你要做的第一件事，不是写花哨的逻辑，而是<b>让那条铁胳膊"活过来"</b>。这就是"连接+初始化"这一块的全部意义。</p>

<h3>L1 · 为什么第一步是"开机仪式"，而不是直接抓东西？</h3>

<p>先想一个生活场景：你借了一辆陌生的手动挡汽车。你会一上来就猛踩油门吗？不会。你会先<b>插钥匙通电、看仪表盘有没有报警灯、挂空挡、松手刹</b>——确认车"听你的"了，才敢开。机械臂一模一样。</p>

<p>这套程序面对的是一根真实的、会撞坏的金属臂。它出题方的意图有三层：</p>

<table class="tbl">
<tr><th>层次</th><th>出题方想考你什么</th></tr>
<tr><td>学科意图</td><td>懂不懂"硬件设备要先初始化再操作"这个基本工程素养</td></tr>
<tr><td>工具意图</td><td>会不会用 Dobot 的 Python SDK（DobotDllType）按正确顺序发指令</td></tr>
<tr><td>产业意图</td><td>真实产线上，设备上电自检、清报警、回原点是每天开机的标准动作，错一步可能撞机停产</td></tr>
</table>

<blockquote><b>小白补课：什么是 SDK / DLL</b><br>
DLL 是厂家用 C 语言写好的"机械臂驱动包"（DobotDll.dll），里面是真正跟硬件对话的代码。<br>
你不可能用 Python 直接喊话硬件，所以厂家又给了一层 Python 翻译官 <code>DobotDllType.py</code>，把 DLL 的函数包成 Python 能调用的样子。这层翻译官就叫 SDK。<br>
<b>关键：这两个文件现场已经给你，不用写、不用改，只管 import 来用。</b></blockquote>

<h3>L2 · 这段代码的本质：一条"指令流水线"</h3>

<p>Dobot 有个反直觉的设计：你调 <code>SetPTPCmdEx(...)</code> 让它移动，它<b>不会立刻动</b>。指令先排进一条"队列"，等你喊一声"开始执行"，它才照队列一条条做。这就像你在奶茶店点单——点完不是马上拿到，而是排进出单队列。</p>

<p>理解了这条"队列"，初始化的代码顺序就不再是死记，而是有逻辑的：</p>

<pre class="code"><span class="cm"># ① 装翻译官（加载DLL）</span>
api = dType.load()

<span class="cm"># ② 插钥匙通电（连接，115200是固定串口速率）</span>
state = dType.ConnectDobot(api, "COM6", 115200)[0]
print("连接状态:", ["已连接","未找到设备","端口占用"][state])

<span class="cm"># ③ 熄灭报警灯</span>
dType.ClearAllAlarmsState(api)
<span class="cm"># ④ 设定"门型抬升"高度（抓放时先抬多高，防撞）</span>
dType.SetPTPJumpParams(api, 100, 110, isQueued=1)
<span class="cm"># ⑤ 告诉它末端装的是夹爪（长59.7mm）</span>
dType.SetEndEffectorParams(api, 59.7, 0, 0, 1)
<span class="cm"># ⑥ 清空旧队列 + 开闸放行</span>
dType.SetQueuedCmdClear(api)
dType.SetQueuedCmdStartExec(api)
<span class="cm"># ⑦ 夹爪先张开 + 回机械原点</span>
dType.SetEndEffectorGripper(api, 0, 0, isQueued=1)
dType.SetHOMECmd(api, 1, isQueued=1)</pre>

<p>这段代码说的其实是——<b>"翻译官就位 → 通电握手 → 清掉旧报警 → 告诉它身体参数 → 倒空旧任务并开工 → 摆好初始姿势"</b>。每一行都对应汽车启动的一个动作，顺序错了车就打不着火。</p>

<p>这里藏着一个<b>真假难点</b>：表面难点像是"记住这么多函数名"，<b>真正的难点其实是那个 <code>[0]</code> 和 <code>isQueued=1</code></b>。</p>
<ul>
<li><code>ConnectDobot(...)[0]</code>：这个函数返回的是一个<b>元组</b>（一串值），第 0 个才是连接状态码。漏了 <code>[0]</code>，你的 state 就不是 0/1/2，后面打印中文状态直接错乱。<b>解法：记成"连接必带尾巴 [0]"。</b></li>
<li><code>isQueued=1</code>：表示"这条指令进队列排队"。初始化几乎每行都带它。<b>解法：记成"队列模式全程带 isQueued=1"。</b></li>
</ul>

<h3>L3 · 现场怎么落地：算一笔"必改账"</h3>

<p>这块代码现场给了骨架，但有几个值是<b>必须你来改的</b>，改错一个就连不上设备。我们把它当成一张"指标拆解表"：</p>

<table class="tbl">
<tr><th>参数</th><th>案例里的值</th><th>现场怎么定</th><th>改错的后果</th></tr>
<tr><td>COM 口</td><td>下料 COM6 / 上料 COM5</td><td>设备管理器→端口(COM)看实际号</td><td>state=1 未找到设备，全盘卡死</td></tr>
<tr><td>传感器第3参</td><td>下料=2 / 上料=1</td><td>按机器固定，别记反</td><td>光电传感器读不到料</td></tr>
<tr><td>夹爪长度</td><td>59.7</td><td>一般不动</td><td>抓取高度偏移</td></tr>
</table>

<p><b>误差预算的思路</b>：初始化这块本身不产生"精度误差"，它是"通不通"的 0/1 问题。所以你的目标不是"差不多"，而是<b>100% 跑通</b>——连接打印出"已连接"三个字，这块就满分了。给自己留的裕量是：<b>开头先单独运行一次，确认打印"已连接"再往下做</b>，别等联调时才发现 COM 写错。</p>

<p><b>多方案对比</b>——COM 口怎么填，有三条路：</p>
<table class="tbl">
<tr><th>方案</th><th>可靠性</th><th>速度</th><th>推荐度</th></tr>
<tr><td>A. 直接用案例里的 COM6</td><td>低（现场不一定是6）</td><td>快</td><td>❌ 赌运气</td></tr>
<tr><td>B. 设备管理器查实际号再填</td><td>高</td><td>中</td><td>✅ 主推</td></tr>
<tr><td>C. 写自动扫描 COM2~20 的代码</td><td>高</td><td>慢（零基础写不出）</td><td>🛟 兜底，时间够才碰</td></tr>
</table>
<p>推荐走 B。C 方案虽然优雅，但你零基础、时间紧，现场写扫描逻辑容易引入新 bug，<b>只在 B 反复失败时才作为兜底</b>。</p>

<h3>L4 · 怎么拿分 / 怎么不翻车</h3>

<p><b>评分预估</b>：初始化是整个程序能跑的前提，它不单独给分，但<b>它一错，后面 80 分钟全部归零</b>。所以它的"隐藏分值"是 100%——是地基。</p>

<p><b>高频坑 & 解法：</b></p>
<table class="tbl">
<tr><th>坑</th><th>现象</th><th>解法</th></tr>
<tr><td>COM 写死 COM6</td><td>"未找到设备"</td><td>设备管理器查实际号</td></tr>
<tr><td>漏 <code>[0]</code></td><td>状态打印乱码/报错</td><td>记"连接带尾巴[0]"</td></tr>
<tr><td>忘了 StartExec</td><td>指令发了臂不动</td><td>"清队列后必开闸"</td></tr>
<tr><td>没清报警</td><td>上次急停后臂罢工</td><td>开头 ClearAllAlarmsState</td></tr>
</table>

<p><b>翻车救命（降级方案）</b>：如果连接死活不成功，又快没时间了——别死磕代码。按这个顺序自救：① 拔插 USB 重连；② 设备管理器确认 COM；③ 重启 DobotStudio 看能不能连上（能连说明是代码 COM 写错，不能连说明是硬件/线问题，找裁判报告非选手因素）。<b>保住设备能动，比纠结代码优雅重要一百倍。</b></p>

<p><b>评委隐性加分点</b>：开头加一行 <code>print("连接状态:", ...)</code> 把状态打出来——这不只是调试，更让评委看到你"懂得验证每一步"，是工程素养的体现。</p>

<h3>L5 · 这块和别的模块什么关系</h3>

<p><b>题型判定</b>：这是"设备初始化模板题"，属于<b>背诵+微改</b>型，不需要动脑设计，但必须零失误。</p>

<p><b>可复用性极高</b>：下料机、上料机两个程序的开头<b>几乎一模一样</b>，区别只有 COM 口和传感器那一个参数。所以——<b>这一块你背熟一份，等于写好了两个程序的开头。</b>这是性价比最高的一块，要第一个吃透。</p>

<p><b>承接下一块</b>：开机仪式做完，机械臂"活了"，但它还只会站着。下一块 <code>move()</code> 才是教它"怎么伸手抓东西"——那是真正让它干活的手。</p>

<h3>📌 一句话总纲</h3>
<p class="soul">连接+初始化，就是机械臂的"开机开车仪式"——它不给分，但它是 80 分钟的地基；记住"装翻译官→通电带[0]→清报警→报身体参数→清队列开闸→摆姿势"这条流水线，COM 口现场查准，这一块就稳了。</p>

</div>
`,

/* ============================ 模块2：move() 抓放 ============================ */
move: `
<div class="story">

<p class="scene">机械臂通电了，但它现在像个站着发呆的人。你让它"去抓 7 号工位左上角那块料"——它怎么知道要先抬高、再平移、再下落、夹紧、抬起？这一连串动作如果每次都手写，几百行代码全是重复。于是案例程序把它打包成一个函数：<code>move()</code>。这是整个程序<b>调用次数最多</b>的一块，也是机械臂真正"干活的手"。</p>

<h3>L1 · 为什么要把动作打包成一个函数？</h3>
<p>想象你教一个新员工搬货：你不会每次都说"抬手、伸到货上方、放下、抓住、提起"，你会说一个词——"搬"。<code>move()</code> 就是这个"搬"字。一次定义，处处复用：抓料用它、放到RFID位用它、放传送带用它、码垛放置也用它。</p>
<table class="tbl"><tr><th>层次</th><th>意图</th></tr>
<tr><td>学科意图</td><td>懂"函数封装"——把重复动作抽象成一个可复用单元</td></tr>
<tr><td>工具意图</td><td>会用 Dobot 的运动指令 SetPTPCmdEx + 夹爪指令组合出安全抓放</td></tr>
<tr><td>产业意图</td><td>真实产线的取放(pick&place)就是这套"门字形"轨迹，是工业机器人最基础动作</td></tr></table>

<h3>L2 · 本质：一条"门字形"轨迹</h3>
<p>为什么不直接斜着冲向目标？因为斜线会撞到旁边的料。正确做法是走"门"字：<b>先到正上方 → 垂直落下 → 动夹爪 → 垂直抬起</b>。</p>
<pre class="code">def move(x, y, z, r, air1, air2, keep):
    设夹爪 air1            <span class="cm"># 到点前的状态</span>
    到 (x,y, z+偏移)       <span class="cm"># 先到上方</span>
    到 (x,y, z)            <span class="cm"># 垂直落下</span>
    设夹爪 air2 + 等待      <span class="cm"># 抓紧/松开，停一下让它夹稳</span>
    到 (x,y, z+偏移)       <span class="cm"># 垂直抬起</span>
    if keep==0: 松爪</pre>
<p>这段说的其实是——<b>"摆好手势→悬停目标上方→下探→抓/放→收回"</b>。真假难点：表面是记参数，<b>真难点是 air1/air2/keep 三个开关的含义</b>。air1=到达前夹爪态，air2=到达后夹爪态，keep=是否保持夹持。抓料时 air2=夹紧；放料时 air2=张开。</p>
<div class="warn">致命点：本赛末端是<b>夹爪 SetEndEffectorGripper</b>，不是吸盘！运动用 <b>SetPTPCmdEx</b>，第二个参数 1 是模式。</div>

<h3>L3 · 现场落地：两个版本的偏移别记反</h3>
<table class="tbl"><tr><th>参数</th><th>上料版</th><th>下料版</th><th>说明</th></tr>
<tr><td>抬升偏移</td><td>z+50</td><td>z+20</td><td>上料料高，抬更高防撞</td></tr>
<tr><td>dSleep</td><td>100ms</td><td>1000ms</td><td>下料要夹稳重物，等更久</td></tr></table>
<p><b>多方案</b>：偏移值怎么定？A.照抄案例(快,主推)；B.自己根据料高调(精确但费时)；C.统一用大偏移如z+50(保险但慢)。推荐 A，时间紧时 C 兜底。</p>

<h3>L4 · 拿分与翻车</h3>
<p><b>评分</b>：move 写对，抓放才成立，直接关联"分拣正确率"这个核心分。</p>
<table class="tbl"><tr><th>坑</th><th>解法</th></tr>
<tr><td>用了吸盘指令</td><td>改 SetEndEffectorGripper</td></tr>
<tr><td>没 dSleep 就抬</td><td>夹爪没夹稳料就掉，必须等待</td></tr>
<tr><td>直接斜冲目标</td><td>走门字形，先上方再下落</td></tr></table>
<p><b>降级</b>：如果夹爪老夹不稳，把 dSleep 调大、抬升偏移调大，宁慢求稳——分拣对一件是一件。</p>

<h3>L5 · 关联</h3>
<p>move 是<b>下料机、上料机通用</b>的函数，背一份两边都能用。它依赖模块1的初始化（夹爪、队列已就绪），又被模块3的码垛逻辑反复调用。<b>这是承上启下的核心齿轮。</b></p>
<h3>📌 一句话总纲</h3>
<p class="soul">move() 是机械臂的"搬"字——门字形轨迹(上方→下落→动爪→抬起)+ air1/air2/keep 三开关，夹爪不是吸盘，下落后必等 dSleep 再抬。</p>
</div>
`,

/* ============================ 模块3：坐标与码垛 ============================ */
coord: `
<div class="story">
<p class="scene">8 件料要分到 4 个类别区，每个区还要叠两层、摆两垛。机械臂怎么知道第 5 件该放哪？如果给每件料都手写一个坐标，那是 8×4 个数字的噩梦。案例程序用一套<b>码垛算法</b>，让它自己算"这件该去哪个格子"。这就是坐标与码垛这块的智慧。</p>

<h3>L1 · 为什么需要"算"坐标，而不是写死？</h3>
<p>像快递分拣站：包裹按目的地分格，同一格满了就往上叠。你不会给每个包裹指定一个永久车位，而是定个规则"同省的放一起，满了叠上面"。机械臂也一样，用计数器 + 规则算出落点。</p>
<table class="tbl"><tr><th>层次</th><th>意图</th></tr>
<tr><td>学科意图</td><td>懂用"计数器+取模/整除"做规律性位置分配</td></tr>
<tr><td>工具意图</td><td>会用列表嵌套存坐标 P3[类别][垛][坐标]</td></tr>
<tr><td>产业意图</td><td>真实码垛机器人就是这样算垛位层数的</td></tr></table>

<h3>L2 · 本质：用计数器算"第几垛第几层"</h3>
<pre class="code">add_up = [0,0,0,0]              <span class="cm"># 4类各放了几件</span>
index = sampleClss.index(种类)   <span class="cm"># 种类名→0~3下标</span>
k = 0 if add_up[index] &lt; 2 else 1  <span class="cm"># 前2件第一垛,后2件第二垛</span>
j = add_up[index] % 2            <span class="cm"># 偶数底层,奇数上层</span>
delta_z = j * 10                 <span class="cm"># 上层抬高10mm</span>
add_up[index] += 1               <span class="cm"># 放完计数+1</span></pre>
<p>这段说的其实是——<b>"查这类已经放了几件，据此决定放哪个垛、哪一层，然后计数+1"</b>。真难点是 <code>sampleClss.index()</code>：它把模型返回的种类名转成 0-3 的下标，<b>种类名对不上就直接崩溃</b>。</p>

<h3>L3 · 现场落地：sampleClss 是头号必改项</h3>
<table class="tbl"><tr><th>参数</th><th>现场怎么定</th><th>改错后果</th></tr>
<tr><td>sampleClss</td><td>必须和模型类别名一字不差</td><td>index() 抛 ValueError 崩溃</td></tr>
<tr><td>P3 坐标</td><td>示教得到4类放置点</td><td>放偏/放到桌外</td></tr></table>

<h3>L4 · 拿分与翻车</h3>
<p><b>评分</b>：这块直接决定"分拣到正确区域"。<b>坑</b>：种类名空格、大小写不一致→崩溃。<b>降级</b>：如果码垛叠层算不准，先只放底层(j恒为0)，保证不叠、不倒，分拣对就给分。</p>

<h3>L5 · 关联</h3>
<p>依赖模块2的 move() 执行落点动作，依赖分类模块发来的种类名。是"分拣正确率"的大脑。</p>
<h3>📌 一句话总纲</h3>
<p class="soul">码垛=用计数器算格子：index定类别、k定垛、j定层；sampleClss必须和模型类别名一字不差，否则全盘崩。</p>
</div>
`,

/* ============================ 模块4：下料机TCP服务端 ============================ */
tcp_s: `
<div class="story">
<p class="scene">现在有4个程序要协同：下料臂、上料臂、视觉、分类。它们怎么互相喊话？靠 TCP——一种程序间打电话的方式。而下料机，是那个<b>接线总机</b>：它开一个 8081 号总机，等其他三个打进来，每来一个就派一个接线员(线程)专门跟它对话。这是整个系统的中枢神经。</p>

<h3>L1 · 为什么下料机当"总机"？</h3>
<p>像一个调度室：所有分机都打给总台，总台统一指挥。下料机掌握全局(放了几件、该不该继续)，所以由它当服务端最合理。</p>
<table class="tbl"><tr><th>层次</th><th>意图</th></tr>
<tr><td>学科意图</td><td>懂 TCP 服务端/客户端、多线程并发</td></tr>
<tr><td>工具意图</td><td>会用 socket 的 bind/listen/accept + Thread</td></tr>
<tr><td>产业意图</td><td>真实产线 MES 系统就是中央调度多设备</td></tr></table>
<blockquote><b>小白补课：什么是 TCP / 端口</b><br>
TCP 是两个程序之间稳定传字符串的"电话线"。端口(8081)就是电话号码。服务端先"装电话"等人打，客户端"拨号"连上，之后双向收发文字。</blockquote>

<h3>L2 · 本质：开总机 → 按顺序接3个分机 → 各派接线员</h3>
<pre class="code">socket_server = socket.socket(...)
socket_server.bind(("127.0.0.1", 8081))   <span class="cm"># 装8081号电话</span>
socket_server.listen(5)                     <span class="cm"># 开机待接</span>
sock1,_ = socket_server.accept()  <span class="cm"># 接第1个:视觉</span>
Thread(target=vision, args=(sock1,"视觉端")).start()
sock2,_ = socket_server.accept()  <span class="cm"># 接第2个:分类</span>
sock3,_ = socket_server.accept()  <span class="cm"># 接第3个:上料</span></pre>
<p>这段说的其实是——<b>"装总机→开机→按先后顺序接通视觉、分类、上料，每接通一个就派个接线员线程专职对话"</b>。真难点：<b>accept 是阻塞顺序的，谁先连就是 sock1</b>。所以启动顺序必须 视觉→分类→上料，错了线程就绑错对象。</p>

<h3>L3 · 收发的万能写法</h3>
<pre class="code">data = sock.recv(1024).decode("utf-8")   <span class="cm"># 收:必须decode</span>
sock.send("run".encode("utf-8"))         <span class="cm"># 发:必须encode</span></pre>
<p>记成口诀：<b>收要 decode，发要 encode，都带 utf-8</b>。漏 encode 是最高频低级错误。</p>

<h3>L4 · 拿分与翻车</h3>
<table class="tbl"><tr><th>坑</th><th>解法</th></tr>
<tr><td>启动顺序错</td><td>下料先开→视觉→分类→上料</td></tr>
<tr><td>send 没 encode</td><td>"x".encode("utf-8")</td></tr>
<tr><td>端口写错</td><td>统一 8081</td></tr></table>
<p><b>降级</b>：联调连不上时，用"TCP调试助手"先手动测 8081 通不通，排除是不是防火墙/端口问题。</p>

<h3>L5 · 关联</h3>
<p>它是模块5(上料客户端)、分类、视觉的对接对象。所有信号(run/arrive1/getphoto)都从这里中转。<b>背熟 bind/listen/accept 四步 + 收发写法。</b></p>
<h3>📌 一句话总纲</h3>
<p class="soul">下料机是8081总机：bind→listen→accept(视觉→分类→上料顺序)→每个派线程；收decode发encode，顺序错则全乱。</p>
</div>
`,

/* ============================ 模块5：上料机TCP客户端 ============================ */
tcp_c: `
<div class="story">
<p class="scene">上料臂是流水线的起点：它从码垛区一件件取料，送到 RFID 读卡位，再送上传送带。但它不能自己乱动——必须等总机(下料机)喊一声"run"才取一件。它是个<b>听指挥的客户端</b>。</p>

<h3>L1 · 为什么要"等指令才动"？</h3>
<p>像流水线工人：不是看到料就抓，而是等节拍器响一下做一个动作，保证整条线同步。下料机发"run"就是节拍器。</p>
<table class="tbl"><tr><th>层次</th><th>意图</th></tr>
<tr><td>学科意图</td><td>懂客户端 connect + 事件驱动循环</td></tr>
<tr><td>工具意图</td><td>会用 socket.connect + 传送带电机 + 光电传感器</td></tr>
<tr><td>产业意图</td><td>真实上料机构就是按节拍取料、靠传感器确认到位</td></tr></table>

<h3>L2 · 本质：收run→取料→报告→等回应→送带→等传感器</h3>
<pre class="code">socket_client.connect(("127.0.0.1", 8081))  <span class="cm"># 拨号连总机</span>
while True:
    data = recv().decode()
    if data != "run": continue   <span class="cm"># 不是run就跳过</span>
    取料 → 放RFID位 → send("arrive1")
    等到收到 "OK"
    取回 → 放传送带 → 开传送带
    while 传感器没检测到料: 继续等
    停传送带 → send("arrive2")</pre>
<p>这段说的其实是——<b>"连上总机，只在听到run时取一件料，每完成一步就报告到位信号(arrive1/arrive2)，并用光电传感器确认料真的到了传送带末端"</b>。</p>
<blockquote><b>小白补课：光电传感器</b><br>对射式光电开关，料挡住光就返回1。代码里 <code>GetInfraredSensor(api,1)</code> 的 i[0]==1 表示"料到了"。</blockquote>

<h3>L3 · 传送带与传感器代码</h3>
<pre class="code">dType.SetEMotor(api, 0, 1, 10000, 1)   <span class="cm"># 开带(使能1,速度10000)</span>
while True:
    i = dType.GetInfraredSensor(api, 1)
    if i[0] == 1: break                  <span class="cm"># 料到位</span>
dType.SetEMotor(api, 0, 0, -10000, 1)  <span class="cm"># 停带</span></pre>

<h3>L4 · 拿分与翻车</h3>
<table class="tbl"><tr><th>坑</th><th>解法</th></tr>
<tr><td>信号名写错(arrive1/2)</td><td>对照下料机的判断字符串</td></tr>
<tr><td>传感器没初始化</td><td>开头 SetInfraredSensor(api,1,1)</td></tr>
<tr><td>料冲出传送带</td><td>检测到立刻停带</td></tr></table>
<p><b>降级</b>：传感器不灵就改用固定延时(time.sleep)代替检测，虽不精确但能跑通流程。</p>

<h3>L5 · 关联</h3>
<p>它向模块4(服务端)发 arrive1/arrive2，触发视觉拍照。和下料机是一对收发搭档。<b>初始化、move() 都复用前面模块。</b></p>
<h3>📌 一句话总纲</h3>
<p class="soul">上料机是听话的客户端：connect 8081，只在收run时取一件，每步报arrive信号，靠光电传感器确认到位再停带。</p>
</div>
`,

/* ============================ 模块6：深度学习分类 ============================ */
cls: `
<div class="story">
<p class="scene">料到了传送带末端，相机咔嚓拍了一张照。现在的问题是：<b>这到底是哪一类物料？</b> 这不是数边数、看颜色能解决的——物料是华为手机、火腿、童装、考古图录这种真实物品。靠的是一个提前训练好的<b>ResNet18 神经网络</b>，看一眼图就报出类别。这是整个系统的"眼睛+大脑"。</p>

<h3>L1 · 为什么用深度学习，不用OpenCV数形状？</h3>
<p>因为物料不是圆方三角，是真实商品。让程序"认出这是手机还是火腿"，传统图像处理无能为力，必须靠神经网络从大量照片里"学"出特征。</p>
<table class="tbl"><tr><th>层次</th><th>意图</th></tr>
<tr><td>学科意图</td><td>懂深度学习推理流程(预处理→模型→输出类别)</td></tr>
<tr><td>工具意图</td><td>会用 ResNet18 + predict 调用训练好的模型</td></tr>
<tr><td>产业意图</td><td>真实质检/分拣大量用CNN图像分类</td></tr></table>
<blockquote><b>小白补课：什么是 ResNet18 / 推理</b><br>ResNet18 是一个经典的图像分类神经网络。"训练"是用很多带标签的图教它认物(train.py干的)；"推理"(predict)是用训好的模型对新图判类别。本赛模型可能已训好，你主要负责调用。</blockquote>

<h3>L2 · 本质：读图→预处理→模型→返回(种类,编号,置信度)</h3>
<pre class="code">img = cv2.imread("img.bmp")        <span class="cm"># 读视觉拍的图</span>
result = predict(img)               <span class="cm"># ResNet18推理</span>
if result == 0: continue            <span class="cm"># 识别失败跳过</span>
种类 = result[0]                    <span class="cm"># result[0]=种类名</span>
socket_client.send(result[0].encode("utf-8"))  <span class="cm"># 发给下料机</span></pre>
<p>这段说的其实是——<b>"把相机拍的图喂给神经网络，它吐出种类名，再把种类名发给下料机去分拣"</b>。</p>
<div class="warn">现场版埋了bug：<code>if result==0</code> 缩进跑到了 while 外面，要缩回循环内。这是故意的改错考点。</div>

<h3>L3 · 现场落地：先拷文件，再验证模型</h3>
<table class="tbl"><tr><th>动作</th><th>说明</th></tr>
<tr><td>拷3文件</td><td>RFID.py/read_card_text.py/comPro64.dll → 本目录</td></tr>
<tr><td>验证置信度</td><td>predict返回的result[2]&gt;0.7才可靠</td></tr>
<tr><td>必要时重训</td><td>createTrainPhoto→train，每类≥2图、迭代~50</td></tr></table>

<h3>L4 · 拿分与翻车</h3>
<table class="tbl"><tr><th>坑</th><th>解法</th></tr>
<tr><td>缩进bug</td><td>if result==0 缩回while内</td></tr>
<tr><td>缺import文件</td><td>从RFID64bit拷3个文件</td></tr>
<tr><td>识别率低</td><td>调光照/重拍/重训</td></tr></table>
<p><b>降级</b>：模型识别不准又没时间重训→用默认模型 + 优化光照和拍照角度，保证认对几类拿基础分。</p>

<h3>L5 · 关联</h3>
<p>它是客户端(连8081)，把种类名发给模块4，模块3用这个名字算落点。识别准不准直接决定分拣正确率。</p>
<h3>📌 一句话总纲</h3>
<p class="soul">分类=ResNet18看图报类别：读img.bmp→predict→发result[0]种类给下料机；现场先拷3文件、修缩进bug，是深度学习不是数形状。</p>
</div>
`,

/* ============================ 模块7：RFID与文件拷贝 ============================ */
rfid: `
<div class="story">
<p class="scene">每件物料背面贴着一张芯片卡(RFID)，里面写着"广东省;1天"这种产地和时效信息。读卡器一刷，就能读出来。这块代码负责<b>读卡 → 解码 → 把信息交给分类程序显示</b>。它不难，但藏着一个现场最容易翻车的细节：<b>3个文件没拷，分类程序根本启动不了。</b></p>

<h3>L1 · 为什么要读RFID？</h3>
<p>像超市扫条码：商品图案告诉你"是什么"，条码告诉你"产地、批次"。RFID 就是物料的电子身份证，补充图像识别给不出的信息(省份、运输时间)。</p>
<table class="tbl"><tr><th>层次</th><th>意图</th></tr>
<tr><td>学科意图</td><td>懂调用硬件DLL读卡、文件间数据传递(json)</td></tr>
<tr><td>工具意图</td><td>会用 comPro64.dll 读M1卡、split解析文本</td></tr>
<tr><td>产业意图</td><td>真实物流用RFID追溯产地批次</td></tr></table>

<h3>L2 · 本质：读卡写json，分类程序读json</h3>
<pre class="code"><span class="cm"># RFID.py: 读块1→写card_result.json</span>
<span class="cm"># 分类main.py:</span>
from read_card_text import get_decoded_text
code = get_decoded_text()          <span class="cm"># 读出"广东省;1天"</span>
产地 = code.split(";")[0]
时间 = code.split(";")[1]</pre>
<p>这段说的其实是——<b>"读卡程序把信息写进一个json小文件，分类程序再从这个文件读出来，按分号拆成产地和时间"</b>。两个程序通过一个json文件传话。</p>

<h3>L3 · 现场第一步：拷文件！</h3>
<div class="warn">现场版"深度学习分类"文件夹<b>缺3个文件</b>：RFID.py、read_card_text.py、comPro64.dll。必须从 RFID64bit/ 拷过来，否则分类程序 import 就报错，整条线起不来。<b>这是开赛第一个动作。</b></div>
<table class="tbl"><tr><th>参数</th><th>值</th><th>说明</th></tr>
<tr><td>读取块号</td><td>1</td><td>数据写在块1</td></tr>
<tr><td>默认密钥</td><td>12个F</td><td>MIFARE出厂默认,一般不改</td></tr></table>

<h3>L4 · 拿分与翻车</h3>
<table class="tbl"><tr><th>坑</th><th>解法</th></tr>
<tr><td>没拷3文件</td><td>分类import报错→先拷</td></tr>
<tr><td>RFID端口占用</td><td>拔插USB,保持RFID.py运行</td></tr>
<tr><td>读出乱码</td><td>确认读块1、密钥全F</td></tr></table>
<p><b>降级</b>：RFID 读不出也别卡死——它主要影响"显示产地时间"，不影响核心的分类抓放。先保证分拣跑通，RFID 作为加分。</p>

<h3>L5 · 关联</h3>
<p>给模块6(分类)提供产地时间信息。是相对独立的辅助模块，但"拷文件"这步是分类能跑的前提。</p>
<h3>📌 一句话总纲</h3>
<p class="soul">RFID=物料电子身份证：读块1(密钥全F)写json，分类程序split读出"产地;时间"；现场第一步必须拷3个文件到分类目录，否则起不来。</p>
</div>
`,

};
