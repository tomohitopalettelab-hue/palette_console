const getToken = (): string => process.env.LINE_CHANNEL_ACCESS_TOKEN?.trim() || '';

export type LineMessage = {
  type: 'text';
  text: string;
};

export const sendLinePush = async (userId: string, messages: LineMessage[]): Promise<boolean> => {
  const token = getToken();
  if (!token || !userId) return false;
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ to: userId, messages }),
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const sendLineText = async (userId: string, text: string): Promise<boolean> =>
  sendLinePush(userId, [{ type: 'text', text }]);
