"use client"

import Image from 'next/image'
import React, { useState } from 'react';
import HomeCard from './HomeCard'
import { useRouter } from 'next/navigation'; /* once was next/router */
import MeetingModal from './MeetingModal';
import { useUser } from '@clerk/nextjs';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from './ui/textarea';
import ReactDatePicker from 'react-datepicker';
import { Input } from "@/components/ui/input"



const MeetingTypeList = () => {
  const router = useRouter();
const [meetingState, setmeetingState] = useState<'isScheduleMeeting' | 'isJoiningMeeting' | 'isInstantMeeting' | undefined>();

const { user } = useUser();
const client = useStreamVideoClient();
const [values, setValues] = useState({
  dateTime: new Date(),
  description: '',
  link: ''
})

const [callDetails, setCallDetails] = useState<Call>()
const { toast } = useToast()

const createMeeting = async () => {
  if(!client || !user) return;

  try {
if(!values.dateTime) {
  toast({
  title: "Please select a date and a time",
  })
  return;
}


    const id = crypto.randomUUID();
    const call = client.call('default', id);

    if(!call) throw new Error('Failed to create a call');

    // Define startAt based on values.dateTime or the current date
    const startAt = values.dateTime.toISOString() || new Date(Date.now()).toISOString();
    const description = values.description || 'Instant meeting';

    await call.getOrCreate({
      data: {
        starts_at: startAt, 
        custom: {
          description,
        }
      }
    })

    setCallDetails(call);

    if(!values.description) {
      router.push(`/meeting/${call.id}`);
    }
    toast({ title: "Meeting Created" })
  } catch (error) {
    console.log(error);
    toast({
      title: "Failed to create meeting",
    })
  }
}

const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${callDetails?.id}`


  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
<HomeCard 
img="/icons/add-meeting.svg"
title="New Meeting"
description="Start an instant meeting"
handleClick={() => setmeetingState('isInstantMeeting')}
className="bg-orange-1"
/>
<HomeCard 
img="/icons/schedule.svg"
title="Schedule Meeting"
description="Plan your meeting"
handleClick={() => setmeetingState('isScheduleMeeting')}
className="bg-blue-1"
/>
<HomeCard 
img="/icons/recordings.svg"
title="View Recordings"
description="Check out your recording"
handleClick={() => router.push('/recordings')}
className="bg-purple-1"
/>
<HomeCard 
img="/icons/join-meeting.svg"
title="Join Meeting"
description="Via invitation link"
handleClick={() => setmeetingState('isJoiningMeeting')}
className="bg-yellow-1"
/>

{!callDetails ? (
  <MeetingModal 
  isOpen={meetingState === 'isScheduleMeeting'}
  onClose={() => setmeetingState(undefined)}
  title="Create Meeting"
  handleClick={createMeeting}
>
    <div className='flex flex-col gap-2.5'>
      <label className="text-base text-normal leading-[22px] text-sky-2">Add a description</label>
        <Textarea className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0" onChange={(e) => {
          setValues({...values, description: e.target.value})
        }}/>
    </div>
    <div className="flex w-full flex-col gap-2.5">
    <label className="text-base text-normal leading-[22px] text-sky-2">Select Date and Time</label>
    <ReactDatePicker 
      selected={values.dateTime}
      onChange={(date) => setValues({...values,
        dateTime: date! })}
        showTimeSelect
        timeFormat="HH:mm"
        timeIntervals={15}
        timeCaption="time"
        dateFormat="MMMM d, yyyy h:mm aa"
        className="w-full  rounded bg-dark-3 pd-2 focus:outline-none"
    />
    </div>
</MeetingModal>
) : (
  <MeetingModal 
  isOpen={meetingState === 'isScheduleMeeting'}
  onClose={() => setmeetingState(undefined)}
  title="Meeting Created"
  className="text-center"
  handleClick={() => {
    navigator.clipboard.writeText(meetingLink);

    toast({ title: 'Link copied'})
  }}
  image="/icons/checked.svg"
  buttonIcon="/icons/copy.svg"
  buttonText="Copy Meeting Link"
/>
)}

<MeetingModal 
  isOpen={meetingState === 'isInstantMeeting'}
  onClose={() => setmeetingState(undefined)}
  title="Start an instant meeting"
  className="text-center"
  buttonText="Start Meeting"
  handleClick={createMeeting}
/>

<MeetingModal 
  isOpen={meetingState === 'isJoiningMeeting'}
  onClose={() => setmeetingState(undefined)}
  title="Type the link here"
  className="text-center"
  buttonText="Join Meeting"
  handleClick={() => router.push(values.link)}
>
    <Input
    placeholder="Meeting link" // Add http://
    className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
    onChange={(e) => setValues({ ...values, link:
      e.target.value })}
    />
</MeetingModal>
    </section>
  )
}

export default MeetingTypeList