const adminUrl = 'https://tiny-truffle-95ce1a.netlify.app/admin/';
const subject = 'Нова заявка на сайті Омегабуд';
const message = subject + '.\nВідкрийте розділ «Заявки» у кабінеті:\n' + adminUrl;

export function createLeadNotifications(env, request = fetch) {
  const email = Boolean(env.RESEND_API_KEY && env.LEAD_EMAIL_FROM && env.LEAD_EMAIL_TO);
  const telegram = Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID);

  async function send(channel, url, body, headers = {}) {
    try {
      const response = await request(url, {
        method:'POST',
        headers:{'Content-Type':'application/json',...headers},
        body:JSON.stringify(body),
        signal:AbortSignal.timeout(3500)
      });
      if (!response.ok) console.warn('Lead notification failed:',channel,response.status);
    } catch {
      console.warn('Lead notification unavailable:',channel);
    }
  }

  return {
    status:{email,telegram},
    async notify(id) {
      const deliveries = [];
      if (email) deliveries.push(send('email','https://api.resend.com/emails',{
        from:env.LEAD_EMAIL_FROM,to:[env.LEAD_EMAIL_TO],subject,text:message
      },{
        Authorization:'Bearer '+env.RESEND_API_KEY,
        'Idempotency-Key':'omegabud-lead-'+id
      }));
      if (telegram) deliveries.push(send('telegram','https://api.telegram.org/bot'+env.TELEGRAM_BOT_TOKEN+'/sendMessage',{
        chat_id:env.TELEGRAM_CHAT_ID,text:message,link_preview_options:{is_disabled:true}
      }));
      await Promise.all(deliveries);
    }
  };
}
