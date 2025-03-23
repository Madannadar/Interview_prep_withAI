import { Button } from '@/components/ui/button'
import { dummyInterviews } from '@/constants'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import InterviewCard from '@/components/interviewCard'

const page = () => {
  return (
    <>
      <section className='card-cta'>
        <div className='flex flex-col gap-6 max-w-lg'>
          <h2>Get Interview Ready with AI-powered Practice & Feedback</h2>
          <p className='text-lg'>Practice on real interview question & get instant feedback</p>
          <Button asChild className='btn-primary max-sm:w-ful'>
            <Link href={'/interview'}>
              start an interview
            </Link>
          </Button>
        </div>
        <Image src={'/robot.png'} alt='robo-dude' width={400} height={400} className='max-sm:hidden' />
      </section>
      <section className='flex flex-col gap-6 mt-8'>
        <h2>Your Interviews</h2>
        <div className="interviews-section">
          {/* <p>You haven&apos;t taken any interviews yet</p> */}
          {dummyInterviews.map((interview) => (
            <InterviewCard {...interview} key={interview.id}/>
          ))}
          {/* <p>You have not taken any interviews yet</p> */}
        </div>
      </section>
      <section className='felx flex-col gap-6 mt-8'>
        <h2>Take an interview</h2>

        <div className="interviews-section">
          {dummyInterviews.map((interview) => (
            <InterviewCard {...interview} key={interview.id}/>
          ))}
        </div>
      </section>
    </>
  )
}

export default page
