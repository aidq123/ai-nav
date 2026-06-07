/**
 * tools-data.js
 * 静态兜底数据：当 API 无法访问时自动降级使用
 * 部署时此文件可选，有 API 后建议删除或保留作备份
 */
const FALLBACK_TOOLS = [
  // AI对话
  {id:1, name:'ChatGPT', cat:'chat', logo:'🤖', url:'https://chat.openai.com', desc:'OpenAI出品的顶级AI对话模型，支持多轮对话、图像理解、代码生成', tags:['免费/付费','最热门'], badge:'hot', featured:true},
  {id:2, name:'Claude', cat:'chat', logo:'✦', url:'https://claude.ai', desc:'Anthropic出品，擅长长文理解和写作，上下文窗口超长', tags:['免费/付费','文章写作'], badge:'new'},
  {id:3, name:'Gemini', cat:'chat', logo:'♊', url:'https://gemini.google.com', desc:'谷歌最新多模态AI，融合搜索能力，实时联网信息', tags:['免费','谷歌出品'], badge:'hot'},
  {id:4, name:'文心一言', cat:'chat', logo:'文', url:'https://yiyan.baidu.com', desc:'百度出品的国产大模型，支持中文理解写作和知识问答', tags:['免费','国内可用'], badge:''},
  {id:5, name:'通义千问', cat:'chat', logo:'通', url:'https://qianwen.aliyun.com', desc:'阿里云出品大模型，支持文本、图片、语音多模态能力', tags:['免费','国内可用'], badge:''},
  {id:6, name:'讯飞星火', cat:'chat', logo:'⚡', url:'https://xinghuo.xfyun.cn', desc:'科大讯飞出品，语音识别领域领先，支持语音对话', tags:['免费','国内可用'], badge:''},
  {id:7, name:'Kimi', cat:'chat', logo:'K', url:'https://kimi.moonshot.cn', desc:'月之暗面出品，超长上下文支持，可分析200万字文档', tags:['免费','长上下文'], badge:'hot'},
  {id:8, name:'DeepSeek', cat:'chat', logo:'D', url:'https://chat.deepseek.com', desc:'深度求索出品，强大的推理能力，特别擅长数学和代码', tags:['免费','推理强'], badge:'new', featured:true},
  {id:9, name:'豆包', cat:'chat', logo:'🫘', url:'https://www.doubao.com', desc:'字节跳动出品AI助手，日常对话体验好，支持多种场景', tags:['免费','字节出品'], badge:''},
  {id:10, name:'Perplexity AI', cat:'chat', logo:'P', url:'https://www.perplexity.ai', desc:'基于AI的智能搜索引擎，实时联网搜索并给出带引用的答案', tags:['免费/付费','联网搜索'], badge:'hot'},
  {id:11, name:'智谱清言', cat:'chat', logo:'智', url:'https://chatglm.cn', desc:'清华技术成果转化，GLM系列大模型，中文能力强', tags:['免费','国内可用'], badge:''},
  {id:12, name:'元宝', cat:'chat', logo:'元', url:'https://yuanbao.tencent.com', desc:'腾讯出品AI助手，集成微信生态，支持多场景应用', tags:['免费','腾讯出品'], badge:'new'},

  // AI绘图
  {id:21, name:'Midjourney', cat:'image', logo:'🎨', url:'https://www.midjourney.com', desc:'全球最受欢迎的AI绘图工具，生成效果精美，风格多样', tags:['付费','最强绘图'], badge:'hot', featured:true},
  {id:22, name:'Stable Diffusion', cat:'image', logo:'🌊', url:'https://stability.ai', desc:'开源图像生成模型，支持本地部署，自定义程度高', tags:['免费','开源'], badge:''},
  {id:23, name:'DALL·E 3', cat:'image', logo:'🎭', url:'https://openai.com/dall-e-3', desc:'OpenAI出品，理解自然语言描述生成高质量图像', tags:['付费','OpenAI'], badge:''},
  {id:24, name:'Adobe Firefly', cat:'image', logo:'🦋', url:'https://firefly.adobe.com', desc:'Adobe出品，商用安全，无版权问题，与PS无缝集成', tags:['免费/付费','商用安全'], badge:''},
  {id:25, name:'Ideogram', cat:'image', logo:'I', url:'https://ideogram.ai', desc:'擅长生成含文字的图像，海报设计效果出色', tags:['免费/付费','含文字'], badge:'new'},
  {id:26, name:'Leonardo.AI', cat:'image', logo:'🎯', url:'https://leonardo.ai', desc:'游戏资产和艺术创作AI工具，拥有丰富的预设风格', tags:['免费/付费','游戏美术'], badge:''},
  {id:27, name:'文心一格', cat:'image', logo:'格', url:'https://yige.baidu.com', desc:'百度出品AI绘画平台，中文prompt理解好，国内直接访问', tags:['免费/付费','国内可用'], badge:''},
  {id:28, name:'通义万相', cat:'image', logo:'相', url:'https://tongyi.aliyun.com/wanxiang', desc:'阿里通义系列AI绘画工具，支持多种艺术风格', tags:['免费','国内可用'], badge:''},

  // AI视频
  {id:41, name:'Sora', cat:'video', logo:'🎬', url:'https://openai.com/sora', desc:'OpenAI视频生成模型，文本生成高质量视频，效果震撼', tags:['付费','革命性'], badge:'hot', featured:true},
  {id:42, name:'Runway Gen-3', cat:'video', logo:'▶️', url:'https://runwayml.com', desc:'专业级AI视频生成编辑工具，被影视行业广泛采用', tags:['付费','专业级'], badge:'hot'},
  {id:43, name:'Pika', cat:'video', logo:'P', url:'https://pika.art', desc:'AI视频生成新秀，支持文本/图片生成短视频，效果生动', tags:['免费/付费','新锐'], badge:'new'},
  {id:44, name:'HeyGen', cat:'video', logo:'🎤', url:'https://www.heygen.com', desc:'AI数字人视频生成，对口型精准，多语言支持', tags:['付费','数字人'], badge:''},
  {id:45, name:'剪映 AI', cat:'video', logo:'✂️', url:'https://lv.ulikecam.com', desc:'字节旗下视频剪辑工具，AI自动配字幕、配乐、特效', tags:['免费/付费','国内可用'], badge:''},

  // AI编程
  {id:61, name:'GitHub Copilot', cat:'code', logo:'🤖', url:'https://github.com/features/copilot', desc:'GitHub官方AI编程助手，代码补全精准，支持全语言', tags:['付费','最强编码'], badge:'hot', featured:true},
  {id:62, name:'Cursor', cat:'code', logo:'✧', url:'https://cursor.sh', desc:'AI原生代码编辑器，理解整个项目上下文，重构代码利器', tags:['免费/付费','编辑器'], badge:'hot'},
  {id:63, name:'Codeium', cat:'code', logo:'C', url:'https://codeium.com', desc:'免费AI代码补全工具，支持70+编程语言，可本地部署', tags:['免费','开源友好'], badge:''},
  {id:64, name:'通义灵码', cat:'code', logo:'码', url:'https://tongyi.aliyun.com/lingma', desc:'阿里出品免费AI编码助手，支持VS Code/JetBrains全系列', tags:['免费','国内可用'], badge:''},
  {id:65, name:'Replit AI', cat:'code', logo:'R', url:'https://replit.com', desc:'在线IDE+AI编程，零配置开发环境，AI辅助写代码', tags:['免费/付费','在线IDE'], badge:''},
  {id:66, name:'Claude Code', cat:'code', logo:'✦', url:'https://claude.ai/code', desc:'Claude专为编程优化的版本，代码解释和生成能力强', tags:['付费','代码专用'], badge:'new'},

  // AI写作
  {id:81, name:'Notion AI', cat:'write', logo:'N', url:'https://www.notion.so/product/ai', desc:'Notion内置AI助手，在笔记中直接续写、润色、翻译', tags:['付费','笔记集成'], badge:'hot'},
  {id:82, name:'Jasper AI', cat:'write', logo:'J', url:'https://www.jasper.ai', desc:'营销文案AI写作工具，支持30+语言，模板丰富', tags:['付费','营销文案'], badge:''},
  {id:83, name:'Grammarly', cat:'write', logo:'G', url:'https://www.grammarly.com', desc:'AI英语语法检查和写作改进工具，实时纠错建议', tags:['免费/付费','英语写作'], badge:''},
  {id:84, name:'秘塔写作猫', cat:'write', logo:'猫', url:'https://xiezuocat.com', desc:'中文AI写作助手，语法纠错、润色、续写一体化', tags:['免费/付费','中文写作'], badge:''},
  {id:85, name:'迅捷写作', cat:'write', logo:'迅', url:'https://www.xunjiepdf.com/xiezuo', desc:'AI长文写作工具，论文、报告、方案一键生成', tags:['付费','长文写作'], badge:''},

  // AI音频
  {id:101, name:'Suno AI', cat:'audio', logo:'🎵', url:'https://suno.ai', desc:'AI音乐生成工具，输入描述即可生成完整歌曲带人声', tags:['免费/付费','AI作曲'], badge:'hot', featured:true},
  {id:102, name:'ElevenLabs', cat:'audio', logo:'🎧', url:'https://elevenlabs.io', desc:'AI语音合成天花板，克隆声音逼真，支持29种语言', tags:['付费','语音克隆'], badge:'hot'},
  {id:103, name:'Mubert', cat:'audio', logo:'M', url:'https://mubert.com', desc:'AI生成背景音乐，可按场景、情绪、时长生成免版税音乐', tags:['免费/付费','背景音乐'], badge:''},
  {id:104, name:'Whisper', cat:'audio', logo:'W', url:'https://openai.com/whisper', desc:'OpenAI开源语音识别模型，多语言转录准确率极高', tags:['免费','开源'], badge:''},

  // AI搜索
  {id:121, name:'Perplexity', cat:'search', logo:'P', url:'https://www.perplexity.ai', desc:'AI搜索引擎，直接给出答案并附带来源引用', tags:['免费/付费','搜索革新'], badge:'hot'},
  {id:122, name:'Phind', cat:'search', logo:'🔍', url:'https://www.phind.com', desc:'面向开发者的AI搜索引擎，技术问题解答精准', tags:['免费','开发者'], badge:''},
  {id:123, name:'秘塔AI搜索', cat:'search', logo:'秘', url:'https://metaso.cn', desc:'国产AI搜索引擎，无广告，直接给答案，国内网络可用', tags:['免费','国内可用'], badge:'new'},
  {id:124, name:'Consensus', cat:'search', logo:'C', url:'https://consensus.app', desc:'AI学术搜索引擎，直接从论文中找答案', tags:['免费/付费','学术搜索'], badge:''},

  // AI办公
  {id:141, name:'Gamma', cat:'ppt', logo:'📊', url:'https://gamma.app', desc:'AI生成PPT，输入主题自动生成完整演示文稿', tags:['免费/付费','AI PPT'], badge:'hot'},
  {id:142, name:'Beautiful.ai', cat:'ppt', logo:'B', url:'https://www.beautiful.ai', desc:'智能PPT设计工具，自动调整排版，模板精美', tags:['付费','PPT设计'], badge:''},
  {id:143, name:'飞书妙计', cat:'ppt', logo:'飞', url:'https://feishu.cn/product/miaobi', desc:'字节飞书AI助手，会议记录、文档写作、智能表格', tags:['免费/付费','国内可用'], badge:''},
  {id:144, name:'Microsoft 365 Copilot', cat:'ppt', logo:'M', url:'https://www.microsoft.com/microsoft-copilot', desc:'微软Office AI助手，Word/Excel/PPT全系列AI增强', tags:['付费','Office集成'], badge:''},

  // AI设计
  {id:161, name:'Canva AI', cat:'design', logo:'C', url:'https://www.canva.com', desc:'在线设计平台，AI生成图片、排版、视频，模板超多', tags:['免费/付费','设计神器'], badge:'hot'},
  {id:162, name:'Figma AI', cat:'design', logo:'F', url:'https://www.figma.com', desc:'设计师必备UI设计工具，AI辅助生成图层、组件、原型', tags:['付费','UI设计'], badge:''},
  {id:163, name:'Uizard', cat:'design', logo:'U', url:'https://uizard.io', desc:'AI将手绘稿转成可交互原型，产品设计提速神器', tags:['免费/付费','原型设计'], badge:'new'},
  {id:164, name:'Recraft', cat:'design', logo:'R', url:'https://www.recraft.ai', desc:'AI矢量插图生成，可商用，风格统一，非常适合品牌设计', tags:['免费/付费','矢量插图'], badge:''},

  // AI翻译
  {id:181, name:'DeepL', cat:'translate', logo:'D', url:'https://www.deepl.com', desc:'全球最准确的AI翻译工具，支持30+语言，保留原文语气', tags:['免费/付费','最强翻译'], badge:'hot'},
  {id:182, name:'沉浸式翻译', cat:'translate', logo:'沉', url:'https://immersivetranslate.com', desc:'浏览器双语对照翻译插件，网页/PDF/字幕一站式翻译', tags:['免费','浏览器插件'], badge:''},
  {id:183, name:'腾讯翻译君', cat:'translate', logo:'译', url:'https://fanyi.qq.com', desc:'腾讯AI翻译，支持文本/图片/语音翻译，国内网络友好', tags:['免费','国内可用'], badge:''},

  // AI学习
  {id:201, name:'Coursera Coach', cat:'edu', logo:'C', url:'https://www.coursera.org', desc:'Coursera的AI学习助手，个性化学习路径推荐', tags:['免费/付费','在线课程'], badge:''},
  {id:202, name:' Khan Academy Khanmigo', cat:'edu', logo:'K', url:'https://www.khanacademy.org', desc:'可汗学院AI导师，中小学全科AI辅导', tags:['免费','K12教育'], badge:''},
  {id:203, name:'Question.AI', cat:'edu', logo:'Q', url:'https://www.questionai.com', desc:'拍题答疑AI，数学物理化学生物全科覆盖', tags:['免费/付费','拍题答疑'], badge:''},

  // AI智能体
  {id:221, name:'AutoGPT', cat:'agent', logo:'🤖', url:'https://github.com/Significant-Gravitas/AutoGPT', desc:'开源自主AI智能体，自动拆解任务并执行', tags:['免费','开源'], badge:''},
  {id:222, name:'Dify', cat:'agent', logo:'D', url:'https://dify.ai', desc:'开源AI应用构建平台，可视化搭建AI工作流和智能体', tags:['免费/付费','工作流'], badge:'hot'},
  {id:223, name:'Coze', cat:'agent', logo:'C', url:'https://www.coze.com', desc:'字节跳动出品AI Bot搭建平台，无代码构建AI智能体', tags:['免费','国内可用'], badge:''},
  {id:224, name:'LangChain', cat:'agent', logo:'L', url:'https://www.langchain.com', desc:'AI智能体开发框架，Python/JS双语言支持', tags:['免费','开发者框架'], badge:''},

  // AI 3D
  {id:241, name:'Luma AI', cat:'3d', logo:'🧊', url:'https://lumalabs.ai', desc:'AI 3D生成，文本或图片生成3D模型，质量极高', tags:['免费/付费','3D生成'], badge:'hot'},
  {id:242, name:'Meshy', cat:'3d', logo:'M', url:'https://www.meshy.ai', desc:'AI 3D建模工具，文本生成3D模型，支持游戏引擎导出', tags:['免费/付费','游戏美术'], badge:''},
  {id:243, name:'Spline AI', cat:'3d', logo:'S', url:'https://spline.design', desc:'AI辅助3D设计工具，网页端实时协作，适合交互3D场景', tags:['免费/付费','网页3D'], badge:''},
];
