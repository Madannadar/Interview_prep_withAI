import React, { ReactNode } from 'react'

const RootLayout = ({children}:{children: ReactNode}) => {
  return (
    <div>
      {children}
      layout for root
    </div>
  )
}

export default RootLayout
