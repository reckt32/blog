If you have ever used docker you probably know containers are like lightweight virtual machines that feel like a virtual machine. But "Container" isn't even a thing in the Linux Kernel.

Like there is no struct container in the source code. It is just a bunch of clever tricks to make a process feel isolated. Here is how it actually went down at the hard disk and kernel level.

## It started with a budget

Back in 2006 some engineers at Google were trying to run thousands of jobs on their servers. They didn't want the overhead of a full VM but they needed a way to stop one process from hogging all the RAM or CPU.

They built something called Process Containers which later got renamed to cgroups. Think of it as the accounting department for the OS. It doesn't hide anything from the process it just tracks how much stuff it is using and throttles it if it goes over the limit. If you ever look at `/sys/fs/cgroup` you can see exactly how the kernel is keeping score.

## The VR headset for processes

cgroups handle the money but Namespaces handle the view. This is where it gets cool. When you use the clone syscall with certain flags you are basically putting a VR headset on a process.

If you give it a PID namespace it thinks it is PID 1. If you give it a network namespace it thinks it has its own private internet. It has no idea there are thousands of other processes running right next to it.

```c
// Using clone to create a new process with its own namespaces
// This is basically the "DNA" of a container
int container_pid = clone(container_main, container_stack + STACK_SIZE, 
                          CLONE_NEWUTS | CLONE_NEWPID | CLONE_NEWNS | SIGCHLD, NULL);

```

## Trapping it on the disk

This is the part I was most curious about. How do you keep a process from seeing the rest of the hard drive?

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

## Stacking the file system

The final piece of the puzzle is how we don't waste terabytes of space. If every container had its own copy of Ubuntu your disk would be full in an hour.

Instead we use OverlayFS. It is like stacking layers of glass. The bottom layer is the OS and it is read only. Your app sits in a layer on top. When the app writes a file the kernel doesn't change the bottom layer it just writes the change to the top one. It is called Copy-on-Write and it is the reason you can spin up a container in half a second.

## The recipe

So if you wanted to build a container from scratch in C without using Docker you would just:

1. Use clone to create the namespaces
2. Use pivot_root to lock it in a folder
3. Write some limits to the cgroup files
4. Run your code

That is all a container is. A process that is lonely because of namespaces, on a budget because of cgroups and trapped in a folder because of pivot_root.

## References

Check out this video if you want to hear it from the devs themselves:
- [Cgroups, Namespaces, and the Genesis of Containers](https://www.youtube.com/watch?v=sK5i-N34im8)
