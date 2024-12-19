'use client'

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = {
  onClick: () => void
}

export default function MobileSidebarToggle({ onClick }: Props) {
  return (
    <Button variant="ghost" size="icon" className="md:hidden" onClick={onClick}>
      <Menu />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}
