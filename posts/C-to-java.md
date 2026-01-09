Coming from a C background where you have a lot of control over how your program interacts with the hardware (for better or for worse), learning JAVA oops concept always felt like a **BIG black box** to me where I was being taught concepts but I always felt like I was actually trying to remember stuff rather than understanding.

So I dived in to understand how JAVA or the Java virtual machine works to implement the magical oops concepts which give it an edge over languages like C where you would have to manually implement those from scratch.

### Objects

The first thing you learn about in Java is objects. It is an “instance” or an “entity” which has its own set of data and behaviour which it gets from its class. In C terms its just a struct which some metadata. When you define a class in Java, the JVM allocates memory similar to a `malloc()` call. However, every Java object has an **Object Header** (often called the "Mark Word" and "Klass Pointer") before the actual data fields. (we will come to this later)

---

## The four principles of OOP

### 1. Encapsulation

Encapsulation means tying up the data and attributes of a class and restricting direct access from outside the class using access modifiers. In java when you mark a field as `private`, you aren't building a physical wall in the RAM to stop the program from actually accessing the data, instead:

* **At Compile Time:** `javac` acts like a strict TA. If you try to access a private field, it fails your build.
* **At Runtime:** The JVM doesn't care about "private." It just calculates a **Base Pointer + Offset**.

If my `Player` object starts at address `0x1000` and the `health` field is at **Offset 12**, the CPU just fetches `*(0x1000 + 12)`. Encapsulation is just a "permission check" at the source code level; under the hood, it’s just pointer arithmetic. You actually can bypass encapsulation in Java using **Reflection**, which allows you to find a private field by name and call `.setAccessible(true)`.

I also wondered *Why even allow this?* But it is needed for some frameworks and is a deep dive for a separate blog.

### 2. Inheritance

It is where a Class (lets say `ChildClass`) inherits some properties from another class (`ParentClass`). How does a Child class inherit from a Parent? Simple: **Memory Nesting**.

In Java, the memory layout of a child class starts with the exact fields of the parent class, followed by its own new fields. This is why you can upcast a Child to a Parent—the starting address is identical, and the parent-level offsets still work perfectly.

### 3. Polymorphism and Abstraction

This was an interesting deep dive for me as I did not know how Polymorphism can work in C. Basically it is done using function pointers and manually handling them, but in JAVA it is automated, using a **vtable (Virtual Method Table)**.

* Each Class has a vtable (an array of function pointers).
* Every Object has a pointer in its header (the **Klass Pointer**) pointing to that vtable.

Imagine a base class `Shape` and a child class `Circle`:

```java
class Shape {
    void draw() { ... }    // vtable Slot 0
    void move() { ... }    // vtable Slot 1
}

class Circle extends Shape {
    @Override 
    void draw() { ... }    // vtable Slot 0 (Overridden)
    void radius() { ... }  // vtable Slot 2 (New method)
}

```

Crucially, the `draw` method is always at **Slot 0** for every subclass of Shape. When you write this in Java:

```java
Shape s = new Circle(); 
s.draw();

```

The compiler (`javac`) looks at the reference type (`Shape` in the above example). So if `s` points to a `Shape` object, index `[0]` contains the address of `Shape.draw()`. If `s` points to a `Circle` object, index `[0]` contains the address of `Circle.draw()`.

**What about Interfaces?** This is where Java gets "messier". Since a class can implement multiple interfaces, a method might be at Slot 2 in one class but Slot 5 in another. To solve this, Java uses an **itable (Interface Table)**. Instead of a direct index jump, it has to do a quick search: *"Hey, does Class A implement Interface B? If yes, where is its table?"* This is slightly slower than a vtable call, which is why the HotSpot JVM spends a lot of energy optimizing these calls into "Direct Jumps" once it sees the same object type passing through repeatedly.

* **From a C pov:** `vtable` = Array of function pointers (extremely fast).
* **itable** = Hash map or Searchable list of function pointers (slightly slower).

---

## Memory Management

In C, you decide whether a variable lives on the stack (`int x`) or heap (`malloc`). In Java:

* **Primitives** inside methods live on the **Stack**.
* **All Objects** live on the **Heap**.
* **References** (the pointers themselves) live on the **Stack**.

If you write `MyClass obj = new MyClass();`, in C terms, you are doing: `MyClass* obj = (MyClass*)gc_malloc(sizeof(MyClass));`

The **Garbage Collector (GC)** replaces `free()`. It scans the stack for "Root" pointers, follows them to the heap, and marks everything it can reach. Anything not marked is considered "garbage" and its memory is reclaimed.

### Fragmentation and Relocation

Garbage Collector also manages Fragmentation! In C, after many `malloc` and `free` calls, your heap starts looking like Swiss cheese. Most Java Garbage Collectors (like G1 or ZGC) are **Relocating Collectors**. When the heap gets messy, the GC stops your threads (briefly), finds the "live" objects, and slides them all to one side of the memory, packed tightly together.

This seems broken, like it can mess up the addresses and can cause dangling issues but it doesn’t. In Java, you don't have pointers; you have **References**. A reference is a "handle" managed by the JVM. There are two main ways the JVM handles this:

1. **Handle Table (Early JVMs):** Your reference didn't point to the object but it pointed to a stable entry in a table. That table entry then pointed to the object. If the object moved, the JVM only had to update the pointer in the table. This was easy but every memory access requires two jumps.
2. **Oop-Map Patching (Modern JVMs like HotSpot):** Allows references to point directly to the object's memory address for maximum speed (just like C).

**How they move it:**

* **Stop the World:** The JVM pauses your code.
* **Scan the Stacks:** The JVM knows exactly where every reference is located on every thread's stack (using metadata called **Oop-Maps**).
* **Move & Patch:** It moves the object to a new address. Then, it immediately goes through the stacks and registers and "patches" every single reference to point to the new address.
* **Resume:** Your code continues, unaware that the memory address in its registers just changed.

This defragging makes allocating objects faster than `malloc` in C! In C, the system has to search a "Free List" to find a hole big enough for your struct. This is  or . In Java, the JVM just looks at a pointer called `next_free`. It gives you the memory at that address and "bumps" the pointer forward by the size of your object. This is .
