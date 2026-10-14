I recently set myself a goal: to keep working when I go out with nothing but my phone.

When I have an idea, I tell my assistant. When I need to change a document or move a project forward, I explain what I need. If execution reaches a decision that requires my judgement, it asks me. When I need to operate software directly, I open a cloud desktop.

This is a working arrangement I am still building. It does not cover all my daily work yet, but it has a foundation I can develop: a server, a cloud desktop and an AI assistant available through WeChat.

## Let work move beyond one computer

Many things can only continue when we return to our computer because everything needed to do them is stored there.

Project code, installed tools and recently edited files are local. On a phone, even if I can talk to AI, it may not see those materials or continue operating on them.

So the first step is to give my work a stable place online.

Files, code and tools stay there, accessible to the assistant. My phone sends instructions and brings results back. Changing the device in my hand does not interrupt the work itself.

I previously wrote [Capabilities can be outsourced; AI context cannot](/blog/outsource-capabilities-own-context/). That article concerned how to give AI the goals, background and methods in our heads. Now I need to go further and prepare the environment in which it can execute.

## Put the everyday working environment on a cloud desktop

I already had a Volcano Engine server, then bought an Alibaba Cloud Wuying cloud desktop with eight CPU cores and 16 GB of RAM.

A cloud desktop suits an everyday working environment. It has a complete desktop, can run software and retain projects, and can stay online. Services keep running after I leave the desktop.

The original server still provides the public entry point. Wuying has no public IP address, so I let it connect outward to the server and expose the necessary services through reverse SSH tunnels. The public entry point stays fixed while execution and data live on the cloud desktop. [OpenSSH remote forwarding documentation](https://man.openbsd.org/ssh#R)

At publication, the assistant, shared memory and task services had moved to Wuying, and basic WeChat and web flows were working. Desktop tools and everyday development projects were still being moved gradually.

This arrangement uses devices I already have. If you want to try something similar, start with an environment that can stay running, retain working materials and be reached by you and your assistant. Then decide whether an additional server is needed.

## Give instructions on the phone and let the assistant continue

With the environment in place, the next step is making it easy to control from a phone.

My working entry point is WeChat. Through OpenClaw, the assistant can access projects using tools. For example, I can query tasks in Intent or explicitly ask it to mark a task as in progress.

There is an important practical difference here: the task data actually changes, and I can still see the result when I open the web interface later. A conversation can become the start of real work.

I want to extend this to more activities. When editing project documentation, the assistant should read the existing content and relevant context, make the change and return it for review. When handling code, it should work in the existing project without requiring me to copy files manually first.

These flows need to be connected individually. Configuring tools, defining the assistant's operating scope and enabling result checks are part of the work. A chat entry point alone is not enough to complete tasks automatically.

ChatGPT and Codex on my phone are also entry points I want to use. What they can do depends on which environments and tools are actually connected. Ultimately, I want to focus on goals, missing information and tradeoffs, gradually moving appropriate execution work into the cloud.

## Help it understand what I am working on

If I have to explain project background from scratch every time I open my phone, this arrangement will still be exhausting.

I need to organize what I am working on, where the relevant materials are, which decisions have been made and what remains unfinished.

I currently use Intent for inputs, projects, tasks and actions, and OpenViking for shared memory, knowledge and skills. Intent helps me find current work; OpenViking helps connected assistants retrieve background and working methods.

For environment maintenance, for example, the assistant can consult deployment materials to find the host, configuration and data locations. For a project, it should find the existing materials and requirements rather than guessing from my latest sentence.

This also requires judgement. Being able to retain conversations does not make every sentence useful as long-term knowledge. What deserves maintenance is information that changes future actions: goals, preferences, important decisions, current state and reusable methods.

I created a maintenance skill for environment documentation, specifying that actual changes should update existing entries rather than append duplicate records. This addresses part of document maintenance; automatically extracted memory still needs outdated information to be discovered and corrected through use.

## Keep a complete desktop for direct work

Some work suits delegation through conversation; some is better handled by opening the software myself.

Complex interface changes, visual work requiring repeated inspection and software without tool integration may need a full desktop. The cloud desktop keeps an entry point where I can take over directly.

My plan is to send messages, review results and confirm direction on my phone, then enter Wuying when necessary to continue working on the same projects and materials. A small screen has limitations, and whether sustained detailed work is comfortable still needs practical testing.

Being able to find the environment and pick up where I left off already has value. What I want to reduce next is work that must wait until I return to one particular computer.

## Keep online work recoverable

When the working environment stays in the cloud, backup becomes part of daily use.

I can accept temporary service interruptions, but I want to recover deleted files and important content if the whole desktop is lost. I currently keep two backups: one on the cloud desktop and another on the Volcano Engine server, each retaining multiple historical versions.

The priority is content I create and the configuration and state needed for recovery. Software installers, dependencies and ordinary caches can be downloaded again; the entire system disk does not need copying.

I schedule backups for 4 a.m. and give them priority. Resource monitoring checks both machines at a low frequency, alerts through WeChat when problems persist and stays quiet when things are normal. This leaves more attention for the work itself.

## Start with one real piece of work

Once the environment exists, the important next step is using it.

My first step is concrete: query and update tasks through WeChat and confirm that the web interface shows the same results. Next, move frequently used projects and tools to the desktop, give an instruction from my phone, inspect the result and take over on the desktop if needed.

If you want to try this, choose one recurring activity, organize its materials, prepare a stable execution environment and connect the phone entry point. Complete that activity end to end before adding other work.

Doing all my work from a phone remains a goal. I am gradually building a daily routine where an idea can be communicated immediately, work can keep moving once started, and I can rejoin whenever needed, regardless of the device at hand.
