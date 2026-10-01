# 合成游戏图片来源

这些图片来自公开发布的奶龙截图和奶蛙社区表情包，已下载到 `images/`，游戏不依赖远程图床。图片及角色权利归原权利人所有；本项目不主张素材权利。

奶龙图组：[新浪 / 永久冰封思绪_，2026-07-04](https://www.sina.cn/news/detail/5316912472921026.html)。使用动画截图，保留原图，没有移除原图角落标识。

| 本地文件 | 原始图片 |
| --- | --- |
| dragon-0.jpg | https://wx2.sinaimg.cn/middle/005ORrUHgy1ierrzarl7sj30k00k040j.jpg |
| dragon-1.jpg | https://wx4.sinaimg.cn/middle/005ORrUHgy1ierrvrtz6bj30k00k040u.jpg |
| dragon-2.jpg | https://wx2.sinaimg.cn/middle/005ORrUHgy1ierrwfv0v6j30k00k0mz9.jpg |
| dragon-3.jpg | https://wx2.sinaimg.cn/middle/005ORrUHgy1ierrvr44q9j30k00k0mzb.jpg |
| dragon-4.jpg | https://wx3.sinaimg.cn/middle/005ORrUHgy1ierrvqfsn1j30k00k0gn6.jpg |
| dragon-5.jpg | https://wx3.sinaimg.cn/middle/005ORrUHgy1ierrvsxfh7j30k00k0q4r.jpg |
| dragon-6.jpg | https://wx2.sinaimg.cn/middle/005ORrUHgy1ierrzafr35j30k00k0goa.jpg |
| dragon-7.jpg | https://wx1.sinaimg.cn/middle/005ORrUHgy1ierrvuhqg0j30k00k03zx.jpg |
| dragon-8.jpg | https://wx1.sinaimg.cn/middle/005ORrUHgy1ierrvttwm6j30k00k2jtc.jpg |

奶蛙图组：[新浪 / 爱幼薇我摔倒了，2026-06-15](https://www.sina.cn/news/detail/5310033426647285.html)、[新浪 / 爱鲜虾鱼板面，2026-04-30](https://www.sina.cn/news/detail/5293372900116575.html)。西装奶蛙来自 [Marshall-Jimmy/naiwa-universe](https://github.com/Marshall-Jimmy/naiwa-universe)，该仓库说明其图片为社区迷因素材，图片权利归原权利人。

| 本地文件 | 原始图片 |
| --- | --- |
| frog-0.jpg | https://wx1.sinaimg.cn/middle/008ErEIGgy1icool0sewgj304b04ba9x.jpg |
| frog-1.jpg | https://wx3.sinaimg.cn/middle/006fvOR2gy1ie5u0h5w5jj30ut0u00u1.jpg |
| frog-2.jpg | https://wx4.sinaimg.cn/middle/006fvOR2gy1ie5tzz4zvbj30u00ubgn3.jpg |
| frog-3.jpg | https://wx4.sinaimg.cn/middle/006fvOR2gy1ie5u0lnc9vj30u00uf0uf.jpg |
| frog-4.jpg | https://wx4.sinaimg.cn/middle/006fvOR2gy1ie5u0oyam2j30u00uiq4a.jpg |
| frog-5.jpg | https://wx3.sinaimg.cn/middle/006fvOR2gy1ie5u052f77j30vx0u0jsv.jpg |
| frog-6.jpg | https://wx1.sinaimg.cn/middle/006fvOR2gy1ie5u106zaaj30vr0u075a.jpg |
| frog-7.jpg | https://raw.githubusercontent.com/Marshall-Jimmy/naiwa-universe/c3e6120b9fd79e83cdf2ab42f95839b4784d47dd/public/images/thinkerSuit.jpg |
| frog-8.jpg | https://wx1.sinaimg.cn/middle/006fvOR2gy1ie5u0dajkej30u00yi76q.jpg |

2026-10-01 补齐第 10–13 档，两个版本各 13 张不同的本地 JPEG，不再重复末档图片。奶龙补充来自 [新浪 / 寄给月亮的爱意LP](https://www.sina.cn/news/detail/5292767627712055.html)；奶蛙补充来自 [新浪 / jwr呀](https://www.sina.cn/news/detail/5329000809367043.html) 和 [新浪 / 命运如星轨般缠绕](https://www.sina.cn/news/detail/5332545027440769.html)。保留原图及角落标识，没有去水印。奶蛙保持黄色形象，不使用蓝色版本。

| 本地文件 | 原始图片 |
| --- | --- |
| dragon-9.jpg | https://wx3.sinaimg.cn/middle/008kN0ifgy1icmo9xqef0j30u00xi40u.jpg |
| dragon-10.jpg | https://wx1.sinaimg.cn/middle/008kN0ifgy1icmo9y4ch5j30u00wsjtf.jpg |
| dragon-11.jpg | https://wx2.sinaimg.cn/middle/008kN0ifgy1icmo9ywx9oj30u00z0mzt.jpg |
| dragon-12.jpg | https://wx3.sinaimg.cn/middle/008kN0ifgy1icmoa1ex0xj30u00t8dia.jpg |
| frog-9.jpg | https://wx3.sinaimg.cn/middle/005NuEBPly1ifucd5oakbj306k0870sm.jpg |
| frog-10.jpg | https://wx3.sinaimg.cn/middle/005NuEBPly1ifucd5fznej30el0ft3z6.jpg |
| frog-11.jpg | https://xinyewebsite.com/games/milk-frog/image/glimpse.jpg |
| frog-12.jpg | https://wx4.sinaimg.cn/middle/007YX4j9gy1ig5neev167j30a30ccglx.jpg |

第 12 档按用户选图换成 [辛野 / 奶蛙](https://xinyewebsite.com/games/milk-frog/) 的“惊鸿一瞥”无字原图，未修改图片。

运行 `node --experimental-strip-types scripts/test-merge-assets.mjs` 检查 13 档映射、JPEG 格式和文件内容去重。档位编号、尺寸和存档键不变，原存档无需迁移。

人工筛选：逐张检查原图和游戏圆形中心裁切。奶蛙新四档无大字文案、没有其他角色，动作和表情可区分；弃用了蓝色版本、带“防吃”“小妹妹你挺狂啊”“惊鸿三瞥”文案的图，以及解剖图、多人场景。来源原有的小水印保留，不做去水印。
