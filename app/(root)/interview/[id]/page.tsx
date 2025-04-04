import { getInterviewbyId } from '@/lib/actions/general.action';
import { redirect } from 'next/navigation';
import React from 'react'

const page = async ({ params }: RouteParams) => {
    const { id } = await params;
    const interview = await getInterviewbyId(id);
    if(! interview) redirect('/')
  return (
    <div>
      page
    </div>
  )
}

export default page
