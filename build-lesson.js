/**
 * 读取"正式比赛桌面(骨架)"和"案例程序(答案)"，
 * 生成 代码默写场.html 的 FILES 数据块。
 *
 * 逻辑：
 *  - 骨架中已有的行 → 样板行（Enter放置）
 *  - 案例中有但骨架没有的行 → 练习行，关键API/参数挖空
 *
 * 运行：node build-lesson.js  → 输出 lesson-data.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = 'c:\\Users\\Klara\\Desktop\\shuati\\赛项资源包资料\\比赛电脑环境包';
const CASE = path.join(ROOT, '桌面(案例程序)\\赛项文件夹(案例程序）');
const EXAM = path.join(ROOT, '正式比赛桌面\\桌面\\赛项文件夹');

function read(p) {
  try { return fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n').split('\n'); }
  catch { return []; }
}

// 把一行代码里的关键API名称和重要参数替换为 {{答案}}
// 只挖"第一次出现"的考点，不挖语法结构词
function addBlanks(line, skeletonLines) {
  const trim = line.trim();

  // 不挖：纯注释、空行、import、简单结构
  if (!trim || trim.startsWith('#') || trim.startsWith('from ') ||
      trim.startsWith('import ') || trim === 'pass' ||
      /^(while|for|if|else|elif|try|except|def|class|with|return|break|continue|print)\b/.test(trim) && !trim.includes('dType') && !trim.includes('socket') && !trim.includes('send') && !trim.includes('recv')
  ) return line;

  let out = line;

  // Dobot API 函数名挖空
  const dobotApis = [
    'load','ConnectDobot','ClearAllAlarmsState','SetPTPJumpParams',
    'SetInfraredSensor','SetEndEffectorParams','SetQueuedCmdClear',
    'SetQueuedCmdStartExec','SetEndEffectorGripper','SetHOMECmd',
    'SetEMotor','SetPTPCmdEx','dSleep','GetInfraredSensor','GetPose',
  ];
  for (const api of dobotApis) {
    out = out.replace(new RegExp(`\\.${api}\\b`), `.{{${api}}}`);
  }

  // socket 方法
  out = out.replace(/\.(bind|listen|accept|connect|recv|send)\b/g, '.{{$1}}');
  // Thread
  out = out.replace(/\bThread\b/, '{{Thread}}');
  // 重要参数值挖空
  out = out.replace(/"COM\d+"/, '{{$&}}');           // COM口
  out = out.replace(/\b115200\b/, '{{115200}}');      // 波特率
  out = out.replace(/\b8081\b/, '{{8081}}');          // 端口
  out = out.replace(/\b59\.7\b/, '{{59.7}}');         // 夹爪长度
  out = out.replace(/(?<=dType\.\{\{SetPTPJumpParams\}\}\(api, )\d+, \d+/,
                    s => s.split(', ').map(x=>`{{${x}}}`).join(', '));
  // 传感器第3参（版本号前那个数字）
  out = out.replace(/(SetInfraredSensor\}\}\(api, \d+, )(\d+)/, '$1{{$2}}');
  // isQueued=1 不挖（太多了，背景化）
  // arrive1/2、run
  out = out.replace(/"arrive1"/, '{{$&}}');
  out = out.replace(/"arrive2"/, '{{$&}}');
  out = out.replace(/"run"/, '{{$&}}');
  // encode/decode
  out = out.replace(/\.(encode|decode)\b/g, '.{{$1}}');
  // predict/get_decoded_text
  out = out.replace(/\bpredict\b/, '{{predict}}');
  out = out.replace(/\bget_decoded_text\b/, '{{get_decoded_text}}');
  // .split
  out = out.replace(/\.(split)\b/, '.{{split}}');
  // result[0] 中的0
  out = out.replace(/result\[0\]/, 'result[{{0}}]');
  // "M" in data
  out = out.replace(/"M"/, '{{$&}}');
  // RFID read_card_text 相关
  out = out.replace(/json\.load\b/, 'json.{{load}}');
  out = out.replace(/os\.path\.exists\b/, 'os.path.{{exists}}');
  out = out.replace(/data\.get\("decoded_text"\)/, 'data.{{get}}({{"decoded_text"}})');
  out = out.replace(/return read_card_text\(\)/, 'return {{read_card_text}}()');

  return out;
}

// section 分割点（通过注释或空行分段）
function detectSections(lines, fileKey) {
  if (fileKey === 'xl') return [
    { name:'连接初始化', until: l => /SetHOMECmd/.test(l) },
    { name:'坐标与数据', until: l => /sampleClss/.test(l) },
    { name:'线程函数', until: l => /def move/.test(l) },
    { name:'move()函数', until: l => /if keep == 0/.test(l) },
    { name:'TCP主程序', until: () => false }, // 到结尾
  ];
  if (fileKey === 'sl') return [
    { name:'连接初始化', until: l => /SetHOMECmd/.test(l) },
    { name:'坐标与move', until: l => /def move/.test(l.replace(/\s/g,'')) ? false : /if keep == 0/.test(l) },
    { name:'TCP主程序', until: () => false },
  ];
  return [{ name:'主程序', until: () => false }];
}

function buildFile(caseFile, examFile, fileKey, displayName, desc, runOutput) {
  const caseLines = read(caseFile);
  const examLines = read(examFile);

  // 骨架行 set（用于判断哪些行现场已有）
  const examSet = new Set(examLines.map(l => l.trimEnd()));

  // 按 section 分割案例代码
  const secDefs = fileKey === 'xl' ? [
    { name:'连接初始化', end: i => caseLines[i].includes('SetHOMECmd') },
    { name:'坐标与码垛数据', end: i => /^sampleClss/.test(caseLines[i].trim()) || caseLines[i].includes("sampleClss=") },
    { name:'线程函数(视觉/分类/上料/语音)', end: i => caseLines[i].trim() === 'except IndexError:' || /print\('输入非法/.test(caseLines[i]) },
    { name:'move()抓放函数', end: i => /^\s+if keep == 0:/.test(caseLines[i]) },
    { name:'TCP服务端主程序', end: () => false },
  ] : fileKey === 'sl' ? [
    { name:'连接初始化', end: i => caseLines[i].includes('SetHOMECmd') },
    { name:'坐标与move函数', end: i => /^\s+if keep == 0:/.test(caseLines[i]) },
    { name:'TCP客户端主程序', end: () => false },
  ] : fileKey === 'cls' ? [
    { name:'识别主程序', end: () => false },
  ] : [
    { name:'读卡文本工具', end: () => false },
  ];

  const sections = [];
  let si = 0, ci = 0;
  while (si < secDefs.length) {
    const sec = secDefs[si];
    const sLines = [];
    while (ci < caseLines.length) {
      const raw = caseLines[ci];
      const trimEnd = raw.trimEnd();
      const t = trimEnd.trim();
      const inSkeleton = examSet.has(trimEnd);

      // 注释行、import/from 行 → 永远样板行（照搬案例原文，便于理解，Enter自动放置）
      const isCommentOrImport = t.startsWith('#') ||
        t.startsWith('import ') || t.startsWith('from ') ||
        t.startsWith('"""') || t.startsWith("'''");

      // 练习行 = 不在骨架里、非空、且不是注释/import
      const isExercise = !inSkeleton && trimEnd !== '' && !isCommentOrImport;

      const lineObj = { c: trimEnd };
      if (isExercise) {
        // 这行需要现场补写，加挖空
        lineObj.c = addBlanks(trimEnd, examLines);
        lineObj.tip = ''; // 后面补
      }
      sLines.push(lineObj);

      const done = sec.end(ci);
      ci++;
      if (done) break;
    }
    sections.push({ id: fileKey + '_' + si, name: sec.name, lines: sLines });
    si++;
  }

  return { name: displayName, desc, sections, run: runOutput };
}

const xl = buildFile(
  path.join(CASE, '下料机器臂', 'Main.py'),
  path.join(EXAM, '下料机器臂', 'Main.py'),
  'xl', '下料机器臂/Main.py', 'TCP服务端·8081·最先启动',
  '连接状态: 已连接\n连接视觉\n连接成功\n连接分类\n连接成功\n连接上料\n连接成功\n输入指令:'
);

const sl = buildFile(
  path.join(CASE, '上料机器臂', 'Main.py'),
  path.join(EXAM, '上料机器臂', 'Main.py'),
  'sl', '上料机器臂/Main.py', 'TCP客户端·传送带·光电传感器',
  '连接成功\nrun\n>>> 取料→RFID→传送带→arrive2 一轮完成'
);

const cls = buildFile(
  path.join(CASE, '深度学习分类', 'main.py'),
  path.join(EXAM, '深度学习分类', 'main.py'),
  'cls', '深度学习分类/main.py', 'ResNet18识别·读RFID·发种类',
  '连接成功\nMxxxx\n开始识别\n结果:1.jqr,编号:Mxxxx,置信度:0.98'
);

// RFID 读卡文本工具：现场分类目录缺这个文件，要从 RFID64bit 拷过来并会用
// examFile 用现场分类目录(无此文件)，使整份成为需补写的练习
const rfid = buildFile(
  path.join(CASE, 'RFID64bit', 'read_card_text.py'),
  path.join(EXAM, '深度学习分类', 'read_card_text.py'),  // 现场不存在 → 全部当练习
  'rfid', 'RFID64bit/read_card_text.py', '读卡结果·现场缺此文件需拷贝',
  '解码文本: 广东省;2026-06-26\n>>> get_decoded_text() 取到 RFID 内容'
);

const FILES = [xl, sl, cls, rfid];

// 给没有 tip 的练习行补上默认 tip
function addDefaultTips(files) {
  // key → { tip:一句话功能, why:为什么这么写/记忆点 }
  const tipMap = {
    'dType.{{load}}': { tip:'加载DLL拿到api句柄', why:'api是后面所有指令的第一个参数。记法：用之前先load。' },
    '{{ConnectDobot}}': { tip:'连接机械臂,取返回元组[0]', why:'返回(状态码,...)，必须带[0]取状态。0=已连接,1=没找到,2=占用。' },
    '{{ClearAllAlarmsState}}': { tip:'清除报警', why:'上次急停/撞机会留报警，不清臂就罢工不动。开机仪式第一步。' },
    '{{SetPTPJumpParams}}': { tip:'设门型运动抬升高度', why:'门型=先抬高再平移再下降，防止拖着料撞别的。100/110是抬升高度和上限。' },
    '{{SetInfraredSensor}}': { tip:'光电传感器 下料=2 上料=1', why:'第3参是端口号，下料机接2号、上料机接1号，记反了读不到料。' },
    '{{SetEndEffectorParams}}': { tip:'设夹爪末端(长59.7mm)', why:'告诉系统末端是夹爪、长59.7。最后那个1=夹爪类型，本赛是夹爪不是吸盘！' },
    '{{SetQueuedCmdClear}}': { tip:'清空指令队列', why:'倒空上次残留任务，避免一启动就乱动。' },
    '{{SetQueuedCmdStartExec}}': { tip:'开始执行队列', why:'Dobot指令先进队列再执行，不StartExec就全堵着不动。' },
    '{{SetEndEffectorGripper}}': { tip:'夹爪控制(开/合)', why:'第2参=使能,第3参=开合。现场骨架开头那行常被漏，要补回。' },
    '{{SetHOMECmd}}': { tip:'机械臂回零', why:'回机械原点，坐标系才准。开机仪式最后一步。' },
    '{{SetEMotor}}': { tip:'传送带电机', why:'端口0,使能,速度。开头先停(负速)，到位后正转送料。只有上料机有。' },
    '{{SetPTPCmdEx}}': { tip:'PTP点到点运动', why:'第2参=1是运动模式,后面x,y,z,r坐标。带Ex是阻塞版,执行完才返回。' },
    '{{dSleep}}': { tip:'等夹爪夹稳', why:'夹/松爪是机械动作有延迟，不等就抬走会掉料。下料1000ms,上料100ms。' },
    '{{GetInfraredSensor}}': { tip:'读光电传感器', why:'返回列表,i[0]==1表示挡光=料到位。靠它判断传送带送到没。' },
    '{{bind}}': { tip:'绑定IP和端口', why:'下料机当服务器,占住127.0.0.1:8081等别人连。' },
    '{{listen}}': { tip:'开始监听', why:'参数5=最多排队5个连接。绑定后必须listen才能accept。' },
    '{{accept}}': { tip:'接受客户端连接(阻塞)', why:'按顺序收：视觉→分类→上料。顺序错了对象就连错。返回(连接,地址)。' },
    '{{connect}}': { tip:'连接服务端8081', why:'上料/分类是客户端,主动连下料机的8081。' },
    '{{recv}}': { tip:'接收数据', why:'recv(1024)收最多1024字节,要.decode转字符串才能比较。' },
    '{{send}}': { tip:'发送数据', why:'发送的必须是bytes,所以要"xxx".encode("utf-8")。漏encode直接报错。' },
    '{{encode}}': { tip:'字符串转bytes', why:'网络只能传bytes,发送前必须encode。' },
    '{{decode}}': { tip:'bytes转字符串', why:'收到的是bytes,要decode("utf-8")才能当字符串用。' },
    '{{Thread}}': { tip:'创建线程', why:'下料机要同时伺候视觉/分类/上料三方,每个开一条线程并行收发。' },
    '{{predict}}': { tip:'ResNet18识别', why:'返回(种类,编号,置信度)。本赛用深度学习分类,不是OpenCV形状识别。' },
    '{{get_decoded_text}}': { tip:'读RFID文本', why:'读card_result.json里RFID解出的"省份;时间"。现场缺此文件要从RFID64bit拷。' },
    '{{split}}': { tip:'按分号分割', why:'RFID内容格式是"省份;时间",split(";")[0]取省份,[1]取时间。' },
    '{{8081}}': { tip:'TCP端口', why:'整套系统统一用8081,下料机服务端先启动占用它。' },
    '{{115200}}': { tip:'波特率', why:'Dobot串口固定115200,写错连不上。' },
    '{{59.7}}': { tip:'夹爪长度mm', why:'夹爪伸出59.7mm,影响末端坐标计算。' },
    '"arrive1"': { tip:'到位信号1', why:'上料机放好料到RFID位后发,触发视觉拍RFID面。' },
    '"arrive2"': { tip:'到位信号2', why:'传送带送到位后发,触发视觉拍正面识别。' },
    '"run"': { tip:'节拍信号', why:'下料机发run驱动上料机取下一件,凑满8件停。' },
    '"M"': { tip:'编号标志', why:'视觉识别出二维码后发以M开头的编号,分类端收到才开始识别。' },
  };
  files.forEach(f => {
    f.sections.forEach(s => {
      s.lines.forEach(l => {
        if (l.tip === '') {
          for (const [key, info] of Object.entries(tipMap)) {
            if (l.c.includes(key)) {
              l.tip = info.tip;
              if (info.why) l.why = info.why;
              break;
            }
          }
          if (l.tip === '') l.tip = null;
        }
      });
    });
  });
}

addDefaultTips(FILES);

// 序列化输出，对 tip/why/warn 为 null 的不输出
function serializeLine(l) {
  let s = `      {c:${JSON.stringify(l.c)}`;
  if (l.tip) s += `,tip:${JSON.stringify(l.tip)}`;
  if (l.why) s += `,why:${JSON.stringify(l.why)}`;
  if (l.warn) s += `,warn:${JSON.stringify(l.warn)}`;
  s += '}';
  return s;
}

let out = 'const FILES = [\n';
FILES.forEach((f, fi) => {
  out += `{\n  name:${JSON.stringify(f.name)},\n  desc:${JSON.stringify(f.desc)},\n  sections:[\n`;
  f.sections.forEach(sec => {
    out += `    { id:${JSON.stringify(sec.id)}, name:${JSON.stringify(sec.name)}, lines:[\n`;
    sec.lines.forEach(l => { out += serializeLine(l) + ',\n'; });
    out += `    ]},\n`;
  });
  out += `  ],\n  run:${JSON.stringify(f.run)}\n}${fi < FILES.length - 1 ? ',' : ''}\n`;
});
out += '];\n';

fs.writeFileSync('lesson-data.js', out, 'utf8');
console.log('生成完成: lesson-data.js');

// 直接注入 代码默写场.html，替换 const FILES = [ ... ]; 块
const htmlPath = '代码默写场.html';
let html = fs.readFileSync(htmlPath, 'utf8');
const reFiles = /const FILES = \[[\s\S]*?\n\];/;
if (reFiles.test(html)) {
  html = html.replace(reFiles, out.trim());
  fs.writeFileSync(htmlPath, html, 'utf8');
  console.log('已注入 代码默写场.html');
} else {
  console.log('!! 未在HTML中找到 FILES 块，请检查');
}
// 统计
const totalLines = FILES.reduce((a, f) => a + f.sections.reduce((b, s) => b + s.lines.length, 0), 0);
const exerciseLines = FILES.reduce((a, f) => a + f.sections.reduce((b, s) =>
  b + s.lines.filter(l => /\{\{/.test(l.c)).length, 0), 0);
console.log(`总行数: ${totalLines}, 含挖空的练习行: ${exerciseLines}`);
