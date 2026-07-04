/* ========================================================================
   叙事化五层拆解 —— 每个模块一篇"啊原来如此"的长讲解
   配合 drill-data.js 的刷题使用：刷题看 STUDY(短提示)，理解看 STORY(长叙事)
   五层结构：L1动机 / L2本质 / L3方案 / L4拿分 / L5关联
   ======================================================================== */

const STORY = {

/* ============================ 模块1：连接+初始化 ============================ */
conn: `
<div class="story">

<p class="scene">早上 8 点，你双击打开 <code>下料机器臂/Main.py</code>，光标停在第一行。接下来这十几行代码，是整个程序的开头，它们必须<b>按这个顺序一行一行往下写</b>——不是随便排的。这一篇我们不绕弯，就<b>跟着代码从上往下走一遍</b>，每写一行，都问自己一句："为什么是现在写它？能不能挪到别处？"把这条因果链想通了，你不用背，顺着逻辑就能默写出来。</p>

<h3>核心心法：代码顺序 = 做事的先后顺序</h3>
<p>这段代码的顺序，和你<b>开一辆陌生车</b>的顺序一模一样：拿到钥匙 → 插钥匙通电 → 看仪表盘 → 清报警灯 → 调好座椅后视镜 → 挂挡 → 起步。每一步都依赖上一步做完。代码也是：<b>后一行用到的东西，必须前一行先准备好。</b>记住这条，顺序就不用硬背了。</p>

<h3>逐行精讲：跟着光标往下走</h3>

<p><b>第1行 —— 先把"翻译官"请进来</b></p>
<pre class="code">api = dType.load()</pre>
<p>为什么这行必须第一个？因为 <code>api</code> 是后面<b>每一行都要用</b>的东西。你看后面 <code>ConnectDobot(api,...)</code>、<code>SetHOMECmd(api,...)</code>，括号里第一个参数全是 api。它就像车钥匙——没拿到钥匙，后面通电、起步全都无从谈起。<b>所以它天经地义排第一。</b></p>
<blockquote><b>小白补课：api 是什么</b><br>load() 把厂家的驱动包(DobotDll.dll)装进来，返回一个"操作句柄"存到 api。之后你对机械臂下的每一条命令，都要把这个 api 递进去，相当于"凭这把钥匙说话"。</blockquote>

<p><b>第2行 —— 有了钥匙，插进去通电（连接）</b></p>
<pre class="code">state = dType.ConnectDobot(api, "COM6", 115200)[0]</pre>
<p>为什么紧接着是连接？因为光有钥匙(api)不够，得真正<b>接通那条物理的机械臂</b>。这行就是"插钥匙拧一下"。它用到了第1行的 api——<b>看，第2行依赖第1行，顺序不能反。</b></p>
<p>这一行里三个值，从左到右理解：<code>api</code>(凭哪把钥匙)、<code>"COM6"</code>(连哪个串口，<b>现场要改</b>)、<code>115200</code>(通信速率，固定值)。结尾的 <code>[0]</code> 是这一行最容易漏的——ConnectDobot 会吐回来一串信息，<b>第 0 个</b>才是我们要的"连接状态码"，所以加 [0] 把它单独取出来存进 state。<b>记法：连接必带尾巴 [0]。</b></p>

<p><b>第3行 —— 通电了，看一眼仪表盘亮没亮（打印状态）</b></p>
<pre class="code">print("连接状态:", ["已连接","未找到设备","端口占用"][state])</pre>
<p>为什么要紧跟一行打印？因为你得<b>立刻知道上一步成没成</b>，别等跑到一半才发现根本没连上。这行的巧妙在于：state 的值正好是 0/1/2，而列表 <code>["已连接","未找到设备","端口占用"]</code> 的下标也是 0/1/2。<code>[state]</code> 就是拿状态码当下标去取对应的中文。state=0 取到"已连接"，=1 取到"未找到设备"。<b>它直接用了第2行的 state——又是一环扣一环。</b></p>

<p><b>第4行 —— 起步前，先清掉上一局的报警</b></p>
<pre class="code">dType.ClearAllAlarmsState(api)</pre>
<p>为什么连上之后第一件事是清报警？因为上一个队伍比完赛、或者上次急停，机械臂可能还<b>亮着报警灯罢工</b>。不清掉，后面发的所有动作它都不理。就像车上回有人留了个故障码，你得先按掉。<b>这一步是"让它愿意听话"的前提。</b></p>

<p><b>第5行 —— 告诉它"抓东西时抬多高"</b></p>
<pre class="code">dType.SetPTPJumpParams(api, 100, 110, isQueued=1)</pre>
<p>为什么现在设这个？因为这是在<b>提前定规矩</b>：之后机械臂做"门字形"抓放(先抬高再平移)时，抬升高度用这里设的 100。先把规矩立好，后面动作才有依据。</p>

<p><b>第6行 —— 告诉它"端上装的是什么传感器"</b></p>
<pre class="code">dType.SetInfraredSensor(api, 1, 2, version=1)</pre>
<p>继续定规矩：启用光电传感器。这里的第3个参数，<b>下料机是 2、上料机是 1</b>(端口不同，别记反)。</p>

<p><b>第7行 —— 告诉它"手是夹爪，不是吸盘"</b></p>
<pre class="code">dType.SetEndEffectorParams(api, 59.7, 0, 0, 1)</pre>
<p>为什么要专门声明末端？因为机械臂得知道自己手上装的是夹爪(长 59.7mm)，才能算准抓取位置。最后那个 <code>1</code> 代表夹爪类型。<b>本赛是夹爪，这点贯穿全程，记死。</b></p>

<p><b>第8、9行 —— 倒空旧任务，然后开闸</b></p>
<pre class="code">dType.SetQueuedCmdClear(api)       <span class="cm"># 先清空指令队列</span>
dType.SetQueuedCmdStartExec(api)   <span class="cm"># 再启动队列执行</span></pre>
<p>这两行必须<b>成对、按这个先后</b>出现，这是全篇最需要理解的地方：</p>
<blockquote><b>小白补课：Dobot 的"队列"机制（理解了顺序就全通了）</b><br>
Dobot 有个反直觉的设计：你喊它"移动"，它<b>不立刻动</b>，而是把命令排进一条队列里。等你喊一声"开始执行"(StartExec)，它才照队列一条条做。就像奶茶店：点单(发命令)≠马上拿到，要排队叫号(执行)。<br>
所以这里：<b>先 Clear 把上一局残留的旧命令倒干净，再 StartExec 打开开关放行</b>。顺序反了——先开闸再清空——就可能把刚要执行的命令也清掉，乱套。</blockquote>

<p><b>第10行 —— 摆好初始手势：夹爪先张开</b></p>
<pre class="code">dType.SetEndEffectorGripper(api, 0, 0, isQueued=1)</pre>
<p>为什么放在 StartExec 之后？因为这是<b>真正的第一个动作命令</b>了，要进队列被执行，所以得等开闸之后发。张开夹爪是为待会儿抓料做准备——总不能攥着拳头去抓东西。</p>

<p><b>第11行 —— 回机械原点，找准坐标基准</b></p>
<pre class="code">dType.SetHOMECmd(api, 1, isQueued=1)</pre>
<p>为什么初始化最后一步是回零？因为后面所有的 P 点坐标，都是<b>相对机械原点</b>算的。不先回零，机械臂不知道"零在哪"，坐标全是错的。这是"调好后视镜、校准基准"的收尾动作，做完它，机械臂才真正准备好干活。</p>

<h3>把整条链连起来（这就是你要背的顺序）</h3>
<p>请大声念一遍这条因果链，你会发现顺序是<b>推出来的，不是背出来的</b>：</p>
<pre class="code">拿钥匙(load)
→ 通电连接(Connect，带[0])      <span class="cm"># 要用钥匙</span>
→ 看仪表盘(print)               <span class="cm"># 要用连接结果</span>
→ 清报警(ClearAlarms)           <span class="cm"># 让它愿意听话</span>
→ 定规矩(跳跃高度/传感器/夹爪)   <span class="cm"># 动作前先立规矩</span>
→ 清队列+开闸(Clear→StartExec)  <span class="cm"># 倒空再放行</span>
→ 张夹爪(Gripper)               <span class="cm"># 第一个动作:摆姿势</span>
→ 回零(HOME)                    <span class="cm"># 校准基准,准备干活</span></pre>
<p>每一步都因为"上一步做完了、这一步才有条件做"而排在这里。<b>顺着这条因果链，你就能一行行默写出来。</b></p>

<h3>现场必改 & 救命提示</h3>
<table class="tbl">
<tr><th>必改项</th><th>怎么定</th><th>改错后果</th></tr>
<tr><td>"COM6"</td><td>设备管理器→端口(COM)看实际号</td><td>连不上，state=1</td></tr>
<tr><td>传感器第3参</td><td>下料=2，上料=1</td><td>读不到料</td></tr>
</table>
<p><b>翻车救命</b>：连不上时按顺序救——①拔插 USB ②设备管理器确认 COM 号 ③用 DobotStudio 试连(能连说明代码 COM 写错，不能连说明是硬件问题，报告裁判)。</p>

<h3>📌 一句话总纲</h3>
<p class="soul">初始化的顺序不是背的，是推的：每一行都因为"前一行准备好了"才轮到它——拿钥匙→通电→看状态→清报警→定规矩→清队列开闸→张爪→回零。理解这条因果链，就能一行行默写。</p>

</div>
`,

/* ============================ 模块2：move() 抓放 ============================ */
move: `
<div class="story">

<p class="scene">机械臂通电站好了，但它现在像个发呆的人——你得教它"伸手把一块料抓起来、搬过去、放下"。这套动作在整个程序里要重复几十次，所以代码把它打包成一个函数 <code>move()</code>。这一篇我们还是<b>跟着函数体从上往下走一遍</b>，每写一行都问："为什么是这个顺序？换一下会怎样？"把这条动作链想通，你闭着眼也能默写出来。</p>

<h3>核心心法：move 是"门"字形，不是直线</h3>
<p>为什么机械臂抓东西不走直线、非要绕个"门"字？因为桌上摆着别的料，斜着冲过去会撞翻一片。正确的安全套路永远是：<b>先升到目标正上方 → 垂直落下 → 在底部动夹爪 → 垂直升回去</b>。全程只有两条垂直线，绝不蹭到旁边。记住这个"门"字形状，下面每一行就都是它的一笔。</p>

<h3>逐行精讲：跟着光标往下走</h3>

<p><b>函数头 —— 先约定好"搬"需要哪些信息</b></p>
<pre class="code">def move(x, y, z, r, air1, air2, keep):</pre>
<p>一个"搬"的动作，得先告诉它三件事：<b>搬到哪</b>(x,y,z,r 坐标)、<b>到之前夹爪什么状态</b>(air1)、<b>到了之后夹爪怎么动</b>(air2)、<b>搬完要不要继续夹着</b>(keep)。这7个参数就是"搬"字的全部说明书。理解了它们，下面的函数体只是按顺序使用这几个参数而已。</p>

<p><b>第1行 —— 进门前先摆好手势</b></p>
<pre class="code">    dType.SetEndEffectorGripper(api, 1, air1, isQueued=1)</pre>
<p>为什么第一步是动夹爪、还没移动？因为你得<b>在出发前就把手势摆对</b>。去抓料前要张开(air1=0)，去放料前手里夹着东西(air1=1)。先定好手势，移过去才不别扭。</p>

<p><b>第2行 —— 先飞到目标"正上方"</b></p>
<pre class="code">    dType.SetPTPCmdEx(api, 1, x, y, z + 20, r, isQueued=1)</pre>
<p>注意这行的高度是 <code>z + 20</code>，不是 z——它先到目标<b>上方20mm</b>，悬停。为什么不直接到落点？这就是"门"字的左上角：<b>先到头顶，避免斜着撞料</b>。这一行依赖上一行(手势已摆好)，顺序不能反。</p>

<p><b>第3行 —— 垂直落到目标点</b></p>
<pre class="code">    dType.SetPTPCmdEx(api, 1, x, y, z, r, isQueued=1)</pre>
<p>高度从 z+20 变成 z，<b>垂直下落</b>到真正的落点。因为上一行已经把 x,y 对准了，这一行只改高度，所以是一条干净的竖线，不会蹭到旁边。门字形的左半边走完了。</p>

<p><b>第4行 —— 到底了，才真正抓住或松开</b></p>
<pre class="code">    dType.SetEndEffectorGripper(api, air2, 1, isQueued=1)</pre>
<p>这是<b>整个函数的关键一行</b>：到了落点，用 air2 决定干什么——<b>air2=1 夹住(抓料)，air2=0 张开(放料)</b>。同一个 move 函数，靠 air2 这一个开关，既能当"抓"又能当"放"。</p>

<p><b>第5行 —— 停一下，等夹爪夹稳</b></p>
<pre class="code">    dType.dSleep(1000)</pre>
<p>为什么动完夹爪不马上抬走？因为夹爪闭合是<b>物理动作，需要时间</b>。不等就抬，料还没夹牢就掉了。这1秒(下料版1000ms)是用分拣正确率换来的，省不得。</p>

<p><b>第6行 —— 垂直抬回上方</b></p>
<pre class="code">    dType.SetPTPCmdEx(api, 1, x, y, z + 20, r, isQueued=1)</pre>
<p>又回到 z+20。和第2行一模一样的位置——这是门字的右半边：<b>抓着料垂直升起来</b>，再去别处。这样升空后再平移，不会拖着料蹭到桌面或别的料。</p>

<p><b>最后两行 —— 该不该松手？</b></p>
<pre class="code">    if keep == 0:
        dType.SetEndEffectorGripper(api, 0, air1, isQueued=1)</pre>
<p>keep 是"搬完之后"的善后开关：<b>keep=1 夹着不松</b>(因为还要搬去下一个点，比如从料堆夹起来要送去RFID位)；<b>keep=0 松开</b>(已经放到位了，松手收工)。</p>

<h3>把整条动作链连起来（这就是你要背的顺序）</h3>
<pre class="code">摆手势(air1)
→ 飞到上方z+20      <span class="cm"># 先到头顶,防斜撞</span>
→ 垂直落到z         <span class="cm"># 干净的竖线下去</span>
→ 动夹爪(air2)      <span class="cm"># 抓或放,关键一步</span>
→ 等1秒夹稳         <span class="cm"># 物理动作要时间</span>
→ 垂直抬回z+20      <span class="cm"># 升空再走</span>
→ keep=0则松手</pre>
<p>每一行都因为"门字形 + 先夹稳再移动"的物理常识而排在这里。<b>顺着这个"上→下→动爪→等→上"的门字，你就能默写出来。</b></p>

<h3>现场必改 & 救命提示</h3>
<table class="tbl">
<tr><th>差异点</th><th>上料版</th><th>下料版</th></tr>
<tr><td>抬升高度</td><td>z+50(料堆高)</td><td>z+20</td></tr>
<tr><td>dSleep</td><td>100ms</td><td>1000ms</td></tr>
</table>
<div class="warn">致命点：末端是<b>夹爪 SetEndEffectorGripper</b>，不是吸盘！运动指令用 <b>SetPTPCmdEx</b>。夹不稳就把 dSleep 调大、抬升调高，宁慢求稳。</div>

<h3>📌 一句话总纲</h3>
<p class="soul">move() 的顺序是门字形推出来的：摆手势→飞到上方→垂直落下→动夹爪→等夹稳→垂直抬起→看keep松不松手。关键是 air2 那一行(抓还是放)，和"夹完必等 dSleep 再抬"。</p>
</div>
`,

/* ============================ 模块3：坐标与码垛 ============================ */
coord: `
<div class="story">

<p class="scene">认货大脑打电话来报："这件是1号料。"包工头要把它放进1号区。可是1号区已经放过一件了，这件该叠上去？还是放旁边？到第8件呢？如果给每件都手写坐标，那是一堆数字噩梦。案例程序只用几行算式，就让机械臂<b>自己算出该放哪个格子、哪一层</b>。这一篇跟着这几行算式走一遍，看它是怎么"算"出位置的。</p>

<h3>核心心法：不记位置，只记"放过几件"</h3>
<p>快递分拣员脑子里没有给每个包裹定永久车位，他只有一条规则——"同省的堆一格，满了往上摞"。机械臂也一样：它只用一个计数器记住<b>"每类放过几件"</b>，再用这个数字推算出下一件该去哪。理解了"<b>用计数器代替记忆</b>"，下面每一行就都顺了。</p>

<h3>逐行精讲：跟着算式往下走</h3>

<p><b>第1行 —— 把种类名翻译成编号</b></p>
<pre class="code">index = sampleClss.index(str(data))</pre>
<p>大脑发来的是文字(比如"1.jqr")，但坐标表是按 0/1/2/3 编号存的。这行<b>先把文字名翻译成数字下标</b>，后面才能拿这个数字去查坐标。它是整段的入口——没有这个 index，后面全部无从下手。</p>
<div class="warn">头号杀手：如果 data 的名字在 sampleClss 里<b>找不到</b>(差一个空格、大小写不同、主题没改)，这行直接 ValueError 崩溃，整个程序当场死。开赛第一件事就是逐字核对 sampleClss！</div>

<p><b>第2行 —— 先去把料抓起来</b></p>
<pre class="code">move(P6[0], P6[1], P6[2], P6[3], 0, 1, 1)</pre>
<p>知道是什么料之后，第一个动作是<b>跑到固定的抓取点 P6 把它夹起来</b>。注意这里直接复用了模块2的 move——参数 <code>0,1,1</code> 表示"张开进、夹住、夹着不松"(因为还要搬去放置点)。看，move 一写好，这里一行就调用了。</p>

<p><b>第3行 —— 算该放第几垛</b></p>
<pre class="code">k = 0 if add_up[index] < 2 else 1</pre>
<p>现在开始算位置。<code>add_up[index]</code> 是"这类已经放了几件"。规则：<b>已放不到2件 → 放第1垛(k=0)，否则 → 第2垛(k=1)</b>。为什么是2？因为每类总共放2件、分2个垛位，所以满2件就换垛。</p>

<p><b>第4行 —— 算该放第几层</b></p>
<pre class="code">j = add_up[index] % 2</pre>
<p><code>% 2</code> 是取余数：放过的件数是<b>偶数(0,2)→余0→底层，奇数(1,3)→余1→上层</b>。这样同一垛的两件，一件底层一件上层，自动叠起来。取模就是制造"交替"效果的经典手法。</p>

<p><b>第5行 —— 上层要抬高一点</b></p>
<pre class="code">delta_z = j * 10</pre>
<p>承接上一行算出的 j：<b>j=1(上层)就抬高10mm，j=0(底层)就不动</b>。这个高度差就是为了把第二件稳稳叠在第一件上面。</p>

<p><b>第6组行 —— 从坐标表取出最终落点</b></p>
<pre class="code">x = int(P3[index][k][0])
y = int(P3[index][k][1])
z = int(P3[index][k][2] + delta_z)
r = int(P3[index][k][3])</pre>
<p>P3 是个"列表套列表"：<code>P3[index]</code> 先选哪一类，<code>[k]</code> 再选哪个垛，得到一个 [x,y,z,r] 坐标。注意 z 那行<b>加上了刚算的 delta_z</b>——这就是上层抬高10mm的落地。前面算的 index、k、j 在这里全部派上用场。</p>

<p><b>第7行 —— 放完了，计数加一</b></p>
<pre class="code">add_up[index] += 1</pre>
<p>这一行最容易被忽略，但<b>少了它整个算法就废了</b>：放完一件必须把计数+1，下一件同类料才知道"哦已经放过一件了，我该去上层/换垛了"。这是计数器能持续工作的关键。</p>

<p><b>第8行 —— 调 move 把料放下去</b></p>
<pre class="code">move(x, y, z, r, 1, 0, 0)</pre>
<p>坐标算好了，又一次复用 move——参数 <code>1,0,0</code> 表示"夹着进、松开、不保持"，正好是"放料"。和第2行的抓料 <code>0,1,1</code> 对照着看，你就彻底懂 air1/air2/keep 了。</p>

<h3>把整条算式链连起来</h3>
<pre class="code">种类名→编号(index)
→ 先抓料(move 0,1,1)
→ 算垛 k (<2?)
→ 算层 j (%2)
→ 上层抬高 delta_z
→ 查坐标表 P3[index][k]
→ 计数+1          <span class="cm"># 别忘!</span>
→ 放料(move 1,0,0)</pre>
<p>每一步都依赖前一步的结果：没编号查不了表，没算层定不了高度，没计数下一件就乱。<b>顺着"翻译→抓→算垛→算层→查表→计数→放"这条链，就能复述出来。</b></p>

<h3>现场必改 & 降级</h3>
<table class="tbl">
<tr><th>必改</th><th>怎么定</th><th>错了会</th></tr>
<tr><td>sampleClss</td><td>和模型类别名一字不差</td><td>index() 崩溃</td></tr>
<tr><td>P3 坐标</td><td>现场示教4类放置点</td><td>放到桌外</td></tr>
</table>
<p><b>降级方案</b>：如果叠层老出问题(压坏、倒)，把 j 强制设0(全放底层)，每类只用一个点。摆得不好看，但"分拣到正确区域"的核心分照样拿。先保正确，再求美观。</p>

<h3>📌 一句话总纲</h3>
<p class="soul">码垛 = 用计数器算格子：index 翻译类别、k 算垛(&lt;2)、j 算层(%2)、查 P3 取坐标、计数+1、调 move 放下。头号杀手是 sampleClss 和模型名对不上导致 index() 崩溃。</p>
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
<div class="warn">考卷推测点：案例程序本身缩进是<b>正确</b>的；但比赛"考卷版"可能故意把 <code>if result==0</code> 缩进移到 while 外面让它失效，遇到就缩回循环内。</div>

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
<p class="soul">分类=ResNet18看图报类别：读img.bmp→predict→发result[0]种类给下料机；考卷可能埋"缺文件/缩进"考点(案例本身正常)，本质是深度学习不是数形状。</p>
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

<h3>L3 · 现场第一步：确认依赖文件！</h3>
<div class="warn">分类程序 import 了 read_card_text，读卡又依赖 comPro64.dll。<b>案例程序的"深度学习分类"目录里这3个文件(RFID.py、read_card_text.py、comPro64.dll)已经带了</b>；但比赛"考卷版"若被删，import 就会报错、整条线起不来。<b>开赛先检查：缺了就从 RFID64bit/ 拷过来。</b></div>
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
<p class="soul">RFID=物料电子身份证：读块1(密钥全F)写json，分类程序split读出"产地;时间"；案例已带这3个文件，考卷若缺则从RFID64bit拷到分类目录。</p>
</div>
`,

/* ============================ 模块8：视觉系统 ============================ */
vision: `
<div class="story">
<p class="scene">前面七块都是Python代码，唯独这一块不一样——视觉系统是在一个<b>图形化软件</b>里点出来的，不写一行Python。它叫 DobotVisionStudio(多功能机器视觉软件3.1.6)，工程文件是 <code>40307.poj</code>。它是机械臂的"眼睛"：拍照、读编号、把图存下来给深度学习用。很多人备赛只啃代码，忘了它，结果联调时整条线卡在"视觉连不上"。</p>

<h3>L1 · 为什么需要一个独立的视觉软件？</h3>
<p>因为工业相机(海康)的取图、对焦、找码、TCP通信，用现成软件配置比自己写快得多、稳得多。它专门干一件事：<b>该拍的时候拍，拍完把结果(编号/图片)交出去。</b></p>
<table class="tbl"><tr><th>层次</th><th>意图</th></tr>
<tr><td>学科意图</td><td>懂机器视觉流程(触发→采图→识别→输出)</td></tr>
<tr><td>工具意图</td><td>会用DobotVisionStudio配TCP、配拍照流程、存图</td></tr>
<tr><td>产业意图</td><td>真实产线视觉检测就是这套软件化方案</td></tr></table>

<h3>L2 · 本质：它是TCP第1个客户端，听信号拍照</h3>
<p>下料机是服务端，<b>视觉是第一个连上来的客户端(sock1)</b>。所以启动顺序里它排第二：下料(服务端)→<b>视觉</b>→分类→上料。连错顺序，下料机的 vision() 线程就绑错了对象，全乱。</p>
<pre class="code">收 "getphoto1" → 拍RFID面,识别出编号 "M00X" → 发回下料机
收 "getphoto2" → 拍物料本体 → 存成 ./img.bmp(给分类predict用)</pre>
<p>这段说的其实是——<b>"视觉只在被叫到时拍照：第一次拍读出编号，第二次拍存下供识别的图"</b>。它和分类程序的约定就是那个固定文件名 <code>img.bmp</code>。</p>

<h3>L3 · 它在信号流里的位置</h3>
<pre class="code">上料到位→arrive1→下料发getphoto1→视觉读M00X→发给下料→下料回OK
传送带到位→arrive2→下料等5秒发getphoto2→视觉拍本体存img.bmp→分类predict</pre>
<blockquote><b>小白补课：为什么拍两次</b><br>第一次(getphoto1)拍的是物料RFID面/编号，确认是哪一件(M001~M008)；第二次(getphoto2)拍物料正面本体，这张才是丢给ResNet18认类别的图。两次拍照、两个用途。</blockquote>

<h3>L4 · 现场操作要点(在软件里点，不是写代码)</h3>
<table class="tbl"><tr><th>要点</th><th>说明</th></tr>
<tr><td>TCP模块</td><td>客户端模式，连 127.0.0.1:8081</td></tr>
<tr><td>拍照流程</td><td>getphoto1读编号、getphoto2存img.bmp</td></tr>
<tr><td>USB口</td><td>必须插3.0蓝口，否则无图/卡顿</td></tr>
<tr><td>防崩溃</td><td>每改一步另存新文件名(40307_v1.poj…)</td></tr></table>
<div class="warn">视觉是最容易被忽视、又最容易卡场的一环：图模糊→调焦/调光；无图→换USB3.0；软件崩→参数错,用之前另存的版本。</div>

<h3>L5 · 关联</h3>
<p>它上承下料机的拍照指令(getphoto1/2)，下接分类程序的 img.bmp。是"识别"能发生的前提——没有它拍照存图，分类的 predict 根本没图可读。<b>备赛别只练代码，务必在软件里把 40307.poj 跑通一遍。</b></p>
<h3>📌 一句话总纲</h3>
<p class="soul">视觉=图形化软件配的"眼睛"(40307.poj)：TCP第1个客户端，收getphoto1读M编号、getphoto2存img.bmp；USB插3.0、改参数另存防崩，不写Python但绝不能漏。</p>
</div>
`,

};
