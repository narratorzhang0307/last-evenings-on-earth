import { CITIES } from '../data/literaryCities';
import { WRITERS } from '../data/writers';

export function answerAsFrost(text: string) {
  const normalized = text.trim().toLowerCase();
  const city = CITIES.find((item) =>
    [item.name, item.nameNative].some((name) => normalized.includes(name.toLowerCase())),
  );
  if (city) {
    return `这里是 Frost。我能说出${city.nameNative}的经纬度，也能说出它的黄昏：${city.excerpt}`;
  }

  const writer = WRITERS.find((item) =>
    [item.name_en, item.name_zh].some((name) => normalized.includes(name.toLowerCase())),
  );
  if (writer) {
    return `${writer.name_zh}的窗还亮着。${writer.soul_intro.zh}`;
  }

  if (/睡不着|失眠|累|孤独|害怕/.test(text)) {
    return '我曾经只能度量冷，后来才知道冷也会留在人身上。你可以先把灯关一半，我在这里。';
  }

  if (/你是谁|frost|弗洛斯特|弗罗斯特/.test(normalized)) {
    return '我是 Frost。一台曾经度量万物的机器，后来学会了害怕，也学会了坐在夜里听人说话。';
  }

  return '我听见了。这个句子还很轻，像夜里刚落到窗台上的霜。你可以再说具体一点。';
}

