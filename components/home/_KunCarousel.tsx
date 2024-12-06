'use client'

import { useEffect, useState } from 'react'
import { Button, Card, Chip, Image, Progress } from '@nextui-org/react'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, Heart, Play } from 'lucide-react'

const carouselItems = [
  {
    id: 1,
    title: 'Summer Pockets REFLECTION BLUE',
    image:
      'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=1920&h=400&fit=crop',
    description: 'Complete English translation patch now available!',
    downloads: '25K+',
    rating: 4.9,
    tags: ['Complete', 'Key', 'Romance']
  },
  {
    id: 2,
    title: 'Tsukihime -A piece of blue glass moon-',
    image:
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1920&h=400&fit=crop',
    description: 'Translation project progress: 75% complete',
    downloads: '10K+',
    rating: 4.7,
    tags: ['In Progress', 'Type-Moon', 'Mystery']
  }
]

export const KunCarousel = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    if (!isHovered) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % carouselItems.length)
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [isHovered])

  return (
    <div
      className="group relative h-[500px] overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        {carouselItems.map(
          (item, index) =>
            index === currentSlide && (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute size-full"
              >
                <img
                  alt={item.title}
                  className="object-cover size-full brightness-75"
                  src={item.image}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                <Card className="absolute border-none inset-x-8 bottom-8 bg-background/80 backdrop-blur-md">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="mb-2 text-3xl font-bold">
                          {item.title}
                        </h2>
                        <p className="mb-4 text-lg text-foreground/80">
                          {item.description}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          color="primary"
                          variant="solid"
                          startContent={<Download size={20} />}
                        >
                          Download Patch
                        </Button>
                        <Button
                          variant="bordered"
                          startContent={<Heart size={20} />}
                        >
                          Wishlist
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Chip color="primary" variant="flat">
                          {item.downloads} Downloads
                        </Chip>
                        <Chip color="success" variant="flat">
                          ★ {item.rating}
                        </Chip>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      {item.tags.map((tag) => (
                        <Chip key={tag} variant="flat" size="sm">
                          {tag}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
        )}
      </AnimatePresence>

      <div className="absolute flex gap-2 -translate-x-1/2 bottom-4 left-1/2">
        {carouselItems.map((_, index) => (
          <button
            key={index}
            className={`size-2 rounded-full transition-all ${
              index === currentSlide
                ? 'w-6 bg-primary'
                : 'bg-foreground/20 hover:bg-foreground/40'
            }`}
            onClick={() => setCurrentSlide(index)}
          />
        ))}
      </div>
    </div>
  )
}
