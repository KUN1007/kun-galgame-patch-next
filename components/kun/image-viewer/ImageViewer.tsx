'use client'

import { useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Download from 'yet-another-react-lightbox/plugins/download'
import 'yet-another-react-lightbox/styles.css'
import type { ReactNode } from 'react'

interface Props {
  images: {
    src: string
    alt: string
    width?: number
    height?: number
  }[]
  children: (openLightbox: () => void) => ReactNode
}

export const KunImageViewer = ({ images, children }: Props) => {
  const [index, setIndex] = useState(-1)
  const lightboxImages = images.map(({ src, width, height }) => ({
    src,
    width,
    height
  }))

  const openLightbox = (index: number) => setIndex(index)

  return (
    <>
      {children(() => openLightbox(0))}
      <Lightbox
        index={index}
        slides={lightboxImages}
        open={index >= 0}
        close={() => setIndex(-1)}
        plugins={[Zoom, Download]}
        animation={{ fade: 300 }}
        carousel={{
          finite: true,
          preload: 2
        }}
        zoom={{
          maxZoomPixelRatio: 3,
          scrollToZoom: true
        }}
        controller={{
          closeOnBackdropClick: true
        }}
        styles={{ container: { backgroundColor: 'rgba(0, 0, 0, .7)' } }}
      />
    </>
  )
}
