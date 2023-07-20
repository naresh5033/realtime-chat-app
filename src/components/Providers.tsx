'use client'

import { FC, ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'

interface ProvidersProps {
  children: ReactNode
}

const Providers: FC<ProvidersProps> = ({ children }) => { // pass the whole application as the childern
  return (
    <>
      <Toaster position='top-center' reverseOrder={false} />
      {children}
    </>
  )
}

export default Providers // we can use this toaster provider in our root layout
