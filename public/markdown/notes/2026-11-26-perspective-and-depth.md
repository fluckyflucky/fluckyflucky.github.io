# [设计] 平面上的纵深与空气感

画纸、屏幕和画布都只有长和宽，没有真正的厚度。人眼之所以能在一张平面上看见深远的街道、层叠的山峦，或者一扇推开后通往室内的门，靠的是大脑对各种深度线索的习惯性解读——近大远小、近实远虚、前后遮挡，都是平面的线条和色块立出距离感的办法。

## 几何透视与视平线

文艺复兴时期，布鲁内莱斯基和阿尔贝蒂把建筑制图中的投影规律引入绘画，建立起一套以几何线条为基础的线性透视。这套方法立足于一个简单的事实——平行的直线向远方延伸时，在视觉上会逐渐靠拢，最终交汇于一点。

决定这套几何骨架如何展开的，是**视平线（Horizon Line）**，也就是与观察者眼睛保持同一高度的水平线。无论抬头还是低头，眼睛所在的水平高度就是视平线的位置；地面上所有水平延伸的平行线，最终都会收束到这条线上。

<div style="background:#102b34;border:1px solid rgba(174,215,211,0.18);border-radius:12px;padding:18px;margin:20px 0;">
  <svg viewBox="0 0 660 215" style="width:100%;max-width:660px;height:auto;display:block;margin:0 auto;" role="img" aria-label="一点透视、两点透视与三点透视的几何对比">
    <g>
      <rect x="10" y="10" width="200" height="150" rx="8" fill="#0b242d" stroke="rgba(174,215,211,0.14)" />
      <line x1="18" y1="76" x2="202" y2="76" stroke="#9fb6b8" stroke-width="1" stroke-dasharray="4 3" opacity="0.7" />
      <line x1="110" y1="76" x2="54" y2="148" stroke="#7fc4c8" stroke-width="1" opacity="0.35" />
      <line x1="110" y1="76" x2="166" y2="148" stroke="#7fc4c8" stroke-width="1" opacity="0.35" />
      <line x1="110" y1="76" x2="66" y2="34" stroke="#7fc4c8" stroke-width="1" opacity="0.35" />
      <line x1="110" y1="76" x2="154" y2="34" stroke="#7fc4c8" stroke-width="1" opacity="0.35" />
      <rect x="92" y="62" width="36" height="32" fill="rgba(127,196,200,0.08)" stroke="#7fc4c8" stroke-width="1.2" />
      <rect x="66" y="42" width="88" height="78" fill="none" stroke="#e3eeec" stroke-width="1.6" />
      <line x1="66" y1="42" x2="92" y2="62" stroke="#e3eeec" stroke-width="1.2" />
      <line x1="154" y1="42" x2="128" y2="62" stroke="#e3eeec" stroke-width="1.2" />
      <line x1="66" y1="120" x2="92" y2="94" stroke="#e3eeec" stroke-width="1.2" />
      <line x1="154" y1="120" x2="128" y2="94" stroke="#e3eeec" stroke-width="1.2" />
      <circle cx="110" cy="76" r="3.5" fill="#eb9f33" />
      <text x="110" y="182" text-anchor="middle" fill="#e3eeec" font-size="12" font-weight="600">一点透视</text>
      <text x="110" y="200" text-anchor="middle" fill="#9fb6b8" font-size="11">正对立方体 · 单灭点居中纵深</text>
    </g>
    <g>
      <rect x="230" y="10" width="200" height="150" rx="8" fill="#0b242d" stroke="rgba(174,215,211,0.14)" />
      <line x1="238" y1="76" x2="422" y2="76" stroke="#9fb6b8" stroke-width="1" stroke-dasharray="4 3" opacity="0.7" />
      <line x1="244" y1="76" x2="330" y2="44" stroke="#7fc4c8" stroke-width="1" opacity="0.35" />
      <line x1="244" y1="76" x2="330" y2="124" stroke="#7fc4c8" stroke-width="1" opacity="0.35" />
      <line x1="416" y1="76" x2="330" y2="44" stroke="#7fc4c8" stroke-width="1" opacity="0.35" />
      <line x1="416" y1="76" x2="330" y2="124" stroke="#7fc4c8" stroke-width="1" opacity="0.35" />
      <polygon points="330,44 282,62 282,106 330,124" fill="rgba(127,196,200,0.10)" stroke="#e3eeec" stroke-width="1.5" />
      <polygon points="330,44 378,62 378,106 330,124" fill="rgba(127,196,200,0.18)" stroke="#e3eeec" stroke-width="1.5" />
      <line x1="282" y1="62" x2="330" y2="50" stroke="#7fc4c8" stroke-width="1" stroke-dasharray="3 2" opacity="0.7" />
      <line x1="378" y1="62" x2="330" y2="50" stroke="#7fc4c8" stroke-width="1" stroke-dasharray="3 2" opacity="0.7" />
      <circle cx="244" cy="76" r="3.5" fill="#eb9f33" />
      <circle cx="416" cy="76" r="3.5" fill="#eb9f33" />
      <text x="330" y="182" text-anchor="middle" fill="#e3eeec" font-size="12" font-weight="600">两点透视</text>
      <text x="330" y="200" text-anchor="middle" fill="#9fb6b8" font-size="11">成角观察 · 两侧各收向一个灭点</text>
    </g>
    <g>
      <rect x="450" y="10" width="200" height="150" rx="8" fill="#0b242d" stroke="rgba(174,215,211,0.14)" />
      <line x1="458" y1="54" x2="642" y2="54" stroke="#9fb6b8" stroke-width="1" stroke-dasharray="4 3" opacity="0.7" />
      <line x1="464" y1="54" x2="550" y2="36" stroke="#7fc4c8" stroke-width="1" opacity="0.3" />
      <line x1="636" y1="54" x2="550" y2="36" stroke="#7fc4c8" stroke-width="1" opacity="0.3" />
      <line x1="550" y1="150" x2="550" y2="36" stroke="#7fc4c8" stroke-width="1" opacity="0.35" />
      <line x1="550" y1="150" x2="496" y2="48" stroke="#7fc4c8" stroke-width="1" opacity="0.35" />
      <line x1="550" y1="150" x2="604" y2="48" stroke="#7fc4c8" stroke-width="1" opacity="0.35" />
      <polygon points="550,36 496,48 516,104 550,114" fill="rgba(127,196,200,0.10)" stroke="#e3eeec" stroke-width="1.5" />
      <polygon points="550,36 604,48 584,104 550,114" fill="rgba(127,196,200,0.18)" stroke="#e3eeec" stroke-width="1.5" />
      <polygon points="550,28 496,48 550,36 604,48" fill="rgba(227,238,236,0.12)" stroke="#e3eeec" stroke-width="1.4" />
      <circle cx="464" cy="54" r="3.5" fill="#eb9f33" />
      <circle cx="636" cy="54" r="3.5" fill="#eb9f33" />
      <circle cx="550" cy="150" r="3.5" fill="#eb9f33" />
      <text x="550" y="182" text-anchor="middle" fill="#e3eeec" font-size="12" font-weight="600">三点透视</text>
      <text x="550" y="200" text-anchor="middle" fill="#9fb6b8" font-size="11">俯视或仰视 · 垂直线也向远方汇聚</text>
    </g>
  </svg>
</div>

按照画面中消失点（灭点）的数量，线性透视分三种常见形态。

- **一点透视**，物体有一个面正对着观者，水平线保持水平，垂直线保持垂直，只有沿着纵深方向退去的边线向视平线上的唯一灭点汇聚。这种结构端正、对称，常见于走廊、街道和古典建筑大厅，视线会顺着透视线直奔中心。
- **两点透视**，物体以棱角面向观者，垂直线依然保持竖直，左右两侧的水平边线分别向视平线左右两个灭点收束。相比一点透视，画面更有转折感，常见于街角建筑与室内写生。
- **三点透视**，大幅仰视高楼或俯瞰城市峡谷时，原本垂直于地面的竖直线条也会产生近大远小的倾斜，在画框上方或下方形成第三个灭点，强化体量感与失衡感。

<div style="background:#102b34;border:1px solid rgba(174,215,211,0.18);border-radius:12px;padding:18px;margin:20px 0;">
  <img src="/img/notes/perspective-depth/school-of-athens.jpg" alt="拉斐尔《雅典学院》" style="width:100%;max-height:360px;object-fit:cover;border-radius:8px;display:block;" />
  <div style="font-size:12px;color:#9fb6b8;text-align:center;margin-top:10px;">拉斐尔《雅典学院》（1509–1511），典型的一点透视，连续拱门与地面方砖将视线引向居中的柏拉图与亚里士多德</div>
</div>

### 视平线的高低

画框里视平线放在什么高度，直接决定了观者站在哪里，也规定了整张画的观看视角。

<div style="background:#102b34;border:1px solid rgba(174,215,211,0.18);border-radius:12px;padding:18px;margin:20px 0;">
  <svg viewBox="0 0 660 205" style="width:100%;max-width:660px;height:auto;display:block;margin:0 auto;" role="img" aria-label="高、中、低三种视平线高度对画面空间的影响">
    <g>
      <rect x="10" y="10" width="200" height="136" rx="8" fill="#0b242d" stroke="rgba(174,215,211,0.14)" />
      <rect x="10" y="10" width="200" height="32" rx="8" fill="rgba(127,196,200,0.10)" />
      <line x1="10" y1="42" x2="210" y2="42" stroke="#eb9f33" stroke-width="1.2" stroke-dasharray="4 3" />
      <polygon points="110,42 36,146 184,146" fill="rgba(127,196,200,0.14)" />
      <line x1="110" y1="42" x2="36" y2="146" stroke="#9fb6b8" stroke-width="1" />
      <line x1="110" y1="42" x2="184" y2="146" stroke="#9fb6b8" stroke-width="1" />
      <rect x="64" y="96" width="18" height="24" fill="#3d7882" stroke="#e3eeec" stroke-width="1" />
      <rect x="132" y="72" width="14" height="18" fill="#3d7882" stroke="#e3eeec" stroke-width="1" />
      <text x="198" y="36" text-anchor="end" fill="#eb9f33" font-size="10">视平线</text>
      <text x="110" y="172" text-anchor="middle" fill="#e3eeec" font-size="12" font-weight="600">高视平线（俯瞰）</text>
      <text x="110" y="190" text-anchor="middle" fill="#9fb6b8" font-size="11">地面铺展充分 · 适合交代格局与路径</text>
    </g>
    <g>
      <rect x="230" y="10" width="200" height="136" rx="8" fill="#0b242d" stroke="rgba(174,215,211,0.14)" />
      <rect x="230" y="10" width="200" height="68" rx="8" fill="rgba(127,196,200,0.10)" />
      <line x1="230" y1="78" x2="430" y2="78" stroke="#eb9f33" stroke-width="1.2" stroke-dasharray="4 3" />
      <polygon points="330,78 264,146 396,146" fill="rgba(127,196,200,0.14)" />
      <line x1="330" y1="78" x2="264" y2="146" stroke="#9fb6b8" stroke-width="1" />
      <line x1="330" y1="78" x2="396" y2="146" stroke="#9fb6b8" stroke-width="1" />
      <circle cx="292" cy="78" r="5" fill="#e3eeec" />
      <rect x="287" y="84" width="10" height="28" rx="2" fill="#3d7882" stroke="#e3eeec" stroke-width="1" />
      <circle cx="364" cy="78" r="3.5" fill="#e3eeec" />
      <rect x="360" y="82" width="8" height="20" rx="2" fill="#3d7882" stroke="#e3eeec" stroke-width="1" />
      <text x="418" y="72" text-anchor="end" fill="#eb9f33" font-size="10">视平线</text>
      <text x="330" y="172" text-anchor="middle" fill="#e3eeec" font-size="12" font-weight="600">中视平线（平视）</text>
      <text x="330" y="190" text-anchor="middle" fill="#9fb6b8" font-size="11">天地均衡 · 同身高人物头部落在同线</text>
    </g>
    <g>
      <rect x="450" y="10" width="200" height="136" rx="8" fill="#0b242d" stroke="rgba(174,215,211,0.14)" />
      <rect x="450" y="10" width="200" height="106" rx="8" fill="rgba(127,196,200,0.10)" />
      <line x1="450" y1="116" x2="650" y2="116" stroke="#eb9f33" stroke-width="1.2" stroke-dasharray="4 3" />
      <polygon points="550,116 490,146 610,146" fill="rgba(127,196,200,0.14)" />
      <polygon points="518,32 582,32 590,130 510,130" fill="#28545e" stroke="#e3eeec" stroke-width="1.4" />
      <text x="638" y="110" text-anchor="end" fill="#eb9f33" font-size="10">视平线</text>
      <text x="550" y="172" text-anchor="middle" fill="#e3eeec" font-size="12" font-weight="600">低视平线（仰视）</text>
      <text x="550" y="190" text-anchor="middle" fill="#9fb6b8" font-size="11">天空让出大片空间 · 主体显得高大稳重</text>
    </g>
  </svg>
</div>

平视状态下有一个很好用的日常规律：如果人群站在同一片平地上，无论他们离你五米还是五十米，只要身高相近，他们的眼睛都会落在这条视平线上。近处的人脚底接近画框下缘，远处的人脚底更靠近视平线，头顶却始终与视平线齐平。把人物错落安放在视平线上下，地面就站稳了。

## 空气透视与远景衰减

如果只有几何线条，沙漠里的远山和太空里的陨石画出来会一样清晰。现实中让远景真正退到后方的，往往是空气本身。

地球表面的空气并非完全透明，里面悬浮着水汽、微尘和气体分子。光线穿过这层介质时，短波长的蓝紫光更容易散射，物体原本的暗部和高光也会被空气中的漫射光冲淡。距离越远，景物越容易出现三种变化：

1. **明度升高**，深色的山体和树林在远方逐渐提亮，向天空的亮度靠拢。
2. **纯度降低**，鲜艳的绿、红、黄退成含灰的淡调，色彩倾向朝天光的冷蓝灰偏移。
3. **对比度减弱**，近处岩石上锋利的明暗交界线，到了数公里外会融成一片柔和的剪影。

<div style="background:#102b34;border:1px solid rgba(174,215,211,0.18);border-radius:12px;padding:18px;margin:20px 0;">
  <svg viewBox="0 0 600 185" style="width:100%;max-width:600px;height:auto;display:block;margin:0 auto;border-radius:8px;" role="img" aria-label="空气透视下的远山层叠与明度纯度衰减">
    <defs>
      <linearGradient id="atmoSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#b9cdd3" />
        <stop offset="100%" stop-color="#e3ecee" />
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="600" height="185" rx="8" fill="url(#atmoSky)" />
    <path d="M 0 94 Q 80 56 175 84 T 360 72 T 515 88 L 600 76 L 600 185 L 0 185 Z" fill="#a2b8c0" />
    <path d="M 0 112 Q 110 80 220 106 T 430 94 T 600 110 L 600 185 L 0 185 Z" fill="#6f8e98" />
    <path d="M 0 132 Q 130 104 270 128 T 490 116 L 600 126 L 600 185 L 0 185 Z" fill="#3f656f" />
    <path d="M 0 154 Q 160 134 330 148 T 600 142 L 600 185 L 0 185 Z" fill="#172f33" />
    <rect x="16" y="14" width="166" height="40" rx="6" fill="rgba(16,43,52,0.78)" />
    <text x="26" y="31" fill="#e3eeec" font-size="11">远景高明度 · 低纯度 · 低对比</text>
    <text x="26" y="46" fill="#9fb6b8" font-size="10">色相并入冷灰天光</text>
    <rect x="418" y="132" width="166" height="40" rx="6" fill="rgba(11,36,45,0.85)" />
    <text x="428" y="149" fill="#e3eeec" font-size="11">近景明暗拉大 · 轮廓明确</text>
    <text x="428" y="164" fill="#9fb6b8" font-size="10">固有色与细节清晰可辨</text>
  </svg>
  <div style="font-size:12px;color:#9fb6b8;text-align:center;margin-top:10px;">距离拉远时，暗部迅速变浅，层间反差逐渐收窄</div>
</div>

达·芬奇在画作笔记中把这种现象称为“空气透视”，并在《蒙娜丽莎》的背景里用蓝绿灰色的远山把人物向前推了出来。十九世纪的德国浪漫主义风景画家弗里德里希，更把近景礁石与远方雾海的明度反差用到了极致。

东方山水画很少采用西方的单点几何透视，对空气感的体察却如出一辙。北宋郭熙在《林泉高致》里提出山水“三远”——自山下而仰山巅的**高远**、自山前而窥山后的**深远**、自近山而望远山的**平远**，正是通过墨色浓淡、云气留白与笔触的聚散，在立轴和长卷上造出可游可居的纵深。

<div style="background:#102b34;border:1px solid rgba(174,215,211,0.18);border-radius:12px;padding:18px;margin:20px 0;">
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px;">
    <div style="background:#0b242d;border:1px solid rgba(174,215,211,0.14);border-radius:10px;padding:12px;">
      <img src="/img/notes/perspective-depth/wanderer-fog.jpg" alt="弗里德里希《雾海上的旅人》" style="width:100%;height:260px;object-fit:cover;border-radius:8px;display:block;" />
      <div style="font-size:12px;color:#9fb6b8;margin-top:10px;">弗里德里希《雾海上的旅人》（约 1818），深色近景与高明度雾海拉开空间跨度</div>
    </div>
    <div style="background:#0b242d;border:1px solid rgba(174,215,211,0.14);border-radius:10px;padding:12px;">
      <img src="/img/notes/perspective-depth/early-spring.jpg" alt="郭熙《早春图》" style="width:100%;height:260px;object-fit:cover;object-position:center 35%;border-radius:8px;display:block;" />
      <div style="font-size:12px;color:#9fb6b8;margin-top:10px;">北宋 郭熙《早春图》（1072），以云岚留白和淡墨远山在一幅立轴中兼顾高远、深远与平远</div>
    </div>
  </div>
</div>

## 遮挡、前景框和边缘虚实

除了几何线条和空气雾气，不用画一条透视线也能立出前后关系，靠的是**遮挡**、**前景框**与**边缘虚实**。

当一个物体的轮廓打断了另一个物体时，人脑会毫不犹豫地判定被打断的那个在后方。哪怕两个物体大小相近、明度一样，只要存在叠压关系，平面感就会被打破。相反，如果画面里的山石、树枝、人物彼此互不接触、各自留出一圈空气，它们就会像剪纸一样浮在同一层面上。

很多画作和电影镜头还会故意在画面边缘放进一块深色的**前景框**，比如一扇半掩的门框、垂落下来的树枝，或是观者身旁的栏杆。前景框压暗了画框四周，把亮度留给中远景的主体，同时也替观者立出一个立足点，仿佛人正站在某个真实的位置往外看。

<div style="background:#102b34;border:1px solid rgba(174,215,211,0.18);border-radius:12px;padding:18px;margin:20px 0;">
  <svg viewBox="0 0 600 185" style="width:100%;max-width:600px;height:auto;display:block;margin:0 auto;" role="img" aria-label="无遮挡均等边缘与前景框遮挡虚实对比">
    <g>
      <rect x="10" y="10" width="275" height="135" rx="8" fill="#0b242d" stroke="rgba(174,215,211,0.14)" />
      <rect x="34" y="42" width="58" height="72" rx="4" fill="#3a6b74" stroke="#e3eeec" stroke-width="1.6" />
      <circle cx="145" cy="78" r="34" fill="#3a6b74" stroke="#e3eeec" stroke-width="1.6" />
      <polygon points="228,44 264,114 192,114" fill="#3a6b74" stroke="#e3eeec" stroke-width="1.6" />
      <text x="147" y="168" text-anchor="middle" fill="#e3eeec" font-size="12" font-weight="600">互不遮挡 + 均等锐边</text>
      <text x="147" y="183" text-anchor="middle" fill="#9fb6b8" font-size="11">前后关系模糊，形体停留在同一平面</text>
    </g>
    <g>
      <rect x="315" y="10" width="275" height="135" rx="8" fill="#173842" stroke="rgba(174,215,211,0.14)" />
      <polygon points="485,48 545,126 425,126" fill="#325b65" opacity="0.72" />
      <circle cx="458" cy="84" r="34" fill="#467d87" stroke="#b9d6d8" stroke-width="1.2" />
      <rect x="366" y="46" width="66" height="82" rx="4" fill="#2a5760" stroke="#e3eeec" stroke-width="1.8" />
      <path d="M 315 10 L 352 10 Q 340 78 364 145 L 315 145 Z" fill="#07191f" />
      <path d="M 590 10 L 552 10 Q 564 62 544 145 L 590 145 Z" fill="#07191f" />
      <text x="452" y="168" text-anchor="middle" fill="#e3eeec" font-size="12" font-weight="600">前景框 + 叠压遮挡 + 远柔近锐</text>
      <text x="452" y="183" text-anchor="middle" fill="#9fb6b8" font-size="11">暗部前景托出中景，远景轮廓主动弱化</text>
    </g>
  </svg>
</div>

**边缘虚实**则对应人眼的对焦和信息取舍。画画时很容易把远处树冠的每一片叶子和近处衣褶画得同样锐利。边缘越硬、明暗反差越强，在视觉上就越往前跳；主动把次要区域和远景的轮廓画软、画融，主体的边缘才显出走近的清晰度。

## 广角和长焦的空间感

同样站在一条走廊里，用手机主摄（广角）拍一张，再退远几步用长焦镜头拍一张，画面里的空间感受会差很多，因为视角张开的角度改变了前后景物的尺寸比例。

- **广角视角（短焦距）**，视野宽阔，贴近镜头的物体会被显著放大，稍微退后几步的物体迅速缩小。剧烈的近大远小会拉伸纵深，让走廊显得更长、广场更空旷，也容易带出紧迫或宏大的情绪。
- **长焦视角（长焦距）**，视野狭窄，只截取远处一小块区域。观察距离较远时，前后两排物体到镜头的相对距离差变小，尺寸衰减不再剧烈，原本相隔几十米的建筑、人群或山峦在画面里会像舞台布景一样紧密叠在一起，显得紧凑甚至有些压迫。

<div style="background:#102b34;border:1px solid rgba(174,215,211,0.18);border-radius:12px;padding:18px;margin:20px 0;">
  <svg viewBox="0 0 640 195" style="width:100%;max-width:640px;height:auto;display:block;margin:0 auto;" role="img" aria-label="广角拉伸纵深与长焦压缩层次的几何对比">
    <g>
      <rect x="10" y="10" width="295" height="140" rx="8" fill="#0b242d" stroke="rgba(174,215,211,0.14)" />
      <polygon points="28,80 286,20 286,140" fill="rgba(127,196,200,0.08)" />
      <line x1="28" y1="80" x2="286" y2="20" stroke="#9fb6b8" stroke-width="1" stroke-dasharray="4 3" />
      <line x1="28" y1="80" x2="286" y2="140" stroke="#9fb6b8" stroke-width="1" stroke-dasharray="4 3" />
      <circle cx="28" cy="80" r="4" fill="#eb9f33" />
      <rect x="106" y="42" width="24" height="76" rx="2" fill="#3d7882" stroke="#e3eeec" stroke-width="1.5" />
      <rect x="184" y="61" width="14" height="38" rx="2" fill="#2c5d66" stroke="#b9d6d8" stroke-width="1.2" />
      <rect x="244" y="70" width="9" height="20" rx="2" fill="#1e444b" stroke="#9fb6b8" stroke-width="1" />
      <text x="157" y="170" text-anchor="middle" fill="#e3eeec" font-size="12" font-weight="600">广角张角大，纵深被明显拉伸</text>
      <text x="157" y="187" text-anchor="middle" fill="#9fb6b8" font-size="11">近大远小剧烈，前后距离感被放大</text>
    </g>
    <g>
      <rect x="335" y="10" width="295" height="140" rx="8" fill="#0b242d" stroke="rgba(174,215,211,0.14)" />
      <polygon points="353,80 611,56 611,104" fill="rgba(127,196,200,0.08)" />
      <line x1="353" y1="80" x2="611" y2="56" stroke="#9fb6b8" stroke-width="1" stroke-dasharray="4 3" />
      <line x1="353" y1="80" x2="611" y2="104" stroke="#9fb6b8" stroke-width="1" stroke-dasharray="4 3" />
      <circle cx="353" cy="80" r="4" fill="#eb9f33" />
      <rect x="468" y="48" width="20" height="64" rx="2" fill="#3d7882" stroke="#e3eeec" stroke-width="1.5" />
      <rect x="518" y="53" width="17" height="54" rx="2" fill="#2c5d66" stroke="#b9d6d8" stroke-width="1.2" />
      <rect x="564" y="57" width="15" height="46" rx="2" fill="#1e444b" stroke="#9fb6b8" stroke-width="1" />
      <text x="482" y="170" text-anchor="middle" fill="#e3eeec" font-size="12" font-weight="600">长焦张角窄，前后层次被压缩</text>
      <text x="482" y="187" text-anchor="middle" fill="#9fb6b8" font-size="11">近远大小接近，景物紧凑叠压在一起</text>
    </g>
  </svg>
</div>

这种空间感受不仅属于相机，也适用于绘画与平面设计。插画里把人物伸向画面前的手画得很大、身体退后很小，借用的是广角逻辑；浮世绘或扁平风风景画把远山、行人和屋檐密密排在一起，依靠色块叠压交代前后，走的则是长焦压缩的路线。

## 取景时先找视平线

透视尺规、灭点、空气衰减和焦段选择，归根结底都是在安排同一件事：人在画面里站在哪里，视线往哪儿走。

站在高楼窗边或者看着傍晚的楼群山脊时，可以先找自己眼睛所在的视平线高度，再留意最远处的暗部比近处浅了多少、哪些轮廓已经融进了天光。把这几处关系摆对，画面的空间感自然就有了。
