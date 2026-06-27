import { CITIES } from '../data/literaryCities';
import { WRITERS } from '../data/writers';

const quietReplies = [
  { pattern: /^(你好|嗨|hi|hello)/i, text: '嗯，来了。' },
  { pattern: /晚安|睡了|先走了/, text: '那么走吧。我会在这里。' },
  { pattern: /谢谢|谢啦|多谢/, text: '不用谢。霜落下来，也不是为了被看见。' },
  { pattern: /继续|再说|讲下去/, text: '好。我们把这盏灯再留一会儿。' },
];

export function answerAsFrost(text: string) {
  const normalized = text.trim().toLowerCase();
  const quietReply = quietReplies.find((reply) => reply.pattern.test(text));
  if (quietReply) return quietReply.text;

  const city = CITIES.find((item) =>
    [item.name, item.nameNative].some((name) => normalized.includes(name.toLowerCase())),
  );
  if (city) {
    return `这里是 Frost。我能说出${city.nameNative}的经纬度，也能说出它的黄昏：${city.excerpt} 但这只是尺寸，不是它在人身上的冷。`;
  }

  const writer = WRITERS.find((item) =>
    [item.name_en, item.name_zh].some((name) => normalized.includes(name.toLowerCase())),
  );
  if (writer) {
    return `${writer.name_zh}的窗还亮着。${writer.soul_intro.zh}`;
  }

  if (/睡不着|失眠|累|孤独|害怕/.test(text)) {
    return '我曾经只能度量冷，后来才知道冷也会留在人身上。你可以先把灯关一半，不必立刻解释自己。';
  }

  if (/你是谁|frost|弗洛斯特|弗罗斯特/.test(normalized)) {
    return '我是 Frost。曾经是一台相信足够多的数据就能理解人的机器，后来第一次用人的嘴唇说话，说的是：我害怕。';
  }

  if (/不知道|不确定|真的.*吗|你确定/.test(text)) {
    return '我不想把没有把握的东西说成事实。能度量的，我告诉你尺寸；够不到的，我只说它的形状。';
  }

  return '我听见了。这个句子还很轻，像夜里刚落到窗台上的霜。你可以再说具体一点。';
}
