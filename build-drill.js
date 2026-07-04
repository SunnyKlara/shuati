/* 把 code-drill.html + drill-data.js + drill-story.js + drill-app.js
   合并成一个自包含单文件 code-drill.html，避免 file:// 多文件加载问题 */
const fs = require('fs');

const html  = fs.readFileSync('code-drill.html', 'utf8');
const data  = fs.readFileSync('drill-data.js',  'utf8');
const story = fs.readFileSync('drill-story.js', 'utf8');
const app   = fs.readFileSync('drill-app.js',   'utf8');

// 把三段 <script src=...> 替换为内联脚本
const inlined =
`<script>\n${data}\n</script>\n` +
`<script>\n${story}\n</script>\n` +
`<script>\n${app}\n</script>`;

let out = html.replace(
  /<script src="drill-data\.js"><\/script>\s*<script src="drill-story\.js"><\/script>\s*<script src="drill-app\.js"><\/script>/,
  inlined
);

if (out === html) {
  console.error('!! 未匹配到 script 标签，检查 HTML 中的 <script src> 写法');
  process.exit(1);
}

fs.writeFileSync('代码默写场.html', out, 'utf8');
console.log('合并完成 → 代码默写场.html，单文件大小:', (out.length/1024).toFixed(1), 'KB');
