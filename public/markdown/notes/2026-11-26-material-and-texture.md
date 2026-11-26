# [设计] 物体的质感、高光与半透光

用手去摸之前，眼睛就已经能分辨一块粗陶、一只釉面瓷碗、一根黄铜烛台和一块温润的玉石。这种判断不需要懂什么材料学，全靠大脑对光线行为的长期经验——光落在表面时，有多少直接弹回眼睛，有多少钻进表层再散出来，高光边缘是锐利还是糊开，轮廓边沿有没有泛起一层天光。

## 漫反射和镜面反射

光线照到物体表面时，通常会分成两路。一部分在空气与物体交界的表层直接弹开，叫作**镜面反射**；另一部分穿过表层进入材质内部，和颜料颗粒或纤维反复碰撞后再向四面八方射出，叫作**漫反射**。平时说的“固有色”，主要来自漫反射带出的颜色；表面亮晶晶的反光，则属于镜面反射。

在绘画和观察中，**非金属**与**金属**的差别在这里表现得最明显。

- **非金属（陶瓷、塑料、漆器、树叶、皮肤）**，镜面反射发生在最外层，光线还没来得及接触内部色素就弹回来了，所以高光基本保持光源本身的颜色（在日光或白炽灯下接近白或暖白），固有色则留在漫反射的受光面与中间调里。
- **金属（金、银、铜、铁）**，金属内部的自由电子会直接和光线作用，几乎没有漫反射。光线在表层被选择性地吸收和反射，因此金属的高光本身就带着金属的颜色——黄金的高光是暖金色，红铜的高光是橙红色，白银接近无色。抛光金属的暗部显得很深，也是因为它像镜子一样映出了周围较暗的环境。

<div style="background:#102b34;border:1px solid rgba(174,215,211,0.18);border-radius:12px;padding:18px;margin:20px 0;">
  <svg viewBox="0 0 600 220" style="width:100%;max-width:600px;height:auto;display:block;margin:0 auto;" role="img" aria-label="非金属与金属的漫反射与镜面反射差异示意">
    <g transform="translate(20,16)">
      <rect x="0" y="0" width="265" height="188" rx="10" fill="#0b242d" stroke="rgba(174,215,211,0.14)" />
      <text x="132" y="24" text-anchor="middle" fill="#e3eeec" font-size="13" font-weight="600">非金属（如釉面青瓷）</text>
      <rect x="24" y="108" width="217" height="58" rx="6" fill="#2c6f73" opacity="0.88" />
      <line x1="24" y1="108" x2="241" y2="108" stroke="#9fd3d6" stroke-width="2" />
      <line x1="58" y1="44" x2="108" y2="108" stroke="#f5efe0" stroke-width="2" />
      <line x1="108" y1="108" x2="158" y2="44" stroke="#f5efe0" stroke-width="2" />
      <polygon points="158,44 149,49 155,54" fill="#f5efe0" />
      <path d="M 108 108 L 120 132 L 106 146 L 94 128 Z" fill="none" stroke="#6cc2c7" stroke-width="1.3" opacity="0.7" />
      <line x1="106" y1="146" x2="72" y2="72" stroke="#6cc2c7" stroke-width="1.6" />
      <line x1="120" y1="132" x2="176" y2="76" stroke="#6cc2c7" stroke-width="1.6" />
      <line x1="112" y1="126" x2="124" y2="66" stroke="#6cc2c7" stroke-width="1.6" />
      <text x="165" y="42" fill="#f5efe0" font-size="11">白色高光（光源色）</text>
      <text x="132" y="180" text-anchor="middle" fill="#9fb6b8" font-size="11">内部散射带出青绿固有色</text>
    </g>
    <g transform="translate(315,16)">
      <rect x="0" y="0" width="265" height="188" rx="10" fill="#0b242d" stroke="rgba(174,215,211,0.14)" />
      <text x="132" y="24" text-anchor="middle" fill="#e3eeec" font-size="13" font-weight="600">金属（如抛光黄铜）</text>
      <rect x="24" y="108" width="217" height="58" rx="6" fill="#6b5126" opacity="0.92" />
      <line x1="24" y1="108" x2="241" y2="108" stroke="#ecc46b" stroke-width="2.2" />
      <line x1="58" y1="44" x2="112" y2="108" stroke="#f5efe0" stroke-width="2" />
      <line x1="112" y1="108" x2="168" y2="44" stroke="#ecc46b" stroke-width="2.4" />
      <polygon points="168,44 159,49 165,54" fill="#ecc46b" />
      <line x1="88" y1="54" x2="128" y2="108" stroke="#f5efe0" stroke-width="1.5" opacity="0.7" />
      <line x1="128" y1="108" x2="188" y2="54" stroke="#e2a84b" stroke-width="1.8" opacity="0.85" />
      <text x="174" y="42" fill="#ecc46b" font-size="11">带色高光（金属本色）</text>
      <text x="132" y="180" text-anchor="middle" fill="#9fb6b8" font-size="11">几乎无漫反射，暗部映出环境</text>
    </g>
  </svg>
</div>

把同色系的非金属与金属球体并排放在一起，差别就很清楚了。釉面青瓷的高光是一小点干脆的亮白，球体本身靠青绿色的明暗过渡撑起体积；黄铜的高光泛着金黄，暗部比瓷球压得更深，靠亮部与边缘反光的剧烈对比传达出金属感。

<div style="background:#102b34;border:1px solid rgba(174,215,211,0.18);border-radius:12px;padding:18px;margin:20px 0;">
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;text-align:center;">
    <div style="background:#0b242d;border:1px solid rgba(174,215,211,0.14);border-radius:10px;padding:16px;">
      <div style="width:88px;height:88px;border-radius:50%;margin:0 auto 12px;background:radial-gradient(circle at 32% 30%,#77b6ba 0%,#3a7f84 42%,#1c4a4e 78%,#122f33 100%);box-shadow:0 8px 18px rgba(0,0,0,0.35);"></div>
      <div style="font-size:12px;color:#e3eeec;font-weight:600;">哑光粗陶</div>
      <div style="font-size:11px;color:#9fb6b8;margin-top:4px;">漫反射为主，受光柔和无锐利高光</div>
    </div>
    <div style="background:#0b242d;border:1px solid rgba(174,215,211,0.14);border-radius:10px;padding:16px;">
      <div style="width:88px;height:88px;border-radius:50%;margin:0 auto 12px;background:radial-gradient(circle at 29% 27%,#ffffff 0%,#f4fbfb 5%,#479197 16%,#28696e 56%,#13383b 86%,#1b4b4f 100%);box-shadow:0 8px 18px rgba(0,0,0,0.35);"></div>
      <div style="font-size:12px;color:#e3eeec;font-weight:600;">釉面青瓷</div>
      <div style="font-size:11px;color:#9fb6b8;margin-top:4px;">漫反射显青色，表层叠加白高光</div>
    </div>
    <div style="background:#0b242d;border:1px solid rgba(174,215,211,0.14);border-radius:10px;padding:16px;">
      <div style="width:88px;height:88px;border-radius:50%;margin:0 auto 12px;background:radial-gradient(circle at 30% 28%,#fff2b8 0%,#f0c65c 12%,#a37424 44%,#2f210a 78%,#6e5020 100%);box-shadow:0 8px 18px rgba(0,0,0,0.35);"></div>
      <div style="font-size:12px;color:#e3eeec;font-weight:600;">抛光黄铜</div>
      <div style="font-size:11px;color:#9fb6b8;margin-top:4px;">高光偏金黄，明暗反差剧烈</div>
    </div>
  </div>
</div>

十七世纪荷兰静物画家威廉·克莱斯·赫达尤其擅长把多种材质塞进同一张餐桌。在《镀金高脚杯静物》里，镀金银杯的亮斑带着暖黄金属色，锡镴盘子泛着沉郁的冷灰微光，透明玻璃杯则只靠几笔干净的白色窗口反光勾出轮廓，一旁剥开的柠檬皮则用细碎的颗粒感留住漫反射的暖黄。

<div style="background:#102b34;border:1px solid rgba(174,215,211,0.18);border-radius:12px;padding:16px;margin:20px 0;">
  <img src="/img/notes/material-texture/heda-still-life.jpg" alt="威廉·克莱斯·赫达《镀金高脚杯静物》" style="width:100%;max-height:340px;object-fit:cover;border-radius:8px;display:block;" />
  <div style="font-size:12px;color:#9fb6b8;text-align:center;margin-top:10px;">威廉·克莱斯·赫达《镀金高脚杯静物》（1635），同桌摆出金属的带色反光、玻璃的纯白高光和柠檬皮的颗粒漫反射</div>
</div>

## 表面越糙，高光越散

只分清金属和非金属还不够。同样是银器，镜面抛光的银壶像一面镜子，磨砂拉丝的银杯只泛出一层柔光；同样是陶土，上了亮釉会反光，素烧粗陶显得干燥吸光。这背后是表面在微观尺度上的**粗糙度**。

现实中没有绝对平整的表面。在放大镜下，物体表层由无数极其细小的凹凸微面组成。当表面足够光滑时，这些微面朝向几乎一致，平行射来的光线会整齐地朝同一个方向反射，在人眼里形成面积很小、亮度极高、边界清晰的高光点。

当表面变得粗糙，微面朝向四面八方倾斜，同一束入射光会被打散成一片宽阔的反射光锥。于是高光的面积变大、边缘变散、峰值亮度随之降下来，变成一层朦胧柔和的亮斑。总反射光量并没有凭空消失，只是被摊薄到了更大的区域上。

<div style="background:#102b34;border:1px solid rgba(174,215,211,0.18);border-radius:12px;padding:18px;margin:20px 0;">
  <svg viewBox="0 0 600 205" style="width:100%;max-width:600px;height:auto;display:block;margin:0 auto;" role="img" aria-label="表面粗糙度对反射光锥与高光形态的影响">
    <g transform="translate(15,14)">
      <rect x="0" y="0" width="176" height="176" rx="10" fill="#0b242d" stroke="rgba(174,215,211,0.14)" />
      <text x="88" y="24" text-anchor="middle" fill="#e3eeec" font-size="12" font-weight="600">光滑（低粗糙度）</text>
      <line x1="22" y1="126" x2="154" y2="126" stroke="#7ec7cb" stroke-width="2.5" />
      <line x1="38" y1="54" x2="78" y2="124" stroke="#f5efe0" stroke-width="1.5" opacity="0.7" />
      <line x1="54" y1="54" x2="94" y2="124" stroke="#f5efe0" stroke-width="1.5" opacity="0.7" />
      <line x1="78" y1="124" x2="118" y2="54" stroke="#e3eeec" stroke-width="2" />
      <line x1="94" y1="124" x2="134" y2="54" stroke="#e3eeec" stroke-width="2" />
      <ellipse cx="88" cy="148" rx="10" ry="5" fill="#ffffff" />
      <text x="88" y="168" text-anchor="middle" fill="#9fb6b8" font-size="11">光斑小而锐利</text>
    </g>
    <g transform="translate(212,14)">
      <rect x="0" y="0" width="176" height="176" rx="10" fill="#0b242d" stroke="rgba(174,215,211,0.14)" />
      <text x="88" y="24" text-anchor="middle" fill="#e3eeec" font-size="12" font-weight="600">半哑光（中粗糙度）</text>
      <polyline points="22,126 36,122 50,128 64,121 78,127 92,122 106,128 120,121 134,127 154,125" fill="none" stroke="#7ec7cb" stroke-width="2.2" />
      <line x1="38" y1="54" x2="78" y2="124" stroke="#f5efe0" stroke-width="1.5" opacity="0.7" />
      <line x1="54" y1="54" x2="94" y2="124" stroke="#f5efe0" stroke-width="1.5" opacity="0.7" />
      <line x1="78" y1="124" x2="104" y2="50" stroke="#e3eeec" stroke-width="1.5" opacity="0.85" />
      <line x1="86" y1="124" x2="126" y2="52" stroke="#e3eeec" stroke-width="1.5" opacity="0.85" />
      <line x1="94" y1="124" x2="146" y2="66" stroke="#e3eeec" stroke-width="1.5" opacity="0.85" />
      <ellipse cx="88" cy="148" rx="24" ry="7" fill="#d9ecec" opacity="0.7" />
      <text x="88" y="168" text-anchor="middle" fill="#9fb6b8" font-size="11">光斑变宽、边缘柔和</text>
    </g>
    <g transform="translate(409,14)">
      <rect x="0" y="0" width="176" height="176" rx="10" fill="#0b242d" stroke="rgba(174,215,211,0.14)" />
      <text x="88" y="24" text-anchor="middle" fill="#e3eeec" font-size="12" font-weight="600">粗糙（高粗糙度）</text>
      <polyline points="22,126 32,116 42,131 52,115 62,130 72,117 82,132 92,114 102,130 112,116 122,131 132,117 142,129 154,125" fill="none" stroke="#7ec7cb" stroke-width="2" />
      <line x1="38" y1="54" x2="78" y2="124" stroke="#f5efe0" stroke-width="1.5" opacity="0.7" />
      <line x1="54" y1="54" x2="94" y2="124" stroke="#f5efe0" stroke-width="1.5" opacity="0.7" />
      <line x1="78" y1="124" x2="54" y2="68" stroke="#e3eeec" stroke-width="1.2" opacity="0.55" />
      <line x1="84" y1="124" x2="92" y2="54" stroke="#e3eeec" stroke-width="1.2" opacity="0.55" />
      <line x1="90" y1="124" x2="128" y2="60" stroke="#e3eeec" stroke-width="1.2" opacity="0.55" />
      <line x1="96" y1="124" x2="152" y2="84" stroke="#e3eeec" stroke-width="1.2" opacity="0.55" />
      <ellipse cx="88" cy="148" rx="40" ry="8" fill="#9fb6b8" opacity="0.35" />
      <text x="88" y="168" text-anchor="middle" fill="#9fb6b8" font-size="11">散成一片柔光，无明显光点</text>
    </g>
  </svg>
</div>

画静物时常有一个规律：想让一件物体显得“硬”或“湿”，往往要把高光画得小而聚，并且把周围的明度压下去；想让它显得“软”或“干”，就把高光晕开，让亮部到中间调的过渡拉长。如果表面还有方向性纹理——比如拉丝不锈钢的细密划痕，或丝绸织物的经纬线——高光还会沿着与纹理垂直的方向拉成一条细长的光带。

<div style="background:#102b34;border:1px solid rgba(174,215,211,0.18);border-radius:12px;padding:18px;margin:20px 0;">
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;text-align:center;">
    <div>
      <div style="height:68px;border-radius:8px;background:radial-gradient(circle at 35% 32%,#ffffff 0%,#e8f4f4 4%,#23575c 14%,#123135 100%);border:1px solid rgba(174,215,211,0.15);"></div>
      <div style="font-size:11px;color:#e3eeec;margin-top:8px;">镜面亮釉</div>
      <div style="font-size:10px;color:#9fb6b8;">光斑小 · 边界硬</div>
    </div>
    <div>
      <div style="height:68px;border-radius:8px;background:radial-gradient(circle at 35% 32%,#f0f7f7 0%,#83b9be 14%,#23575c 42%,#123135 100%);border:1px solid rgba(174,215,211,0.15);"></div>
      <div style="font-size:11px;color:#e3eeec;margin-top:8px;">丝光漆面</div>
      <div style="font-size:10px;color:#9fb6b8;">光晕扩散 · 过渡匀</div>
    </div>
    <div>
      <div style="height:68px;border-radius:8px;background:radial-gradient(circle at 35% 32%,#83b2b6 0%,#3c7075 34%,#1c4448 76%,#123135 100%);border:1px solid rgba(174,215,211,0.15);"></div>
      <div style="font-size:11px;color:#e3eeec;margin-top:8px;">磨砂石膏</div>
      <div style="font-size:10px;color:#9fb6b8;">大片柔光 · 对比低</div>
    </div>
    <div>
      <div style="height:68px;border-radius:8px;background:linear-gradient(125deg,#123135 20%,#26585d 44%,#d8ecec 50%,#26585d 56%,#123135 80%);border:1px solid rgba(174,215,211,0.15);"></div>
      <div style="font-size:11px;color:#e3eeec;margin-top:8px;">拉丝纹理</div>
      <div style="font-size:10px;color:#9fb6b8;">高光沿垂直方向拉长</div>
    </div>
  </div>
</div>

## 视角一平，水面就成了镜子

站在湖边低头看脚下的水，能清清楚楚看见水底的鹅卵石；把视线抬平望向远方水面时，水底突然看不见了，整个湖面像银镜一样映出天空和远山。玻璃窗、桌面清漆、潮湿的柏油路都有同样的脾气。

这种随观察角度改变反射强弱的规律，在光学里叫作**菲涅耳现象**。光线几乎垂直射入非金属表面时，绝大部分会穿过表面进入内部（或发生漫反射），只有很小一部分在表层弹回；视线与表面越来越平，几乎擦着表面掠过时，反射率会迅速攀升，逼近百分之百，把水底或物体原本的颜色遮住。

<div style="background:#102b34;border:1px solid rgba(174,215,211,0.18);border-radius:12px;padding:18px;margin:20px 0;">
  <svg viewBox="0 0 600 195" style="width:100%;max-width:600px;height:auto;display:block;margin:0 auto;" role="img" aria-label="菲涅耳现象：垂直视角透射为主，掠射角反射急剧增强">
    <g transform="translate(20,14)">
      <rect x="0" y="0" width="320" height="168" rx="10" fill="#0b242d" stroke="rgba(174,215,211,0.14)" />
      <rect x="16" y="102" width="288" height="50" rx="6" fill="#174952" />
      <line x1="16" y1="102" x2="304" y2="102" stroke="#7ec7cb" stroke-width="2" />
      <circle cx="88" cy="136" r="6" fill="#a2937e" />
      <circle cx="104" cy="139" r="5" fill="#7d8c82" />
      <line x1="74" y1="30" x2="92" y2="102" stroke="#e3eeec" stroke-width="1.8" />
      <line x1="92" y1="102" x2="104" y2="136" stroke="#85ced2" stroke-width="2" />
      <line x1="92" y1="102" x2="108" y2="38" stroke="#e3eeec" stroke-width="1" stroke-dasharray="3 3" opacity="0.55" />
      <text x="92" y="22" text-anchor="middle" fill="#9fb6b8" font-size="11">近垂直视角：约 2%–4% 反射，可见水底</text>
      <line x1="158" y1="68" x2="232" y2="102" stroke="#e3eeec" stroke-width="1.8" />
      <line x1="232" y1="102" x2="296" y2="72" stroke="#ffffff" stroke-width="2.8" />
      <polygon points="296,72 287,71 290,79" fill="#ffffff" />
      <text x="235" y="56" text-anchor="middle" fill="#e3eeec" font-size="11">掠射角：反射急剧增强</text>
      <text x="235" y="128" text-anchor="middle" fill="#9fb6b8" font-size="11">水面化作镜面</text>
    </g>
    <g transform="translate(360,14)">
      <rect x="0" y="0" width="220" height="168" rx="10" fill="#0b242d" stroke="rgba(174,215,211,0.14)" />
      <defs>
        <radialGradient id="fresnelRim" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#193b42" />
          <stop offset="68%" stop-color="#1d4d54" />
          <stop offset="88%" stop-color="#4e8f96" />
          <stop offset="100%" stop-color="#cbe7e6" />
        </radialGradient>
      </defs>
      <circle cx="110" cy="82" r="50" fill="url(#fresnelRim)" />
      <text x="110" y="150" text-anchor="middle" fill="#9fb6b8" font-size="11">曲面轮廓处视线趋近掠射，边缘泛起天光</text>
    </g>
  </svg>
</div>

对于球体、人体或花瓶这类曲面物体，正对眼睛的中心区域接近垂直视角，轮廓边缘处则天然处于掠射角。哪怕光源不在物体背后，曲面最外圈往往也会泛起一圈淡淡的天光或环境亮边。人物头发边缘的丝光、深色天鹅绒转折处的银灰、暗色陶器轮廓上那道细微的反光，背后都是菲涅耳效应在起作用。

库尔贝在《海浪》里把这种明暗和透光对比画得很直白。浪谷正对着观众、角度较陡的地方，光线深入水体内部，呈现深沉厚重的青绿；越往浪峰和远方水面平铺过去，视线趋近掠射角，海水表面承接了大片冷亮的天光；浪花打碎成无数泡沫后，又恢复成不透明的漫反射白。

<div style="background:#102b34;border:1px solid rgba(174,215,211,0.18);border-radius:12px;padding:16px;margin:20px 0;">
  <img src="/img/notes/material-texture/courbet-wave.jpg" alt="古斯塔夫·库尔贝《海浪》" style="width:100%;max-height:320px;object-fit:cover;border-radius:8px;display:block;" />
  <div style="font-size:12px;color:#9fb6b8;text-align:center;margin-top:10px;">古斯塔夫·库尔贝《海浪》（约 1869），陡直水体透出深青绿，平缓掠射水面反射冷亮天光，碎浪泡沫转为漫反射白</div>
</div>

## 半透光材质里的次表面散射

有些材质既不像石膏那样把光完全挡在表层外，也不像透明玻璃那样让光线笔直穿过去。玉石、大理石、蜡烛、树叶、牛奶和人的皮肤都属于这一类**半透光材质**。

光线照到这类表面时，一部分穿过表皮进入内部，在胶质、纤维或微晶结构里经历多次折射与散射，然后从入射点附近的另一处钻出表面。这种现象称为**次表面散射**。因为光在内部“绕了路”，明暗交界线不再像石膏几何体那样生硬，暗部边沿会透出一层柔和的暖意或材质本身的底色。

<div style="background:#102b34;border:1px solid rgba(174,215,211,0.18);border-radius:12px;padding:18px;margin:20px 0;">
  <svg viewBox="0 0 600 190" style="width:100%;max-width:600px;height:auto;display:block;margin:0 auto;" role="img" aria-label="不透明漫反射、透明折射与次表面散射的光路对比">
    <g transform="translate(15,14)">
      <rect x="0" y="0" width="176" height="162" rx="10" fill="#0b242d" stroke="rgba(174,215,211,0.14)" />
      <text x="88" y="24" text-anchor="middle" fill="#e3eeec" font-size="12" font-weight="600">不透明漫反射</text>
      <rect x="26" y="76" width="124" height="52" rx="8" fill="#637475" />
      <line x1="60" y1="36" x2="82" y2="76" stroke="#f5efe0" stroke-width="2" />
      <line x1="82" y1="76" x2="108" y2="42" stroke="#c8d3d4" stroke-width="1.6" />
      <line x1="82" y1="76" x2="54" y2="48" stroke="#c8d3d4" stroke-width="1.6" />
      <text x="88" y="148" text-anchor="middle" fill="#9fb6b8" font-size="11">表层即止，阴影边缘硬朗</text>
    </g>
    <g transform="translate(212,14)">
      <rect x="0" y="0" width="176" height="162" rx="10" fill="#0b242d" stroke="rgba(174,215,211,0.14)" />
      <text x="88" y="24" text-anchor="middle" fill="#e3eeec" font-size="12" font-weight="600">透明玻璃透射</text>
      <rect x="26" y="76" width="124" height="44" rx="8" fill="rgba(165,220,224,0.22)" stroke="#8fd0d4" stroke-width="1.4" />
      <line x1="56" y1="36" x2="78" y2="76" stroke="#f5efe0" stroke-width="2" />
      <line x1="78" y1="76" x2="92" y2="120" stroke="#c8f0f2" stroke-width="2" />
      <line x1="92" y1="120" x2="112" y2="146" stroke="#c8f0f2" stroke-width="2" />
      <text x="88" y="148" text-anchor="middle" fill="#9fb6b8" font-size="11">光路规律折射，影像清晰</text>
    </g>
    <g transform="translate(409,14)">
      <rect x="0" y="0" width="176" height="162" rx="10" fill="#0b242d" stroke="rgba(174,215,211,0.14)" />
      <text x="88" y="24" text-anchor="middle" fill="#e3eeec" font-size="12" font-weight="600">次表面散射</text>
      <defs>
        <radialGradient id="sssGlow" cx="50%" cy="35%" r="60%">
          <stop offset="0%" stop-color="#f29b72" />
          <stop offset="55%" stop-color="#b85a44" />
          <stop offset="100%" stop-color="#5d2d29" />
        </radialGradient>
      </defs>
      <rect x="26" y="76" width="124" height="52" rx="12" fill="url(#sssGlow)" />
      <line x1="56" y1="36" x2="78" y2="76" stroke="#f5efe0" stroke-width="2" />
      <path d="M 78 76 Q 92 106 112 94 T 134 76" fill="none" stroke="#ffd1a8" stroke-width="1.8" />
      <line x1="114" y1="76" x2="132" y2="46" stroke="#ffb38a" stroke-width="1.8" />
      <line x1="96" y1="76" x2="104" y2="44" stroke="#ffb38a" stroke-width="1.8" />
      <text x="88" y="148" text-anchor="middle" fill="#9fb6b8" font-size="11">内部漫散出暖光，过渡温润</text>
    </g>
  </svg>
</div>

日常最容易看到次表面散射的有三种东西。

- **玉石与大理石**，光线透进表皮一两毫米后散开，抹平了生硬的明暗交界线，结构在柔和的灰调里慢慢过渡，才显得温润。
- **逆光下的树叶**，正午站在树荫下抬头看，叶肉薄，阳光穿过后在叶绿素里散射出明亮的黄绿；较厚、木质化的叶脉挡住了光线，保持着深色轮廓。
- **逆光下的人耳与指缝**，强光从背后打过来时，耳朵边缘、鼻翼或并拢的手指缝隙会泛出透亮的暖红橙色。皮肤和软组织允许长波红光穿透并被毛细血管染暖，蓝绿光则在内部被吸收掉了。画肖像时，若暗部交界处画得太死黑，人物容易像石膏或木偶；在交界带叠进一点偏暖的半透明红橙，皮肤才显得有血色。

维米尔的《倒牛奶的女仆》把这几种质感放在同一扇窗光里。前景干硬的面包皮靠细碎颗粒感呈现漫反射；陶罐釉面留着温和的白色窗影；蓝布围裙吸光而厚重；悬挂的铜锅带着暖黄的金属反光；女仆面颊和手臂的暗部交界柔和过渡，没有石膏般的生硬折角。

<div style="background:#102b34;border:1px solid rgba(174,215,211,0.18);border-radius:12px;padding:16px;margin:20px 0;">
  <img src="/img/notes/material-texture/vermeer-milkmaid.jpg" alt="约翰内斯·维米尔《倒牛奶的女仆》" style="width:100%;max-height:380px;object-fit:cover;border-radius:8px;display:block;" />
  <div style="font-size:12px;color:#9fb6b8;text-align:center;margin-top:10px;">维米尔《倒牛奶的女仆》（约 1660），同一束侧窗光下的粗陶、面包皮、织物、黄铜与皮肤</div>
</div>

## 观察静物时的三个着眼点

辨认质感不必背光学公式，看一只茶杯、一片树叶或雨后的柏油路时，顺着三件事看就够了：

1. **高光落在哪里，什么颜色**，偏白往往是非金属的表层反光，带色多半是金属本身在反射。
2. **高光收得多紧**，光斑小而锐利，表面多半光滑坚硬；光斑摊得宽而散，表面就偏粗糙或柔软。
3. **边缘和薄处有没有变化**，轮廓和掠射面有没有泛起天光，暗部交界和逆光薄处有没有透出内部暖意。
