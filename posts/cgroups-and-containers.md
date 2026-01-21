# How cgroups and some kernel hacks actually made containers

If you have ever used docker you probably know containers are like lightweight virtual machines or whatever. You might even know they use namespaces and cgroups under the hood. But if you are coming from a C or systems background you realize pretty quickly that "Container" isn't even a thing in the Linux Kernel.

Like there is no struct container in the source code. It is just a bunch of clever tricks to make a process feel isolated. It is basically chroot on steroids. Here is how it actually went down at the hard disk and kernel level.

## It started with a budget (cgroups)

Back in 2006 some engineers at Google were trying to run thousands of jobs on their servers. They didn't want the overhead of a full VM but they needed a way to stop one process from hogging all the RAM or CPU.

They built something called Process Containers which later got renamed to cgroups. Think of it as the accounting department for the OS. It is all about managing resource "quantity." In Linux, everything is a file. To manage cgroups, you don't call a single set_limit() function. Instead, you mount a pseudo-filesystem (usually at /sys/fs/cgroup) and literally write strings into files to tell the kernel what to do

Cgroups are organized in a tree structure. You can create a "Child" group that inherits or further restricts the "Parent" group.

The Root: Every process starts in the root cgroup.

The Slice: When you run a container, the runtime (like Docker) creates a new directory in that filesystem.

The Leaf: The specific PIDs of your application are moved into that directory.

The kernel uses these to set specific limits:

* **Memory:** You can set "hard limits" where the kernel just kills your process if it goes over. There are also "soft limits" where the kernel just tries to take some memory back if the system gets stressed.
* **CPU:** The kernel doesn't really understand "10% CPU" because CPU usage is binary—a core is either executing instructions or it isn't. Instead, it uses CFS (Completely Fair Scheduler) Periods.

You’ll see two main files in /sys/fs/cgroup/cpu/:

cpu.cfs_period_us (The total window of time (usually 100ms)) and cpu.cfs_quota_us (How much of that window your process gets to use).

If you set the period to 100ms and the quota to 20ms, your process can blast at 100% speed for 20ms, but then the kernel throttles it (literally unschedules it) for the remaining 80ms of that period.

* **The Freezer:** It is basically a really powerful SIGSTOP. You can actually "freeze" an entire container. It pauses everything and you can resume it later and the processes have no clue they were even stopped.

If you ever look at `/sys/fs/cgroup` you can see exactly how the kernel is keeping score.

## The VR headset for processes (Namespaces)

cgroups handle the money but Namespaces handle the "quality" or the view. When you use the clone syscall with certain flags you are basically putting a VR headset on a process.

* **PID Namespace:** The process only sees others in the same container. It thinks it is PID 1.
* **Network Namespace:** It gets its own private IP and routing tables.
* **User Namespace:** This is huge for security. You can be "root" inside the container but just a normal unprivileged user on the host system.

```c
// Using clone to create a new process with its own namespaces
// This is basically the "DNA" of a container
int container_pid = clone(container_main, container_stack + STACK_SIZE, 
                          CLONE_NEWUTS | CLONE_NEWPID | CLONE_NEWNS | SIGCHLD, NULL);

```

## Trapping it on the disk

How do you keep a process from seeing the rest of the hard drive?

Most people think of chroot but that is old and actually pretty easy to break out of if you know what you are doing. Modern containers use pivot_root instead. It basically takes the current root of the filesystem and swaps it with a new folder then it unmounts the old one. Once that happens the process literally cannot see "up" anymore. It is locked in that folder and as far as it knows that folder is the entire world.

```c
// A simplified look at how pivot_root moves the goalposts
// Make the new root directory a mount point so the kernel is happy
mount(rootfs, rootfs, "bind", MS_BIND | MS_REC, NULL);

// Create a temporary place to stash the old root system
mkdir(put_old, 0700);

// The magic swap: new root becomes / and old root goes into put_old
pivot_root(rootfs, put_old);

// Move the current working directory to our new world
chdir("/");

// Unmount the old root so the process can't even see the old files anymore
umount2(put_old, MNT_DETACH);

```

## Stacking the file system (Copy-on-Write)

The final piece of the puzzle is how we don't waste terabytes of space. If every container had its own copy of Ubuntu your disk would be full in an hour.

Instead we use Copy-on-Write (CoW). It is like stacking layers of glass. The bottom layer is the OS and it is read only. Your app sits in a layer on top. When the app writes a file the kernel doesn't change the bottom layer it just writes the change to the top one. This is why containers start instantly and share disk space through layered images.

## The recipe

So if you wanted to build a container from scratch in C without using Docker you would just:

1. Use clone to create the namespaces
2. Use pivot_root to lock it in a folder
3. Write some limits to the cgroup files (memory, cpu, freezer)
4. Run your code

That is all a container is. A process that is lonely because of namespaces, on a budget because of cgroups and trapped in a folder because of pivot_root.

## References

Check out this video if you want to hear it from the devs themselves:
- [Cgroups, Namespaces, and the Genesis of Containers](https://www.youtube.com/watch?v=sK5i-N34im8)
