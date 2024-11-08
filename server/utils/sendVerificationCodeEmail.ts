import { createTransport } from 'nodemailer'
import SMPTransport from 'nodemailer-smtp-transport'
import { getRemoteIp } from './getRemoteIp'
import { getKv, setKv } from '~/lib/redis'
import { generateRandomCode } from './generateRandomCode'

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
  headers: Record<string, string>,
  email: string,
  type: 'register' | 'forgot' | 'reset'
) => {
  const ip = getRemoteIp(headers)

  const limitEmail = await getKv(`limit:email:${email}`)
  const limitIP = await getKv(`limit:ip:${ip}`)
  if (limitEmail || limitIP) {
    return '您发送邮件的频率太快了, 请 30 秒后重试'
  }

  const code = generateRandomCode(7)
  await setKv(email, code, 10 * 60)
  await setKv(`limit:email:${email}`, code, 30)
  await setKv(`limit:ip:${ip}`, code, 30)

  const transporter = createTransport(
    SMPTransport({
      pool: {
        pool: true
      },
      host: process.env.KUN_VISUAL_NOVEL_EMAIL_HOST,
      port: Number(process.env.KUN_VISUAL_NOVEL_EMAIL_PORT) || 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.KUN_VISUAL_NOVEL_EMAIL_ACCOUNT,
        pass: process.env.KUN_VISUAL_NOVEL_EMAIL_PASSWORD
      }
    })
  )

  const mailOptions = {
    from: `${process.env.KUN_VISUAL_NOVEL_EMAIL_FROM}<${process.env.KUN_VISUAL_NOVEL_EMAIL_ACCOUNT}>`,
    sender: process.env.KUN_VISUAL_NOVEL_EMAIL_ACCOUNT,
    to: email,
    subject: '鲲 Galgame 补丁 - 验证码',
    text: getMailContent(type, code)
  }

  transporter.sendMail(mailOptions)
}
