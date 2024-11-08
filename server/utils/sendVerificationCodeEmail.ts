import { createTransport } from 'nodemailer'
import SMPTransport from 'nodemailer-smtp-transport'
import { getKv, setKv } from '~/lib/redis'
import type { H3Event } from 'h3'

const getMailContent = (
  type: 'register' | 'forgot' | 'reset',
  code: string
) => {
  if (type === 'register') {
    return `您好, 您正在注册 鲲 Galgame 补丁站, 下面是您的注册验证码\n${code}\n验证码十分钟内有效`
  } else if (type === 'forgot') {
    return `您好, 您正在重置您 鲲 Galgame 补丁站 的密码, 下面是您的重置密码验证码\n${code}\n验证码十分钟内有效`
  } else {
    return `您好, 您正在更改您 鲲 Galgame 补丁站 的邮箱, 下面是您的新邮箱验证码\n${code}\nn验证码十分钟内有效`
  }
}

export const sendVerificationCodeEmail = async (
  event: H3Event,
  email: string,
  type: 'register' | 'forgot' | 'reset'
) => {
  const ip = getRemoteIp(event)

  const limitEmail = await useStorage('redis').getItem(`limit:email:${email}`)
  const limitIP = await useStorage('redis').getItem(`limit:ip:${ip}`)
  if (limitEmail || limitIP) {
    return 10301
  }

  const code = generateRandomCode(7)
  await useStorage('redis').setItem(email, code, { ttl: 10 * 60 })
  await useStorage('redis').setItem(`limit:email:${email}`, code, { ttl: 30 })
  await useStorage('redis').setItem(`limit:ip:${ip}`, code, { ttl: 30 })

  const transporter = createTransport(
    SMPTransport({
      pool: {
        pool: true
      },
      host: env.KUN_VISUAL_NOVEL_EMAIL_HOST,
      port: Number(env.KUN_VISUAL_NOVEL_EMAIL_PORT) || 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: env.KUN_VISUAL_NOVEL_EMAIL_ACCOUNT,
        pass: env.KUN_VISUAL_NOVEL_EMAIL_PASSWORD
      }
    })
  )

  const mailOptions = {
    from: `${env.KUN_VISUAL_NOVEL_EMAIL_FROM}<${env.KUN_VISUAL_NOVEL_EMAIL_ACCOUNT}>`,
    sender: env.KUN_VISUAL_NOVEL_EMAIL_ACCOUNT,
    to: email,
    subject: 'KUN Visual Novel Verification Code',
    text: getMailContent(type, code)
  }

  transporter.sendMail(mailOptions)
}
