/* ========================================================================
   drill-global.js  —  全局叙事内容（四层镜头：产线→文件→段落→逐行）
   给"复刻文件"打字游戏用：让新手任何时候都知道"我在整件事的哪个位置"
   钩子词全程复用：搬运工/质检员/认货大脑/读卡器/分拣包工头/打电话
   ======================================================================== */

const GLOBAL = {

/* ───────────── 第一层镜头：进游戏看一次，整条产线的开场故事 ───────────── */
intro: `
<div class="story">
<h3>🏭 你的任务：复活一条自动分拣流水线</h3>

<p class="scene">想象一个快递分拣车间，但工人全是机器——而它们现在<b>断电沉睡</b>。比赛要你做的，就是把它们一个个唤醒、教会它们配合干活。教的方式，就是给每台机器写一份"工作说明书"，这份说明书就是代码。</p>

<p>车间里有 5 个角色，先认识它们（记住这些外号，后面全程都这么叫）：</p>
<table class="tbl">
<tr><th>外号</th><th>真名</th><th>它干的活</th></tr>
<tr><td>🦾 搬运工</td><td>上料机械臂</td><td>从料堆把货一件件送上传送带</td></tr>
<tr><td>📷 质检员</td><td>视觉相机</td><td>给货拍照</td></tr>
<tr><td>🧠 认货大脑</td><td>深度学习分类</td><td>看照片说"这是手机/食品/…"</td></tr>
<tr><td>🏷️ 读卡器</td><td>RFID</td><td>扫货的电子身份证，读出产地</td></tr>
<tr><td>🦾 分拣包工头</td><td>下料机械臂</td><td>听大脑指挥，把货抓进对应格子</td></tr>
</table>

<p>它们靠<b>"打电话"(TCP 网络)</b>互相喊话协作。比如搬运工把货送到位，就打电话告诉包工头"货到了"；包工头转头喊质检员"快拍照"。整条线就是这样你一句我一句配合起来的。</p>

<blockquote><b>为什么是"打电话"？</b><br>
5 个程序各自独立运行，互相看不见。TCP 就是它们之间的电话线：一个程序把一句话(比如 "run"、"arrive1")发出去，另一个程序就能收到。谁是总机、谁拨号，下料机那一关你会亲手搭起来。</blockquote>

<h3>🎯 你现在要写的第一份说明书</h3>
<p>是给 <b>🦾 分拣包工头（下料机械臂）</b> 的。为什么先写它？因为它是整条线的<b>总指挥</b>——其他四台机器都打电话向它汇报，它说"开始"大家才动。先把包工头立起来，整条线才有主心骨。</p>

<p class="soul">记住这个画面：你不是在敲一堆看不懂的代码，你是在<b>一台台唤醒沉睡的机器、教它们干活</b>。每写完一份说明书，就有一台机器活过来。</p>
</div>
`,

/* ───────────── 第二、三层：每个文件的角色卡 + 段落旁白 ───────────── */
files: {

  /* ===================== 下料机械臂 Main.py ===================== */
  xialiao: {
    name: '下料机器臂 / Main.py',
    roleCard: `
<div class="story">
<h3>📄 这份说明书：写给"🦾 分拣包工头"</h3>

<p class="scene">下料机械臂是整条线的<b>总指挥</b>。它干三件大事：①当电话总机，等其他机器打进来 ②听🧠认货大脑说"这是啥" ③指挥自己的胳膊，把货抓进正确的格子里。</p>

<p>这份说明书分 <b>4 段</b>，你会从空白文件开始，一段段把它写出来：</p>
<table class="tbl">
<tr><th>段</th><th>在干嘛</th><th>大白话</th></tr>
<tr><td>第1段</td><td>开机仪式</td><td>让包工头"活过来"，能动 ← 你现在在这</td></tr>
<tr><td>第2段</td><td>定义动作 move()</td><td>教它"怎么伸手抓、怎么放"</td></tr>
<tr><td>第3段</td><td>当电话总机</td><td>接通其他机器，变成指挥中枢</td></tr>
<tr><td>第4段</td><td>分拣大脑</td><td>收到货就算该放哪、然后放下去</td></tr>
</table>
<p>这 4 段写完，包工头就能正式上岗了。<b>每写完一段，上面地图就点亮一格——你随时知道还剩几段。</b></p>
</div>
`,
    segments: [
      {
        id: 'init',
        title: '第1段 · 开机仪式',
        lines: '约11行',
        intro: `
<div class="seg-intro">
<h3>🎬 第1段 · 开机仪式（让包工头活过来）</h3>
<p>现在下料臂还是<b>一堆死铁</b>。这一段你要像发动一辆陌生的车：<b>拿钥匙 → 插进去通电 → 看仪表盘 → 清掉报警灯 → 调好设置 → 挂挡起步</b>。</p>
<p>每一行都接着上一行——<b>后面用到的东西，前面必须先准备好</b>。这就是为什么顺序不能乱。这一段敲完，它就从死铁变成"听你指挥的机械臂"。</p>
</div>
`
      },
      {
        id: 'move',
        title: '第2段 · 定义动作 move()',
        lines: '约12行',
        intro: `
<div class="seg-intro">
<h3>🎬 第2段 · 教它"抓和放"（move 函数）</h3>
<p>包工头活了，但现在只会站着。这一段你给它写一个叫 <code>move</code> 的"动作说明"，相当于教它一个字——<b>"搬"</b>。</p>
<p>为什么要打包成一个动作？因为后面抓料、放料、码垛，要用到几十次。教会一次"搬"，后面喊一声就行，不用每次重写。它走的是"门字形"：<b>先到正上方 → 落下 → 夹住/松开 → 抬起</b>，这样不会撞到旁边的货。</p>
</div>
`
      },
      {
        id: 'server',
        title: '第3段 · 当电话总机',
        lines: '约15行',
        intro: `
<div class="seg-intro">
<h3>🎬 第3段 · 装电话总机（接通全场）</h3>
<p>前两段，包工头自己能动了，但它还是个<b>独行侠</b>。这一段给它装一部<b>电话总机</b>：开一个 8081 号线，然后<b>依次等三台机器打进来</b>——质检员、认货大脑、搬运工。</p>
<p>这里有个全场最关键的顺序：<b>谁先打进来，就被当成谁</b>。所以现场启动程序时，必须按"视觉→分类→上料"的顺序开，错了总机就接错线、全乱套。每接通一个，就派一个"接线员"(线程)专门跟它对话。装完这部电话，包工头就从单机变成<b>整条线的指挥中枢</b>。</p>
</div>
`
      },
      {
        id: 'sort',
        title: '第4段 · 分拣大脑',
        lines: '约20行',
        intro: `
<div class="seg-intro">
<h3>🎬 第4段 · 分拣大脑（收到货，算该放哪）</h3>
<p>最后一段，是包工头真正干活的逻辑。当🧠认货大脑打电话来说"这件是手机"，包工头要立刻算出三件事：<b>这类货已经放了几件？该放第几垛、第几层？坐标是多少？</b></p>
<p>算法不难，全靠一个计数器：放了几件就记几件，据此决定位置。算完坐标，就调用第2段写好的 <code>move</code> 把货放下去，再通知大家"继续下一件"。8 件全放完，整条线的活就干完了。</p>
</div>
`
      }
    ],
    recap: `
<div class="story">
<h3>🎉 包工头的说明书，写完了！</h3>
<p class="scene">回头看你刚才做的四件事，连起来就是一个完整的故事：</p>
<p>你把一堆<b>死铁唤醒</b>(第1段开机)，教会它<b>伸手抓放</b>(第2段move)，给它<b>装了电话总机</b>接通全场(第3段)，最后教会它<b>听大脑指挥、把货分进正确格子</b>(第4段分拣)。现在这个🦾分拣包工头，能正式上岗了。</p>
<table class="tbl">
<tr><th>你写的段</th><th>给了包工头什么能力</th></tr>
<tr><td>开机仪式</td><td>能动</td></tr>
<tr><td>move 动作</td><td>会抓、会放</td></tr>
<tr><td>电话总机</td><td>能接通指挥全场</td></tr>
<tr><td>分拣大脑</td><td>会算位置、会分拣</td></tr>
</table>
<p class="soul">但是——包工头现在还在<b>等电话</b>。因为🦾<b>搬运工(上料机械臂)还没写</b>，没人给它送货上来。下一关，你去唤醒搬运工，让这条线真正转起来。</p>
</div>
`
  }

},

/* ───────────── 第四层：逐行提示（onActive浮现 / onCorrect锁行 / warn必改） ───────────── */
/* 注：完整逐行数据量大，先放第1段开机仪式做样板，其余段后续补 */
lines: {
  xialiao_init: [
    { code:'api = dType.load()',
      onActive:'💡 为什么第一个？api 是"钥匙"——后面每条命令都要把它递进去，没它谁都调不动',
      onCorrect:'✅ 钥匙到手！记住这把"api钥匙"，全程都带着它' },

    { code:'state = dType.ConnectDobot(api, "COM6", 115200)[0]',
      onActive:'💡 插钥匙通电、和真机握手。要用到上一行的 api，所以排它后面',
      onCorrect:'✅ 通电了！结尾那条"小尾巴 [0]"千万别漏——它取的是连接状态码',
      warn:'⚠️ "COM6" 现场必改！设备管理器→端口(COM) 看实际号' },

    { code:'print("连接状态:", ["已连接","未找到设备","端口占用"][state])',
      onActive:'💡 看一眼仪表盘：到底连上没？用上一行的 state 当下标，翻成中文',
      onCorrect:'✅ state 是 0/1/2，正好对应列表三个位置。写完先跑一次，看到"已连接"再往下' },

    { code:'dType.ClearAllAlarmsState(api)',
      onActive:'💡 清掉上一局留下的报警灯。不清，机械臂罢工，后面命令全不理',
      onCorrect:'✅ 报警清空，它现在"愿意听话"了——这是能动的前提' },

    { code:'dType.SetPTPJumpParams(api, 100, 110, isQueued=1)',
      onActive:'💡 先立规矩：抓放时先抬到 100mm 高再平移，防撞。后面 move 靠它',
      onCorrect:'✅ 抬升规矩定好了。isQueued=1 表示"这条进队列排队"，初始化几乎都带它' },

    { code:'dType.SetInfraredSensor(api, 1, 2, version=1)',
      onActive:'💡 启用光电传感器，用来感知"货到没到位"',
      onCorrect:'✅ 传感器就位',
      warn:'⚠️ 第三参：下料机=2，上料机=1，别记反！' },

    { code:'dType.SetEndEffectorParams(api, 59.7, 0, 0, 1)',
      onActive:'💡 告诉它：手上装的是夹爪，长 59.7mm。它才能算准抓取位置',
      onCorrect:'✅ 最后那个 1 = 夹爪类型。本赛全程夹爪，不是吸盘，记死' },

    { code:'dType.SetQueuedCmdClear(api)',
      onActive:'💡 把命令队列倒干净。Dobot 是"先排队、后执行"，先清掉旧的',
      onCorrect:'✅ 队列清空。注意：必须先 Clear，下一行才 StartExec，顺序不能反' },

    { code:'dType.SetQueuedCmdStartExec(api)',
      onActive:'💡 开闸！从现在起队列里的命令才真正开始执行',
      onCorrect:'✅ 开闸成功。没有这行，后面所有动作发出去，机械臂纹丝不动' },

    { code:'dType.SetEndEffectorGripper(api, 0, 0, isQueued=1)',
      onActive:'💡 摆好初始手势：夹爪先张开。总不能攥着拳头去抓货',
      onCorrect:'✅ 这是开闸后第一个"动作命令"，所以排在 StartExec 之后' },

    { code:'dType.SetHOMECmd(api, 1, isQueued=1)',
      onActive:'💡 回机械原点，校准坐标基准。后面所有坐标都相对原点算',
      onCorrect:'✅ 开机仪式完成！包工头校准完毕、站好待命——它活了！' }
  ],

  /* ── 第2段：move() 抓放函数 8行 ── */
  xialiao_move: [
    { code:'def move(x, y, z, r, air1, air2, keep):',
      onActive:'💡 定义一个"搬"字。后面抓料、放料要用到七八次，打包成函数写一次就够',
      onCorrect:'✅ 7个参数：坐标(x,y,z,r) + 到前夹爪(air1) + 到后夹爪(air2) + 要不要保持夹(keep)' },

    { code:'    dType.SetEndEffectorGripper(api, 1, air1, isQueued=1)',
      onActive:'💡 第1步：到达目标之前，先把夹爪摆好姿势。air1决定"进门是张着还是合着"',
      onCorrect:'✅ 进门手势就位。注意用的是 Gripper（夹爪），不是 SuctionCup（吸盘）' },

    { code:'    dType.SetPTPCmdEx(api, 1, x, y, z + 20, r, isQueued=1)',
      onActive:'💡 第2步：先到目标正上方20mm——不直接冲，防止撞到旁边的货',
      onCorrect:'✅ 悬停上方。z+20 是安全高度，先到这里再往下' },

    { code:'    dType.SetPTPCmdEx(api, 1, x, y, z, r, isQueued=1)',
      onActive:'💡 第3步：从正上方垂直落到目标点。走直线，不蹭旁边',
      onCorrect:'✅ 落到目标。三步走完"上方→落点"的门字形上半截' },

    { code:'    dType.SetEndEffectorGripper(api, air2, 1, isQueued=1)',
      onActive:'💡 第4步：到了目标点，动夹爪——抓住(1)还是松开(0)，由air2决定',
      onCorrect:'✅ air2是"干活动作"：抓=1闭合，放=0张开。这是整个函数的关键一步' },

    { code:'    dType.dSleep(1000)',
      onActive:'💡 第5步：原地等1秒。夹爪闭合是物理动作，要时间咬实——不等就抬，料会掉',
      onCorrect:'✅ 停1秒。这1秒换来"夹稳不掉"，省不了' },

    { code:'    dType.SetPTPCmdEx(api, 1, x, y, z + 20, r, isQueued=1)',
      onActive:'💡 第6步：垂直抬回上方20mm——门字形收尾，安全离开',
      onCorrect:'✅ 抬起！"上方→落点→动爪→等→抬回"，这就是完整的门字形' },

    { code:'    if keep == 0:\n        dType.SetEndEffectorGripper(api, 0, air1, isQueued=1)',
      onActive:'💡 最后：keep=0表示"放下后就松手"，用air1恢复到进门时的张开状态',
      onCorrect:'✅ keep=1时夹着不松(因为还要搬去下一个点)；keep=0时放好就松。move()写完！' }
  ],

  /* ── 第3段：当电话总机（TCP服务端 + 启动三个线程）约13行 ── */
  xialiao_server: [
    { code:'socket_server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)',
      onActive:'💡 第1步：造一部电话机。这串固定写法=建一个TCP网络接口',
      onCorrect:'✅ 电话机有了。AF_INET=用网络地址，SOCK_STREAM=用TCP(稳定传字符串)' },

    { code:"socket_server.bind(('127.0.0.1', 8081))",
      onActive:'💡 第2步：给电话装号码。127.0.0.1=本机，8081=约定好的总机号',
      onCorrect:'✅ 号码绑定。8081是全场约定的总机号，其他机器都拨这个号',
      warn:'⚠️ 端口号5个程序必须一致，统一用 8081' },

    { code:'socket_server.listen(5)',
      onActive:'💡 第3步：开机待接，最多同时挂5路。现在总机正式开张',
      onCorrect:'✅ 待接状态。bind→listen 是服务端固定两连招' },

    { code:'tcpCliSock1, ardd1 = socket_server.accept()',
      onActive:'💡 第4步：接第一个打进来的电话——按约定，第一个是"质检员(视觉)"',
      onCorrect:'✅ 接通视觉！accept会"卡住等"，谁先拨进来就是谁',
      warn:'⚠️ 顺序命门：现场必须按 视觉→分类→上料 的顺序启动程序，错了就接错线' },

    { code:'clienThread1 = Thread(target=vision, args=(tcpCliSock1, "视觉端"))',
      onActive:'💡 第5步：给质检员配一个"接线员"——专门跟它对话的线程',
      onCorrect:'✅ 接线员造好了。target=vision 指定它干的活是处理视觉消息' },

    { code:'clienThread1.start()',
      onActive:'💡 第6步：让这个接线员上岗（启动线程，开始独立工作）',
      onCorrect:'✅ 视觉接线员上岗！它会一直在后台听质检员说话' },

    { code:'tcpCliSock2, ardd2 = socket_server.accept()',
      onActive:'💡 第7步：接第二个电话——按约定是"🧠认货大脑(分类)"',
      onCorrect:'✅ 接通分类！第二个拨进来的，存进 tcpCliSock2' },

    { code:'clienThread2 = Thread(target=classification, args=(tcpCliSock2, "分类端"))',
      onActive:'💡 第8步：给认货大脑配接线员，干的活是 classification',
      onCorrect:'✅ 分类接线员造好' },

    { code:'clienThread2.start()',
      onActive:'💡 第9步：分类接线员上岗',
      onCorrect:'✅ 上岗！注意三组都是"accept→Thread→start"的重复三连' },

    { code:'tcpCliSock3, ardd3 = socket_server.accept()',
      onActive:'💡 第10步：接第三个电话——"🦾搬运工(上料)"',
      onCorrect:'✅ 接通上料！三台机器全接上了' },

    { code:'clienThread3 = Thread(target=load_material, args=(tcpCliSock3, "上料端"))',
      onActive:'💡 第11步：给搬运工配接线员，干的活是 load_material',
      onCorrect:'✅ 上料接线员造好' },

    { code:'clienThread3.start()',
      onActive:'💡 第12步：搬运工接线员上岗。至此总机接通全场',
      onCorrect:'✅ 全员接通！包工头从单机变成指挥中枢了' }
  ],

  /* ── 第4段：分拣大脑（classification线程函数核心）约13行 ── */
  xialiao_sort: [
    { code:'index = sampleClss.index(str(data))',
      onActive:'💡 大脑打电话报来种类名(data)，先把它转成 0~3 的编号，好查坐标表',
      onCorrect:'✅ 名字→编号。这步最易崩：名字和列表对不上就报错',
      warn:'⚠️ sampleClss 必须和模型类别名一字不差！多个空格都会崩' },

    { code:'move(P6[0], P6[1], P6[2], P6[3], 0, 1, 1)',
      onActive:'💡 先去固定的"抓取点P6"把货抓起来。0进门张开、1抓住、1夹着不松',
      onCorrect:'✅ 复用了第2段的 move！抓起货，夹着搬走' },

    { code:'k = 0 if add_up[index] < 2 else 1',
      onActive:'💡 算放第几垛：这类已放<2件→第1垛(0)，否则第2垛(1)',
      onCorrect:'✅ k=垛号。add_up是计数器，记每类放了几件' },

    { code:'j = add_up[index] % 2',
      onActive:'💡 算放第几层：%2取余，偶数件→底层(0)，奇数件→上层(1)',
      onCorrect:'✅ j=层号。每类2件，正好一底一上' },

    { code:'delta_z = j * 10',
      onActive:'💡 上层要抬高：j=1就+10mm，j=0就不动',
      onCorrect:'✅ 算出叠层高度差' },

    { code:'x = (int)(P3[index][k][0])',
      onActive:'💡 从坐标表 P3 取落点：先选类别index，再选垛k，取出x',
      onCorrect:'✅ P3[类别][垛]=一个坐标点。y/z/r 同理依次取出' },

    { code:'add_up[index] += 1',
      onActive:'💡 这类计数+1。下一件同类货才知道该放下一个位置',
      onCorrect:'✅ 计数更新。这是码垛算法能"自动算位置"的关键' },

    { code:'move(x, y, z, r, 1, 0, 0)',
      onActive:'💡 把货放到刚算出的落点：1夹着进、0松开放下、0不保持',
      onCorrect:'✅ 又一次复用 move！放货=air2给0(张开松手)' },

    { code:'sum_add = sum(add_up)\n        if sum_add < 8:\n            tcpCliSock3.send("run".encode("utf-8"))\n            tcpCliSock2.send("run".encode("utf-8"))',
      onActive:'💡 数一共放了几件，不到8件就打电话喊搬运工和大脑"继续下一件"',
      onCorrect:'✅ 发run=节拍器，催动下一轮。发送必须 .encode("utf-8")',
      warn:'⚠️ 8件是总数(4类×2)，放满8件就停' }
  ]
}

};
