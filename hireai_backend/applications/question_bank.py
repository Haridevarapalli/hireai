"""
Pre-seeded question bank for HR and Technical assessments.
In production, these would come from an AI or a comprehensive database.
"""

HR_QUESTIONS = [
    {
        'prompt': 'Tell us about a time when you had to work under pressure. How did you handle it?',
        'options': [
            'I panicked and missed the deadline',
            'I prioritized tasks, stayed focused, and delivered on time',
            'I delegated everything to my teammates',
            'I avoided the situation entirely',
        ],
        'correct_option': 1,
        'tags': ['behavioral', 'stress-management'],
        'explanation': 'The best response demonstrates composure and effective prioritization under pressure.',
    },
    {
        'prompt': 'How do you handle disagreements with team members?',
        'options': [
            'I avoid confrontation at all costs',
            'I insist on my viewpoint until others agree',
            'I listen to their perspective, discuss constructively, and find common ground',
            'I escalate immediately to management',
        ],
        'correct_option': 2,
        'tags': ['teamwork', 'conflict-resolution'],
        'explanation': 'Constructive dialogue and active listening are key to resolving disagreements.',
    },
    {
        'prompt': 'Describe your approach to learning new technologies.',
        'options': [
            'I wait until I\'m forced to learn',
            'I actively seek out resources, build projects, and practice regularly',
            'I only learn from official documentation',
            'I rely entirely on team members to teach me',
        ],
        'correct_option': 1,
        'tags': ['self-improvement', 'initiative'],
        'explanation': 'Proactive learning through diverse resources shows initiative and growth mindset.',
    },
    {
        'prompt': 'What motivates you in your professional career?',
        'options': [
            'Only the salary matters',
            'Solving challenging problems and continuous growth',
            'Having the easiest possible workload',
            'Working fewer hours',
        ],
        'correct_option': 1,
        'tags': ['motivation', 'career-goals'],
        'explanation': 'Intrinsic motivation through challenges and growth indicates long-term engagement.',
    },
    {
        'prompt': 'How do you prioritize tasks when you have multiple deadlines?',
        'options': [
            'I work on whatever feels most interesting',
            'I assess urgency and importance, then create a structured plan',
            'I try to do everything simultaneously',
            'I ask someone else to decide for me',
        ],
        'correct_option': 1,
        'tags': ['time-management', 'organization'],
        'explanation': 'Using urgency-importance matrices demonstrates strong organizational skills.',
    },
    {
        'prompt': 'Describe a situation where you failed and what you learned from it.',
        'options': [
            'I have never failed at anything',
            'I failed but blamed others for it',
            'I acknowledged the failure, analyzed what went wrong, and applied the lessons going forward',
            'I tried to hide the failure',
        ],
        'correct_option': 2,
        'tags': ['self-awareness', 'resilience'],
        'explanation': 'Acknowledging failures and learning from them shows maturity and growth mindset.',
    },
    {
        'prompt': 'How do you ensure effective communication in a remote team?',
        'options': [
            'I send emails and hope they read them',
            'I use regular check-ins, clear documentation, and multiple communication channels',
            'I only communicate when absolutely necessary',
            'I prefer to work in isolation',
        ],
        'correct_option': 1,
        'tags': ['communication', 'remote-work'],
        'explanation': 'Proactive communication with multiple channels ensures team alignment.',
    },
    {
        'prompt': 'What is your approach to giving and receiving feedback?',
        'options': [
            'I avoid giving feedback to avoid conflict',
            'I give honest, constructive feedback and am open to receiving it',
            'I only give positive feedback',
            'I take negative feedback personally',
        ],
        'correct_option': 1,
        'tags': ['feedback', 'professional-growth'],
        'explanation': 'Constructive feedback exchange drives team improvement and personal growth.',
    },
    {
        'prompt': 'How do you stay updated with industry trends?',
        'options': [
            'I don\'t follow industry trends',
            'I read tech blogs, attend conferences, and participate in communities',
            'I only rely on what my company teaches me',
            'I follow social media influencers exclusively',
        ],
        'correct_option': 1,
        'tags': ['continuous-learning', 'industry-awareness'],
        'explanation': 'Multiple learning channels keep professionals current with evolving technologies.',
    },
    {
        'prompt': 'Describe your ideal work environment.',
        'options': [
            'Wherever there is no accountability',
            'A collaborative environment with clear goals, mentorship, and growth opportunities',
            'A place with minimal work expectations',
            'Somewhere I can work completely alone',
        ],
        'correct_option': 1,
        'tags': ['culture-fit', 'teamwork'],
        'explanation': 'Seeking collaboration and growth indicates alignment with progressive work cultures.',
    },
    {
        'prompt': 'How do you manage work-life balance?',
        'options': [
            'I work all the time without breaks',
            'I set boundaries, schedule downtime, and maintain hobbies outside work',
            'I do the bare minimum at work',
            'Balance isn\'t important to me',
        ],
        'correct_option': 1,
        'tags': ['work-life-balance', 'self-care'],
        'explanation': 'Healthy boundaries prevent burnout and maintain long-term productivity.',
    },
    {
        'prompt': 'What role do you typically take in team projects?',
        'options': [
            'I avoid participating if possible',
            'I adapt to what the team needs — leader, contributor, or mediator',
            'I always insist on being the leader',
            'I let others do the work',
        ],
        'correct_option': 1,
        'tags': ['teamwork', 'adaptability'],
        'explanation': 'Adaptability in team roles shows versatility and collaborative spirit.',
    },
]


TECH_QUESTIONS = {
    'Python': [
        {
            'prompt': 'What is the output of: print(type([]) is list)?',
            'options': ['True', 'False', 'Error', 'None'],
            'correct_option': 0,
            'tags': ['python', 'types'],
            'explanation': 'The `type()` function returns the type of an object. `type([])` returns `<class \'list\'>` which is `list`.',
        },
        {
            'prompt': 'Which keyword is used to create a generator in Python?',
            'options': ['return', 'yield', 'generate', 'iter'],
            'correct_option': 1,
            'tags': ['python', 'generators'],
            'explanation': '`yield` creates a generator function that produces values lazily.',
        },
        {
            'prompt': 'What is the difference between a list and a tuple in Python?',
            'options': [
                'Lists are immutable, tuples are mutable',
                'Lists are mutable, tuples are immutable',
                'Both are mutable',
                'Both are immutable',
            ],
            'correct_option': 1,
            'tags': ['python', 'data-structures'],
            'explanation': 'Lists can be modified after creation (mutable), while tuples cannot (immutable).',
        },
        {
            'prompt': 'What does the `__init__` method do in a Python class?',
            'options': [
                'Destroys the object',
                'Initializes the object when it is created',
                'Creates a static method',
                'Defines a class variable',
            ],
            'correct_option': 1,
            'tags': ['python', 'oop'],
            'explanation': '`__init__` is the constructor method called when a new instance is created.',
        },
        {
            'prompt': 'What is a decorator in Python?',
            'options': [
                'A design pattern for databases',
                'A function that modifies the behavior of another function',
                'A type of loop',
                'A data structure',
            ],
            'correct_option': 1,
            'tags': ['python', 'advanced'],
            'explanation': 'Decorators wrap functions to extend their behavior without modifying their code.',
        },
        {
            'prompt': 'What is the GIL in Python?',
            'options': [
                'Global Internet Lock',
                'Global Interpreter Lock — prevents true multi-threading for CPU-bound tasks',
                'A garbage collection mechanism',
                'A package manager',
            ],
            'correct_option': 1,
            'tags': ['python', 'concurrency'],
            'explanation': 'The GIL is a mutex that protects access to Python objects, limiting multi-threaded CPU parallelism.',
        },
        {
            'prompt': 'Which of the following is NOT a valid way to create a dictionary in Python?',
            'options': [
                "d = {'key': 'value'}",
                'd = dict(key="value")',
                'd = dict([("key", "value")])',
                'd = ["key": "value"]',
            ],
            'correct_option': 3,
            'tags': ['python', 'data-structures'],
            'explanation': 'Square brackets create lists, not dictionaries. Dictionaries use curly braces or dict().',
        },
        {
            'prompt': 'What is list comprehension in Python?',
            'options': [
                'A method to delete list items',
                'A concise way to create lists using a single expression',
                'A way to sort lists',
                'A debugging technique',
            ],
            'correct_option': 1,
            'tags': ['python', 'syntax'],
            'explanation': 'List comprehensions provide a readable, concise syntax: [x for x in range(10)].',
        },
        {
            'prompt': 'What is the purpose of `self` in Python class methods?',
            'options': [
                'It refers to the class itself',
                'It refers to the instance of the class',
                'It is a keyword for static methods',
                'It has no purpose',
            ],
            'correct_option': 1,
            'tags': ['python', 'oop'],
            'explanation': '`self` refers to the current instance, allowing access to its attributes and methods.',
        },
        {
            'prompt': 'What will `print(2 ** 3 ** 2)` output?',
            'options': ['64', '512', '8', '81'],
            'correct_option': 1,
            'tags': ['python', 'operators'],
            'explanation': 'Exponentiation is right-associative: 3**2 = 9, then 2**9 = 512.',
        },
    ],
    'Java': [
        {
            'prompt': 'Which of the following is NOT a primitive data type in Java?',
            'options': ['int', 'boolean', 'String', 'char'],
            'correct_option': 2,
            'tags': ['java', 'types'],
            'explanation': 'String is a class (reference type), not a primitive data type in Java.',
        },
        {
            'prompt': 'What is the purpose of the `final` keyword in Java?',
            'options': [
                'Makes a variable mutable',
                'Prevents a variable from being reassigned, a method from being overridden, or a class from being subclassed',
                'Declares a constructor',
                'Creates a loop',
            ],
            'correct_option': 1,
            'tags': ['java', 'keywords'],
            'explanation': '`final` prevents modification: final variables cannot be reassigned, final methods cannot be overridden.',
        },
        {
            'prompt': 'What is the difference between == and .equals() in Java?',
            'options': [
                'They are identical',
                '== compares references, .equals() compares content',
                '== compares content, .equals() compares references',
                '.equals() only works with primitives',
            ],
            'correct_option': 1,
            'tags': ['java', 'comparison'],
            'explanation': '== checks reference equality (same object), .equals() checks logical equality (same content).',
        },
        {
            'prompt': 'Which collection class in Java maintains insertion order and allows duplicates?',
            'options': ['HashSet', 'ArrayList', 'HashMap', 'TreeSet'],
            'correct_option': 1,
            'tags': ['java', 'collections'],
            'explanation': 'ArrayList maintains insertion order and allows duplicate elements.',
        },
        {
            'prompt': 'What is an interface in Java?',
            'options': [
                'A class that cannot be instantiated',
                'A contract that defines methods a class must implement',
                'A type of loop',
                'A data structure',
            ],
            'correct_option': 1,
            'tags': ['java', 'oop'],
            'explanation': 'Interfaces define method signatures that implementing classes must provide.',
        },
        {
            'prompt': 'What is garbage collection in Java?',
            'options': [
                'Manually deleting objects',
                'Automatic memory management that reclaims unused objects',
                'A sorting algorithm',
                'File cleanup utility',
            ],
            'correct_option': 1,
            'tags': ['java', 'memory'],
            'explanation': 'Java\'s GC automatically identifies and removes objects no longer referenced.',
        },
        {
            'prompt': 'What does the `static` keyword mean in Java?',
            'options': [
                'The member belongs to the class rather than instances',
                'The member is private',
                'The member is immutable',
                'The member is deprecated',
            ],
            'correct_option': 0,
            'tags': ['java', 'keywords'],
            'explanation': 'Static members belong to the class itself, shared across all instances.',
        },
        {
            'prompt': 'What is the difference between an abstract class and an interface?',
            'options': [
                'They are the same thing',
                'Abstract classes can have implementations and state; interfaces define contracts',
                'Interfaces can have constructors',
                'Abstract classes cannot have methods',
            ],
            'correct_option': 1,
            'tags': ['java', 'oop'],
            'explanation': 'Abstract classes can have implemented methods and fields; interfaces (pre-Java 8) only define method signatures.',
        },
        {
            'prompt': 'What exception is thrown when accessing an array index out of bounds?',
            'options': [
                'NullPointerException',
                'ArrayIndexOutOfBoundsException',
                'ClassCastException',
                'StackOverflowError',
            ],
            'correct_option': 1,
            'tags': ['java', 'exceptions'],
            'explanation': 'ArrayIndexOutOfBoundsException is thrown when the index is negative or >= array length.',
        },
        {
            'prompt': 'Which keyword is used to handle exceptions in Java?',
            'options': ['throw', 'try-catch', 'error', 'handle'],
            'correct_option': 1,
            'tags': ['java', 'exceptions'],
            'explanation': 'try-catch blocks are used to handle exceptions in Java.',
        },
    ],
    'JavaScript': [
        {
            'prompt': 'What is the difference between `let`, `const`, and `var` in JavaScript?',
            'options': [
                'They are all the same',
                '`var` is function-scoped; `let` and `const` are block-scoped; `const` cannot be reassigned',
                '`let` is global, `var` is local',
                '`const` can be reassigned',
            ],
            'correct_option': 1,
            'tags': ['javascript', 'variables'],
            'explanation': '`var` is function-scoped with hoisting. `let`/`const` are block-scoped; `const` prevents reassignment.',
        },
        {
            'prompt': 'What does `===` do in JavaScript?',
            'options': [
                'Assignment',
                'Strict equality — checks both value and type',
                'Loose equality — checks only value',
                'Bitwise comparison',
            ],
            'correct_option': 1,
            'tags': ['javascript', 'operators'],
            'explanation': '`===` checks both value and type without type coercion, unlike `==`.',
        },
        {
            'prompt': 'What is a closure in JavaScript?',
            'options': [
                'A way to close browser tabs',
                'A function that has access to variables from its outer scope even after the outer function has returned',
                'A type of loop',
                'An error handling mechanism',
            ],
            'correct_option': 1,
            'tags': ['javascript', 'advanced'],
            'explanation': 'Closures allow inner functions to access outer scope variables, enabling data encapsulation.',
        },
        {
            'prompt': 'What is the event loop in JavaScript?',
            'options': [
                'A for loop that handles events',
                'A mechanism that processes the callback queue after the call stack is empty',
                'A method to create events',
                'A type of listener',
            ],
            'correct_option': 1,
            'tags': ['javascript', 'async'],
            'explanation': 'The event loop enables non-blocking I/O by processing callbacks when the call stack is clear.',
        },
        {
            'prompt': 'What is a Promise in JavaScript?',
            'options': [
                'A data structure',
                'An object representing the eventual result of an asynchronous operation',
                'A type of variable',
                'A loop construct',
            ],
            'correct_option': 1,
            'tags': ['javascript', 'async'],
            'explanation': 'Promises represent async operations that will resolve with a value or reject with an error.',
        },
        {
            'prompt': 'What does `Array.prototype.map()` do?',
            'options': [
                'Sorts the array',
                'Creates a new array by applying a function to each element',
                'Filters elements',
                'Finds the first matching element',
            ],
            'correct_option': 1,
            'tags': ['javascript', 'arrays'],
            'explanation': '`map()` transforms each element and returns a new array without modifying the original.',
        },
        {
            'prompt': 'What is `this` in JavaScript?',
            'options': [
                'Always refers to the global object',
                'Refers to the context in which a function is called',
                'A reserved keyword that cannot be used',
                'Refers to the previous function',
            ],
            'correct_option': 1,
            'tags': ['javascript', 'context'],
            'explanation': '`this` is dynamic and depends on how a function is invoked (call-site binding).',
        },
        {
            'prompt': 'What is the difference between `null` and `undefined` in JavaScript?',
            'options': [
                'They are identical',
                '`undefined` means a variable is declared but not assigned; `null` is an intentional absence of value',
                '`null` is for numbers only',
                '`undefined` is an error',
            ],
            'correct_option': 1,
            'tags': ['javascript', 'types'],
            'explanation': '`undefined` is the default for uninitialized variables; `null` is explicitly assigned to represent "no value".',
        },
        {
            'prompt': 'What is destructuring in JavaScript?',
            'options': [
                'Deleting objects',
                'A syntax to unpack values from arrays or properties from objects',
                'A way to destroy event listeners',
                'Memory cleanup',
            ],
            'correct_option': 1,
            'tags': ['javascript', 'es6'],
            'explanation': 'Destructuring provides concise syntax to extract values: `const {a, b} = obj;`',
        },
        {
            'prompt': 'What does `async/await` do in JavaScript?',
            'options': [
                'Makes code run faster',
                'Provides syntactic sugar for working with Promises in a synchronous-looking style',
                'Creates multiple threads',
                'Handles errors automatically',
            ],
            'correct_option': 1,
            'tags': ['javascript', 'async'],
            'explanation': '`async/await` makes asynchronous code look synchronous, improving readability.',
        },
    ],
    'default': [
        {
            'prompt': 'What is the time complexity of binary search?',
            'options': ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
            'correct_option': 1,
            'tags': ['algorithms', 'search'],
            'explanation': 'Binary search halves the search space each step, giving O(log n) complexity.',
        },
        {
            'prompt': 'What is a REST API?',
            'options': [
                'A database query language',
                'An architectural style using HTTP methods for stateless client-server communication',
                'A programming language',
                'A type of server',
            ],
            'correct_option': 1,
            'tags': ['web', 'api'],
            'explanation': 'REST uses HTTP verbs (GET, POST, PUT, DELETE) for stateless resource manipulation.',
        },
        {
            'prompt': 'What is the purpose of version control (e.g., Git)?',
            'options': [
                'To compile code',
                'To track changes, collaborate, and manage code history',
                'To deploy applications',
                'To design user interfaces',
            ],
            'correct_option': 1,
            'tags': ['tools', 'git'],
            'explanation': 'Version control tracks every change, enables collaboration, and allows reverting to previous states.',
        },
        {
            'prompt': 'What is a database index?',
            'options': [
                'A type of table',
                'A data structure that improves the speed of data retrieval',
                'A primary key',
                'A type of query',
            ],
            'correct_option': 1,
            'tags': ['database', 'performance'],
            'explanation': 'Indexes create optimized lookup structures that speed up queries at the cost of write performance.',
        },
        {
            'prompt': 'What does SOLID stand for in software design?',
            'options': [
                'Simple, Open, Linked, Integrated, Designed',
                'Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion',
                'Secure, Optimized, Lightweight, Integrated, Deployed',
                'None of the above',
            ],
            'correct_option': 1,
            'tags': ['design-principles', 'oop'],
            'explanation': 'SOLID principles guide maintainable object-oriented design.',
        },
        {
            'prompt': 'What is the difference between SQL and NoSQL databases?',
            'options': [
                'They are the same',
                'SQL uses structured tables with schemas; NoSQL uses flexible document/key-value/graph models',
                'NoSQL is always faster',
                'SQL cannot handle large data',
            ],
            'correct_option': 1,
            'tags': ['database', 'architecture'],
            'explanation': 'SQL enforces schemas and relationships; NoSQL offers flexibility for unstructured data.',
        },
        {
            'prompt': 'What is CI/CD?',
            'options': [
                'A programming language',
                'Continuous Integration and Continuous Deployment — automating build, test, and deploy pipelines',
                'A database technology',
                'A version of CSS',
            ],
            'correct_option': 1,
            'tags': ['devops', 'automation'],
            'explanation': 'CI/CD automates the software delivery pipeline from code commit to production deployment.',
        },
        {
            'prompt': 'What is the difference between a stack and a queue?',
            'options': [
                'They are the same data structure',
                'Stack is LIFO (Last In First Out); Queue is FIFO (First In First Out)',
                'Stack is FIFO; Queue is LIFO',
                'Neither has a specific order',
            ],
            'correct_option': 1,
            'tags': ['data-structures', 'fundamentals'],
            'explanation': 'Stacks process the most recently added item first; queues process the oldest item first.',
        },
        {
            'prompt': 'What is an API endpoint?',
            'options': [
                'A physical server location',
                'A specific URL where an API can be accessed to perform operations',
                'A type of database',
                'A frontend component',
            ],
            'correct_option': 1,
            'tags': ['web', 'api'],
            'explanation': 'Endpoints are specific URLs that accept requests and return responses for API operations.',
        },
        {
            'prompt': 'What is the purpose of unit testing?',
            'options': [
                'Testing the entire application',
                'Testing individual components or functions in isolation',
                'Testing only the UI',
                'Testing server performance',
            ],
            'correct_option': 1,
            'tags': ['testing', 'quality'],
            'explanation': 'Unit tests verify individual functions/methods work correctly in isolation.',
        },
    ],
}


def get_hr_questions(count=10):
    """Return a random selection of HR questions."""
    import random
    questions = list(HR_QUESTIONS)
    random.shuffle(questions)
    return questions[:count]


def get_tech_questions(language='default', count=10):
    """Return tech questions for the given language."""
    import random
    lang_key = language if language in TECH_QUESTIONS else 'default'
    questions = list(TECH_QUESTIONS[lang_key])
    # Also add some default questions for variety
    if lang_key != 'default':
        questions.extend(TECH_QUESTIONS['default'][:3])
    random.shuffle(questions)
    return questions[:count]
