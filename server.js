/* ============================================
   个人工作台 · 本地代理服务器
   提供静态文件服务 + API 代理 (解决跨域)
   ============================================ */
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = __dirname;
const PORT = parseInt(process.env.PORT, 10) || 8080;
const cache = new Map();
const CACHE_TTL = 20 * 60 * 1000; // 20 分钟缓存

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function fetchJson(url, extraHeaders = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept': 'application/json', ...extraHeaders },
      signal: controller.signal,
    });
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function getCached(key, fetcher) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;
  try {
    const data = await fetcher();
    cache.set(key, { data, ts: Date.now() });
    return data;
  } catch (e) {
    if (cached) return cached.data;
    throw e;
  }
}

function sendJson(res, data, status = 200) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

// ===== 理财知识数据库 (每日轮换) =====
const FINANCE_KNOWLEDGE = [
  { id: 1, title: '什么是股票', category: '基础概念', difficulty: 1,
    content: '股票是股份公司发行的所有权凭证，代表持有者对公司的部分所有权。购买股票即成为公司股东，享有分红和投票权。股票价格受公司业绩、市场情绪、宏观经济等多重因素影响。',
    tip: '新手建议从大盘蓝筹股开始了解，关注公司的基本面和盈利能力。' },
  { id: 2, title: '什么是债券', category: '基础概念', difficulty: 1,
    content: '债券是政府、金融机构或企业为筹集资金而发行的债务凭证，发行方承诺按期支付利息并在到期时偿还本金。债券的风险通常低于股票，是固定收益类投资的重要工具。',
    tip: '国债是最安全的债券类型，适合风险偏好较低的投资者。' },
  { id: 3, title: '什么是基金', category: '基础概念', difficulty: 1,
    content: '基金是将众多投资者的资金汇集起来，由专业基金经理进行投资管理的金融产品。分为股票型、债券型、混合型、货币型等，适合没有时间或专业知识进行个股投资的投资者。',
    tip: '选基金看三点：基金经理履历、历史业绩、费率水平。' },
  { id: 4, title: '什么是ETF', category: '基础概念', difficulty: 2,
    content: 'ETF（交易型开放式指数基金）是一种在交易所上市交易的基金，跟踪特定指数（如沪深300、中证500）。ETF结合了封闭式基金和开放式基金的优点，交易灵活、费率低廉、透明度高。',
    tip: 'ETF是被动投资的首选工具，长期持有宽基ETF是稳健的理财方式。' },
  { id: 5, title: '什么是REITs', category: '基础概念', difficulty: 2,
    content: 'REITs（不动产投资信托基金）是通过发行收益凭证募集资金，投资于不动产项目，并将绝大部分收益分配给投资者。让普通投资者也能参与房地产、基础设施等大额投资。',
    tip: 'REITs提供稳定的分红收益，是抗通胀的优质配置工具。' },
  { id: 6, title: '可转债', category: '基础概念', difficulty: 2,
    content: '可转债是可以在特定条件下转换为股票的债券，兼具债性和股性。下跌时有债券保底，上涨时可转股获利，是"进可攻退可守"的投资品种。',
    tip: '关注可转债的转股溢价率和到期收益率，双低策略（低价格+低溢价）是经典打法。' },
  { id: 7, title: '货币基金', category: '基础概念', difficulty: 1,
    content: '货币基金是投资于短期货币市场工具的基金，如国库券、商业票据、银行定期存单等。风险极低、流动性好，是现金管理的重要工具。余额宝就是典型的货币基金。',
    tip: '闲置资金放货币基金，比活期存款收益高数倍，且随时可取。' },
  { id: 8, title: '国债逆回购', category: '基础概念', difficulty: 1,
    content: '国债逆回购本质是一种短期贷款，你把钱借给别人，别人用国债作抵押，到期还本付息。在交易所操作，安全性极高，月末季末利率常常飙升。',
    tip: '月末、季末、年末操作国债逆回购，利率往往更高。' },
  { id: 9, title: '定投策略', category: '投资策略', difficulty: 1,
    content: '定投是指在固定时间投入固定金额购买某项资产（如基金）。通过长期定期投资，可以平滑成本、降低择时风险，适合上班族和投资新手。核心优势是"懒人投资"和"微笑曲线"。',
    tip: '定投贵在坚持，市场下跌时不要停止，那正是积累低价筹码的好时机。' },
  { id: 10, title: '价值投资', category: '投资策略', difficulty: 2,
    content: '价值投资是由格雷厄姆创立、巴菲特发扬光大的投资理念，核心是"以低于内在价值的价格买入优质资产"。关注企业基本面、护城河、安全边际，忽略短期市场波动。',
    tip: '价值投资需要耐心和独立思考，不盲目跟风，做时间的朋友。' },
  { id: 11, title: '资产配置', category: '投资策略', difficulty: 2,
    content: '资产配置是将资金按一定比例分散投资于不同资产类别（股票、债券、现金、黄金等），以平衡风险和收益。研究表明，投资组合长期收益的90%以上取决于资产配置，而非选股择时。',
    tip: '经典配置：60%股票+40%债券，根据年龄和风险偏好调整比例。' },
  { id: 12, title: '网格交易', category: '投资策略', difficulty: 3,
    content: '网格交易是在一定价格区间内，将资金分成若干等份，价格每下跌一定幅度买入一份，每上涨一定幅度卖出一份，通过反复买卖赚取波动收益。适合震荡市场。',
    tip: '网格交易适合波动大但有底的品种（如指数ETF），单边下跌市场慎用。' },
  { id: 13, title: '再平衡', category: '投资策略', difficulty: 2,
    content: '再平衡是指定期调整投资组合，使各资产比例恢复到目标配置。例如股票大涨后占比超标，卖出部分股票买入债券，实质是"高抛低吸"的纪律化操作。',
    tip: '建议每半年或一年做一次再平衡，也可以在偏离目标5%以上时触发。' },
  { id: 14, title: '左侧交易 vs 右侧交易', category: '投资策略', difficulty: 2,
    content: '左侧交易是在下跌过程中逐步买入（越跌越买），右侧交易是在确认上涨趋势后买入。左侧交易成本更低但需要承受继续下跌，右侧交易更安全但成本更高。',
    tip: '新手建议右侧交易，等趋势确认再入场；左侧交易需要对价值有深刻理解。' },
  { id: 15, title: '分散投资', category: '风险管理', difficulty: 1,
    content: '分散投资是将资金投资于不同品种、不同行业、不同市场，以降低单一投资失败带来的损失。"不要把鸡蛋放在一个篮子里"是投资的基本原则。',
    tip: '分散不是越多越好，5-15只不同行业的标的即可达到有效分散。' },
  { id: 16, title: '止损策略', category: '风险管理', difficulty: 2,
    content: '止损是在投资亏损达到预定比例时果断卖出，防止损失进一步扩大。常见的止损方法有固定比例止损（如-8%）、技术止损（跌破均线）、时间止损（持有N天不涨则卖）。',
    tip: '买入前就设好止损位，执行时不要犹豫。保住本金是投资的第一要务。' },
  { id: 17, title: '仓位管理', category: '风险管理', difficulty: 2,
    content: '仓位管理是控制投资资金使用比例的策略。常见方法有金字塔仓位（越跌越买，底部仓位大）、倒金字塔（越涨越买，顶部仓位大）、等额分批等。永远不要满仓单一标的。',
    tip: '新手建议仓位不超过50%，留足现金应对极端行情。' },
  { id: 18, title: '风险评估', category: '风险管理', difficulty: 2,
    content: '投资前评估自己的风险承受能力，包括年龄、收入稳定性、家庭负担、投资经验等。风险承受能力低的投资者应多配置债券和货币基金，风险承受能力高的可以适当增加股票比例。',
    tip: '一个简单公式：股票配置比例 = 100 - 你的年龄。30岁可以配70%股票。' },
  { id: 19, title: '应急基金', category: '财务规划', difficulty: 1,
    content: '应急基金是为应对突发事件（失业、疾病、意外）而储备的流动资金，一般建议储备3-6个月的生活开支。应急基金应放在随时可取的账户中，如货币基金或活期存款。',
    tip: '先把应急基金存够，再开始投资。这是财务安全的第一道防线。' },
  { id: 20, title: '保险配置', category: '财务规划', difficulty: 2,
    content: '保险是财务规划的重要组成部分，用于转移重大风险。建议配置：医疗险（百万医疗）、重疾险（保额30-50万）、意外险、寿险（家庭支柱必备）。保费支出不超过年收入10%。',
    tip: '先保障后理财，先大人后小孩。消费型保险性价比高于返还型。' },
  { id: 21, title: '养老规划', category: '财务规划', difficulty: 2,
    content: '养老规划是提前为退休生活储备资金。建议通过个人养老金账户、基金定投、商业养老险等多种方式积累。考虑通胀因素，退休后需要的资金可能比想象中多得多。',
    tip: '越早开始养老规划，复利效应越明显。每月1000元定投，30年后可能超过100万。' },
  { id: 22, title: '税务优化', category: '财务规划', difficulty: 3,
    content: '合理利用税收优惠政策降低税负，如个人养老金账户税前扣除、公募基金分红免税、国债利息免税等。了解个人所得税专项附加扣除政策，合法合规地节税。',
    tip: '每年12000元的个人养老金额度可以税前扣除，高收入人群节税效果明显。' },
  { id: 23, title: 'K线图基础', category: '技术分析', difficulty: 1,
    content: 'K线图由开盘价、收盘价、最高价、最低价组成。阳线（红色）表示收盘价高于开盘价，阴线（绿色）表示收盘价低于开盘价。上下的细线称为上影线和下影线，反映价格波动范围。',
    tip: '不要只看单根K线，要结合K线组合和成交量一起分析。' },
  { id: 24, title: 'MACD指标', category: '技术分析', difficulty: 2,
    content: 'MACD（指数平滑异同移动平均线）由快线DIF、慢线DEA和柱状图组成。金叉（DIF上穿DEA）为买入信号，死叉（DIF下穿DEA）为卖出信号。柱状图由负转正表示多头力量增强。',
    tip: 'MACD是趋势指标，在震荡市中信号较多，需结合其他指标确认。' },
  { id: 25, title: '均线系统', category: '技术分析', difficulty: 2,
    content: '移动平均线（MA）反映一段时间内的平均成本。常用均线有5日、10日、20日（短期）、60日（中期）、120日/250日（长期）。多头排列（短期在上长期在下）为强势信号。',
    tip: '250日均线（年线）被称为牛熊分界线，股价在年线之上为牛市格局。' },
  { id: 26, title: '量价关系', category: '技术分析', difficulty: 2,
    content: '成交量是判断趋势可靠性的重要指标。放量上涨表示买盘积极，缩量下跌表示抛压减轻。天量天价常是见顶信号，地量地价常是见底信号。量在价先，是技术分析的核心原则。',
    tip: '关注异常放量，特别是在关键位置（支撑位/阻力位）的放量突破或放量下跌。' },
  { id: 27, title: '支撑与阻力', category: '技术分析', difficulty: 2,
    content: '支撑位是价格下跌时可能止跌的位置，阻力位是价格上涨时可能遇阻的位置。前期高点/低点、整数关口、均线位置都可能形成支撑或阻力。突破阻力后，阻力位往往变为支撑位。',
    tip: '不要在阻力位附近追高，等突破回踩确认再介入更安全。' },
  { id: 28, title: '市盈率PE', category: '技术分析', difficulty: 1,
    content: '市盈率（PE）= 股价 / 每股收益，反映投资者愿意为每元利润支付的价格。PE越低表示估值越便宜，但也要考虑行业差异和成长性。常用PE-TTM（滚动12个月市盈率）。',
    tip: '不同行业PE差异大，应该与同行业公司比较，或与历史PE比较。' },
  { id: 29, title: '市净率PB', category: '技术分析', difficulty: 1,
    content: '市净率（PB）= 股价 / 每股净资产，反映市场对公司资产的溢价程度。PB<1称为破净，可能被低估。银行、钢铁等重资产行业常用PB估值，科技股等轻资产公司PE更合适。',
    tip: '低PB不一定是好事，要结合ROE（净资产收益率）一起看。' },
  { id: 30, title: '银行存款', category: '理财产品', difficulty: 1,
    content: '银行存款是最基础的理财方式，包括活期、定期、大额存单等。50万元以内受存款保险保护。大额存单利率高于普通定期，但起存金额较高（通常20万起）。',
    tip: '大额存单利率下行趋势中，锁定长期限的产品更有价值。' },
  { id: 31, title: '银行理财产品', category: '理财产品', difficulty: 2,
    content: '银行理财产品分为R1-R5五个风险等级。资管新规后理财产品不再保本，变为净值型产品。R1-R2适合保守型投资者，R3及以上可能涉及权益类资产，波动较大。',
    tip: '看清产品说明书，关注底层资产和风险等级，不要只看历史收益率。' },
  { id: 32, title: '黄金投资', category: '理财产品', difficulty: 2,
    content: '黄金是传统的避险资产和抗通胀工具。投资方式包括实物黄金、纸黄金、黄金ETF、黄金期货等。黄金与美元通常负相关，在地缘冲突和经济不确定性增加时表现较好。',
    tip: '黄金ETF（如518880）是最便捷的黄金投资方式，交易灵活、费率低。' },
  { id: 33, title: '复利的力量', category: '基础概念', difficulty: 1,
    content: '复利是指投资收益再投资产生的利滚利效应。爱因斯坦称复利为"世界第八大奇迹"。年化10%的收益，30年后1万元会变成17.4万元。时间是复利最好的朋友。',
    tip: '复利的关键是时间和稳定收益，追求高收益不如追求长期稳定。' },
  { id: 34, title: '通货膨胀', category: '基础概念', difficulty: 1,
    content: '通货膨胀是指物价持续上涨、货币购买力下降的经济现象。假设通胀率3%，30年后100元的购买力仅相当于41元。投资的首要目标是跑赢通胀，保卫购买力。',
    tip: '现金是最差的长期投资，把钱存在活期里等于在亏钱。' },
  { id: 35, title: '财务自由', category: '财务规划', difficulty: 2,
    content: '财务自由是指被动收入（投资收益、租金、版税等）覆盖生活开支的状态。4%法则：如果年开支的25倍等于投资组合规模，按4%年化提取可以永续运行。',
    tip: '记账是迈向财务自由的第一步，清楚钱从哪来、花到哪去。' },
  { id: 36, title: 'DCF估值法', category: '技术分析', difficulty: 3,
    content: 'DCF（现金流折现）是通过预测企业未来自由现金流并折现到当前来估算企业价值的方法。是理论上最严谨的估值方法，但对假设非常敏感，需要深入理解商业模式。',
    tip: 'DCF适合成熟稳定的公司，对周期股和成长股要谨慎使用。' },
  { id: 37, title: '夏普比率', category: '风险管理', difficulty: 3,
    content: '夏普比率 = (组合收益率 - 无风险利率) / 组合标准差，衡量每承担一单位风险获得的超额收益。夏普比率>1为良好，>2为优秀。是评估基金和投资组合的重要指标。',
    tip: '选基金时不能只看收益率，还要看夏普比率，衡量风险调整后的收益。' },
  { id: 38, title: '定投止盈策略', category: '投资策略', difficulty: 2,
    content: '定投不止盈等于坐过山车。常见止盈方法：目标收益率止盈（如达到30%全部卖出重新开始）、估值止盈（PE分位数高时减仓）、回撤止盈（从最高点回撤10%卖出）。',
    tip: '定投止盈不止损，但止盈后要继续定投，不要中断节奏。' },
  { id: 39, title: '打新策略', category: '投资策略', difficulty: 1,
    content: '打新是指申购新上市的股票或可转债。A股打新需要持有一定市值的股票（沪市1万市值可打沪市新股），可转债打新无需市值。中签后上市首日通常有收益。',
    tip: '坚持打新可转债，中签率比新股高，是低风险增厚收益的好方法。' },
  { id: 40, title: '指数估值', category: '技术分析', difficulty: 2,
    content: '指数估值是通过PE、PB等指标与历史数据对比，判断指数当前处于高估还是低估区域。低估时定投加码，高估时减仓止盈。常用工具如蛋卷基金、理杏仁等提供指数估值数据。',
    tip: '定投指数基金时，参考PE分位数：低于30%历史分位为低估，高于70%为高估。' },
];

// ===== API 处理器 =====
const handlers = {
  '/api/news': async () => {
    return getCached('news', async () => {
      const data = await fetchJson('https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc');
      return (data.data || []).map(item => ({
        title: item.Title,
        url: item.Url,
        hot: item.HotValue || 0,
        clusterId: item.ClusterId,
      }));
    });
  },

  '/api/videos': async () => {
    return getCached('videos', async () => {
      const data = await fetchJson('https://api.bilibili.com/x/web-interface/popular?ps=24&pn=1');
      return (data.data?.list || []).map(v => ({
        title: v.title.replace(/<[^>]+>/g, ''),
        cover: (v.pic || '').replace('http://', 'https://'),
        views: v.stat?.view || 0,
        likes: v.stat?.like || 0,
        coins: v.stat?.coin || 0,
        share: v.stat?.share || 0,
        reply: v.stat?.reply || 0,
        author: v.owner?.name || '',
        bvid: v.bvid,
        duration: v.duration || 0,
        tname: v.tname || '',
        url: `https://www.bilibili.com/video/${v.bvid}`,
      }));
    });
  },

  '/api/douyin': async () => {
    return getCached('douyin', async () => {
      const data = await fetchJson('https://aweme.snssdk.com/aweme/v1/hot/search/list/');
      const list = data?.data?.word_list || [];
      return list.map(item => ({
        title: item.word,
        hot: item.hot_value || 0,
        position: item.position || 0,
        label: item.label || 0,
        cover: item.word_cover?.url_list?.[0] || '',
        url: `https://www.douyin.com/search/${encodeURIComponent(item.word)}`,
      }));
    });
  },

  '/api/dramas': async () => {
    return getCached('dramas', async () => {
      const data = await fetchJson('https://movie.douban.com/j/search_subjects?type=tv&tag=%E7%83%AD%E9%97%A8&page_limit=24&page_start=0');
      return (data.subjects || []).map(d => ({
        title: d.title,
        rate: d.rate || '暂无',
        cover: d.cover,
        url: d.url,
        id: d.id,
        episodes: d.episodes_info || '',
        isNew: d.is_new,
      }));
    });
  },

  '/api/movies': async () => {
    return getCached('movies', async () => {
      const data = await fetchJson('https://movie.douban.com/j/search_subjects?type=movie&tag=%E7%83%AD%E9%97%A8&page_limit=24&page_start=0');
      return (data.subjects || []).map(d => ({
        title: d.title,
        rate: d.rate || '暂无',
        cover: d.cover,
        url: d.url,
        id: d.id,
        isNew: d.is_new,
      }));
    });
  },

  '/api/books': async () => {
    return getCached('books', async () => {
      const data = await fetchJson('https://book.douban.com/j/search_subjects?tag=%E7%83%AD%E9%97%A8&page_limit=24&page_start=0');
      return (data.subjects || []).map(b => ({
        title: b.title,
        rate: b.rate || '暂无',
        cover: b.cover,
        url: b.url,
        id: b.id,
      }));
    });
  },

  '/api/finance': async (req, res, url) => {
    const all = url.searchParams.get('all') === '1';
    if (all) return FINANCE_KNOWLEDGE;
    const today = new Date().getDate();
    const count = 5;
    const startIdx = ((today - 1) * count) % FINANCE_KNOWLEDGE.length;
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(FINANCE_KNOWLEDGE[(startIdx + i) % FINANCE_KNOWLEDGE.length]);
    }
    return result;
  },

  '/api/weread/shelf': async (req, res, url) => {
    const cookie = req.headers['x-weread-cookie'];
    if (!cookie) throw new Error('请先在设置中配置微信读书 Cookie');
    const data = await fetchJson('https://weread.qq.com/shelf/sync', {
      'Cookie': cookie,
      'Referer': 'https://weread.qq.com/',
      'Accept': 'application/json, text/plain, */*',
    });
    // Check for auth error
    if (data.errCode === -2012 || data.errcode === -2012) throw new Error('Cookie 已过期，请重新获取');
    if (data.errCode && data.errCode !== 0) throw new Error('微信读书 API 错误: ' + (data.errMsg || data.errCode));
    const books = (data.books || []).map(b => ({
      bookId: b.bookId,
      title: b.title,
      author: (b.author || '').replace(/\n/g, ' ').trim(),
      cover: b.cover ? b.cover.replace(/\\u002F/g, '/') : '',
      finishReading: b.finishReading === 1,
      publisher: b.publisher || '',
      publishTime: b.publishTime || '',
      category: b.category || '',
    }));
    const progressMap = {};
    (data.bookProgress || []).forEach(p => { progressMap[p.bookId] = p; });
    const merged = books.map(b => {
      const p = progressMap[b.bookId] || {};
      return { ...b, progress: p.progress || 0, readingTime: p.readingTime || 0, updateTime: p.updateTime || 0 };
    });
    const totalReadingTime = merged.reduce((s, b) => s + (b.readingTime || 0), 0);
    const finishedCount = merged.filter(b => b.finishReading).length;
    const readingCount = merged.filter(b => !b.finishReading && b.progress > 0).length;
    return { books: merged, totalReadingTime, finishedCount, readingCount, totalCount: merged.length };
  },

  '/api/weread/stats': async (req, res, url) => {
    const cookie = req.headers['x-weread-cookie'];
    if (!cookie) throw new Error('请先在设置中配置微信读书 Cookie');
    const data = await fetchJson('https://weread.qq.com/readdata/detail', {
      'Cookie': cookie,
      'Referer': 'https://weread.qq.com/',
      'Accept': 'application/json, text/plain, */*',
    });
    if (data.errCode === -2012 || data.errcode === -2012) throw new Error('Cookie 已过期，请重新获取');
    return data;
  },

  '/api/weread/notebooks': async (req, res, url) => {
    const cookie = req.headers['x-weread-cookie'];
    if (!cookie) throw new Error('请先在设置中配置微信读书 Cookie');
    const data = await fetchJson('https://weread.qq.com/user/notebooks', {
      'Cookie': cookie,
      'Referer': 'https://weread.qq.com/',
      'Accept': 'application/json, text/plain, */*',
    });
    if (data.errCode === -2012 || data.errcode === -2012) throw new Error('Cookie 已过期，请重新获取');
    return data;
  },

  '/api/refresh': async () => {
    cache.clear();
    return { ok: true, msg: '缓存已清除' };
  },
};

// ===== 服务器 =====
const requestHandler = async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // API 路由
  if (url.pathname.startsWith('/api/')) {
    const handler = handlers[url.pathname];
    if (handler) {
      try {
        const data = await handler(req, res, url);
        sendJson(res, { ok: true, data });
      } catch (e) {
        console.error(`API error [${url.pathname}]:`, e.message);
        sendJson(res, { ok: false, error: e.message }, 500);
      }
    } else {
      sendJson(res, { ok: false, error: 'Not found' }, 404);
    }
    return;
  }

  // 静态文件
  let filePath = path.join(ROOT, url.pathname === '/' ? 'index.html' : url.pathname);
  // 安全检查：防止目录穿越
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  const ext = path.extname(filePath);
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
};

const httpServer = http.createServer(requestHandler);

// ===== HTTPS（自签证书，供 iPhone 安装真·PWA / 离线缓存）=====
const HTTPS_PORT = parseInt(process.env.HTTPS_PORT, 10) || 8443;
let httpsServer = null;
try {
  const sslKey = fs.readFileSync(path.join(ROOT, 'ssl', 'key.pem'));
  const sslCert = fs.readFileSync(path.join(ROOT, 'ssl', 'cert.pem'));
  httpsServer = https.createServer({ key: sslKey, cert: sslCert }, requestHandler);
} catch (e) {
  console.log('  ⚠️ 未找到 ssl/key.pem 或 ssl/cert.pem，HTTPS 未启用（HTTP 仍可用）');
}

function printUrls(label, port, scheme) {
  const lan = [];
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) lan.push(iface.address);
    }
  }
  console.log(`  ${label}:`);
  console.log(`     本机:   ${scheme}://localhost:${port}`);
  lan.forEach(ip => console.log(`     手机:   ${scheme}://${ip}:${port}`));
  return lan;
}

console.log(`\n  ✅ Workbench Server 已启动`);
const lanHttp = printUrls('🌐 HTTP ', PORT, 'http');
if (httpsServer) {
  printUrls('🔒 HTTPS ', HTTPS_PORT, 'https');
} else if (lanHttp.length === 0) {
  console.log('     ⚠️ 未检测到局域网 IP（请确认已连接 Wi-Fi）');
}
console.log('');

httpServer.on('error', err => { console.log(`  ⚠️ HTTP 端口 ${PORT} 启动失败: ${err.code}`); });
httpServer.listen(PORT, '0.0.0.0', () => {});
if (httpsServer) {
  httpsServer.on('error', err => { console.log(`  ⚠️ HTTPS 端口 ${HTTPS_PORT} 启动失败: ${err.code}`); });
  httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {});
}
