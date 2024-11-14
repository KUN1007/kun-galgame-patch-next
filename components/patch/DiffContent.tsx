import DOMPurify from 'isomorphic-dompurify'
import './_diff.scss'

export const parseTextToHTML = (text: string): string => {
  const regex = /(\+\+\+.*?\+\+\+|---.*?---|\|\|\|.*?\|\|\|)/gs
  let resultHTML = ''
  let lastIndex = 0

  text.replace(regex, (match, p1, offset) => {
    if (lastIndex !== offset) {
      resultHTML += text.slice(lastIndex, offset)
    }
    lastIndex = offset + match.length

    if (match.startsWith('+++') && match.endsWith('+++')) {
      resultHTML += `<div class="kun-content-added">${match.slice(3, -3)}</div>`
    } else if (match.startsWith('---') && match.endsWith('---')) {
      resultHTML += `<div class="kun-content-deleted">${match.slice(3, -3)}</div>`
    } else if (match.startsWith('|||') && match.endsWith('|||')) {
      resultHTML += `<div class="kun-content-modified">${match.slice(3, -3)}</div>`
    }
    return ''
  })

  if (lastIndex < text.length) {
    resultHTML += text.slice(lastIndex)
  }

  const fieldsRegex = /(name:|alias:|introduction:)/g
  const fieldReplacements: { [key: string]: string } = {
    'name:': '<b>游戏名</b>',
    'alias:': '<b>游戏别名</b>',
    'introduction:': '<b>游戏介绍</b>'
  }
  resultHTML = resultHTML.replace(fieldsRegex, (match) => {
    return `<br/><br/>${fieldReplacements[match] || match}<br/>`
  })

  return resultHTML
}

export const HighlightedText = ({ content }: { content: string }) => {
  const sanitizedHTML = parseTextToHTML(DOMPurify.sanitize(content))

  return (
    <div
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
      className="prose max-w-none dark:prose-invert"
    />
  )
}
