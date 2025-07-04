'use client'

import DOMPurify from 'isomorphic-dompurify'
import { Code } from '@heroui/code'
import { Chip } from '@heroui/chip'
import { Quote } from 'lucide-react'
import { scrollIntoComment } from './_scrollIntoComment'
import type { PatchComment } from '~/types/api/patch'

interface Props {
  comment: PatchComment
}

export const CommentContent = ({ comment }: Props) => {
  return (
    <>
      {comment.quotedContent && (
        <Code
          color="primary"
          onClick={() => scrollIntoComment(comment.parentId)}
          className="cursor-pointer"
        >
          <span>{comment.quotedUsername}</span>
          <Chip
            endContent={<Quote className="text-primary-500 size-4" />}
            variant="light"
          >
            {comment.quotedContent}
          </Chip>
        </Code>
      )}
      <div
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(comment.content)
        }}
        className="kun-prose max-w-none"
      />
    </>
  )
}
