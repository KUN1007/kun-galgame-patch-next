'use client'

import { useState, useEffect } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Download from 'yet-another-react-lightbox/plugins/download'
import 'yet-another-react-lightbox/styles.css'
import { useMounted } from '~/hooks/useMounted'

export const KunAutoImageViewer = () => {
  const [openImage, setOpenImage] = useState<string | null>(null)
  const [images, setImages] = useState<
    { src: string; width: number; height: number }[]
  >([])
  const isMounted = useMounted()

  useEffect(() => {
    if (!isMounted) {
      return
    }

    const checkImageDimensions = (img: HTMLImageElement) => {
      if (img.width >= 200 && img.height >= 200) {
        setImages((prev) => {
          const exists = prev.some((image) => image.src === img.src)
          if (!exists) {
            return [
              ...prev,
              { src: img.src, width: img.width, height: img.height }
            ]
          }
          return prev
        })

        img.style.cursor = 'pointer'
        img.addEventListener('click', () => setOpenImage(img.src))
      }
    }

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLImageElement) {
            if (node.complete) {
              checkImageDimensions(node)
            } else {
              node.onload = () => checkImageDimensions(node)
            }
          }
        })
      })
    })

    document.querySelectorAll('img').forEach((img) => {
      if (img.complete) {
        checkImageDimensions(img)
      } else {
        img.onload = () => checkImageDimensions(img)
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => {
      observer.disconnect()
    }
  }, [isMounted])

  const currentImageIndex = openImage
    ? images.findIndex((img) => img.src === openImage)
    : -1

  return (
    <Lightbox
      index={currentImageIndex}
      slides={images}
      open={currentImageIndex >= 0}
      close={() => setOpenImage(null)}
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
  )
}
