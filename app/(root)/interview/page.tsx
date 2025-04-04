import Agent from '@/components/Agent'
import { getCurrentUser } from '@/lib/actions/Auth.action'
import React from 'react'

const page = async () => {
  const user = await getCurrentUser();
  return (
    <>
    <h3>Interview Generation</h3>
    <Agent userName={user?.name!} userId={user?.id} type='generate'/>
    </>
  )
}

export default page
