import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth-config'
import HelpLayout from '@/components/HelpLayout'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function WorkHelpPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <HelpLayout title="Work">
      <div className="max-w-4xl mx-auto">
        <nav className="mb-6 text-sm">
          <Link href="/help" className="text-blue-600 hover:text-blue-800">Help Center</Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-600">Work</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Work</h1>

        <div className="prose prose-lg max-w-none">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-900 mt-0 mb-3">What is the work list?</h2>
            <p className="text-blue-800 mb-0">
              Tasks for the construction group you are signed in to. You do not see another group&apos;s work.
            </p>
          </div>

          <h2>Add a task</h2>
          <p>
            Each task shows the date it was added. A deadline or a project date is labeled as the due date on the task.
            Choose Newest or Oldest to sort the open list by the date the task was added.
            Personnel Contact, Assistant, and Support can add work. Open Work, choose Add work, and enter a title and detail.
            An administrator, a Personnel Contact or Assistant, or the person who submitted the task can choose Edit and change the title, detail, timing, and due date. The same people can choose Remove to take the task off the list. Personnel can also edit or remove a date on a project.
            Timing is a deadline, no deadline, a date on a project, or a repeat of monthly or yearly. You can assign someone in this group, and you can mark the task claimable.
            Select all, or select several open tasks including with Shift, then assign them, mark them finished, or turn the completion email on or off. The requestor checkbox on each selected task matches that choice. Choose how many tasks to show on a page.
            Choose a project to see only that project's tasks, including finished ones. Overdue lists open tasks whose date is before today. Email off lists open tasks that have a requestor and will not email that person when the task is marked done. Select those tasks and choose Email on to turn the message back on.
          </p>

          <h2>Claim a task</h2>
          <p>
            When a claimable task has no assignee, anyone signed in to this construction group can choose Claim. That assigns the task to you.
            Everyone signed in to this group gets an email, a phone alert, and a browser alert if they allowed notifications. The message names the task and links to LDC Tools. The person who made the work available is not included. When work is assigned to someone else, that person gets the same email, phone alert, and browser alert. The Work link shows how many tasks are waiting.
            Open the task to check off its steps. Choose Start, then Finished, when the whole task is finished. Choose Return to pool when you cannot get to it. It becomes claimable again.
          </p>

          <h2>Import crew requests</h2>
          <p>
            Personnel can import the Microsoft Form spreadsheet from Work. Each row becomes a claimable task
            with the requestor, volunteer, crew, project roster, and comments. Importing the same spreadsheet again
            does not add those rows a second time. The signed-in team gets the same available-work email, listing each new title. Marking the task Finished keeps the requestor on it. If email is
            already configured, the requestor is told. A Bethel or jwpub.org address is not emailed.
          </p>

          <h2>Finish a task</h2>
          <p>
            An admin, an overseer, an assistant, the person who claimed it, or the assigned person can choose Start, then Finished. Support can do that only when the work is assigned to them. Changing the assignee, or returning the work to the pool, shows Start again. Mark selected finished only includes tasks that have been started. The page says whether the completion email was sent. The email subject is the task title. A crew request uses “Crew request completed” plus that title. Finished tasks stay in a collapsed Finished section, with the date they were finished.
            A published process is listed as available. A draft is not. Claiming a standalone process keeps every task inside that process. A project process is started from Processes after you choose the project. Finishing the process marks that one work item done.
            Anyone on the work list can add a note or ask for help on a task. A help request is listed at the top of Work.
            If email is already configured, the Personnel Contact and Assistant are told. Support is not.
            They can reply on the request. A new reply shows as unread until they open it. The person who asked also sees unread replies.
            The work list refreshes while it is open. Your assigned tasks are on My Work, and a short list of them is on the dashboard.
          </p>
        </div>
      </div>
    </HelpLayout>
  )
}
