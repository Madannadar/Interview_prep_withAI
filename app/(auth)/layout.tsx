import React, { ReactNode } from 'react'

const AuthLayout = ({children}:{children: ReactNode}) => {
    return (
        <div>
            navbar for sign-in and sign-up
            {children}
        </div>
    )
}

export default AuthLayout
