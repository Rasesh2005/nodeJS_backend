const { PrismaClient } = require("@prisma/client");
const dotenv = require('dotenv'); 
const express = require('express');
const router = express.Router();
const prisma=new PrismaClient();
const app = express();


const cors = require('cors');
// Enable CORS for all routes
app.use(cors());


dotenv.config(); 
const PORT = process.env.PORT || 8000;
app.use(express.json());


//profile userdata
router.get('/user', async (req, res) => {
  const { email } = req.query; // Extract email from query parameters
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  try {
    const userData = await prisma.user.findUnique({
      where: { email: email }, // Find user by email
      select: {
        id: true,
        name: true,
        collegeName: true,
        collegeYear: true,
        phone: true,
        points: true,
        tasks: true,
        // Add any other fields you want to include in the response
      },
    });
    if (userData) {
      return res.status(200).json(userData); // Return user data if found
    } else {
      return res.status(404).json({ error: 'User  not found' }); // User not found
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'An error occurred while fetching user data' });
  }
});

//leaderboard top 10
router.get('/getLeaderboard', async (req, res) => {
  try {
    const topUsers = await prisma.user.findMany({
      orderBy: {
        points: 'desc', 
      },
      take: 10,
      select: {
        name: true,
        points: true,
        collegeName:true,
      },
    });
    res.status(200).json(topUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching top user data' });
  }
});


//tasks section data 
router.get('/getTasks', async (req, res) => {
  const {userId} = req.query;  

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: User not logged in' });
  }

  try {
    const tasks = await prisma.task.findMany({
      where: { userId: Number(userId) },
      select: {
        id: true,
        title: true,
        lastDate: true,
        submitted:true,
        submission: true,
        description: true,
      },
    });
 
    const currentDate = new Date();
    
 
    const processedTasks = tasks.map(task => {
      let status = "Pending"; 

      if (!task.submitted && task.lastDate < currentDate) {
        status = "Missing";  // If no submission and the deadline has passed
      } else if (task.submitted) {
        status = "Submitted";  // If submission exists
      }

    
      return {
        id: task.id,
        title: task.title,
        description: task.description,
        status: status,  
        submitted: task.submitted, 
        lastDate: task.lastDate,  
      };
    });
    res.status(200).json(processedTasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'An error occurred while fetching tasks info' });
  }
});

// task section drive link submission
router.post('/submit', async (req, res) => {
  console.log("hello")
  const { taskId, submission, email } = req.body; 

  try {
    // Step 1: Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Step 2: Find the task by taskId and check if it's associated with the user
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { users: true }  // Including the users relation to check if the user is assigned to this task
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Step 3: Check if the user is associated with this task
    const isUserAssigned = task.users.some(u => u.id === user.id);

    if (!isUserAssigned) {
      return res.status(400).json({ error: 'User is not assigned to this task' });
    }

    // Step 4: Update the task's submission and status for this user
    await prisma.task.update({
      where: { id: taskId },
      data: {
        submission: submission,
        submitted: true,
        status: "submitted",
        users: {
          update: {
            where: { id: user.id },
            data: {
              // You could potentially update additional data in the junction table if needed
            },
          },
        },
      },
    });

    res.status(200).json({
      message: 'Task submission updated successfully.',
    });
  } catch (error) {
    console.error('Error updating task submission:', error);
    res.status(500).json({ error: 'An error occurred while updating the task submission.' });
  }
});




router.post('/update', async (req, res) => {
    const { id, name, collegeName, collegeYear, phone } = req.body;

    try {
        
        const updatedUser = await prisma.user.update({
            where: { id: id }, // finding user by id
            data: {
                name: name,
                collegeName: collegeName,
                collegeYear: collegeYear,
                phone: phone,
            },
        });

        res.json(updatedUser); // Return the updated user data
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Unable to update user' });
    }
});


router.post('/register', async (req, res) => {
  const {
    name,
    collegeName,
    collegeYear,
    program,
    phone,
    email,
    POR,
    reasonToJoin,
    roleInStudentBody,
    skills,
    experience,
    roleInEcell,
    hours,
    contribution,
    motivation
  } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      console.log("User found");
      return res.status(400).json({ error: 'You have already submitted the form', user: existingUser });
    }

    // Create a new user
    const newUser = await prisma.user.create({
      data: {
        name,
        collegeName,
        collegeYear,
        program,
        phone,
        email,
        POR,
        reasonToJoin,
        roleInStudentBody,
        skills,
        experience,
        roleInEcell,
        hours,
        contribution,
        motivation,
        points: 0, 
        
      },
    });

    const activeTasks = await prisma.task.findMany();

    for (const task of activeTasks) {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          user: {
            connect: { id: newUser.id },
          },
        },
      });
    }

    res.status(201).json({ message: 'User successfully registered and tasks assigned!', user: newUser });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ error: 'Unable to add user' });
  }
});


router.get('/ping', (req, res) => {
  res.status(200).json({ message: 'Server is alive' });
});

router.post('/createTask', async (req, res) => {
  const { title, description, lastDate, points } = req.body;

  // Validate input
  if (!title || !description || !lastDate || !points) {
    return res.status(400).json({ error: 'Title, description, lastDate, and points are required' });
  }

  try {
    // Convert lastDate to Date format and ensure points are numbers
    const taskData = {
      title,
      description,
      lastDate: new Date(lastDate), // Ensure lastDate is in Date format
      points: Number(points),
      submitted: false,
      submission:''
    };

    // Create a task
    const task = await prisma.task.create({
      data: taskData,
    });

    // Get all users
    const users = await prisma.user.findMany({ select: { id: true } });

    if (users.length === 0) {
      return res.status(400).json({ error: 'No users found to assign tasks.' });
    }

    // Associate the created task with all users
    await prisma.task.update({
      where: { id: task.id },
      data: {
        users: {
          connect: users.map(user => ({ id: user.id })), // Connect each user to the task
        },
      },
    });

    res.status(201).json({ message: 'Task successfully created and assigned to all users!' });
  } catch (error) {
    console.error('Error creating tasks:', error);
    res.status(500).json({ error: 'An error occurred while creating tasks' });
  }
});


router.post('/admin/tasks', async (req, res) => {
  const { taskId, userId, points } = req.body; // Extract data from the request body

  try {
    if (taskId && userId && points) {
      // Step 1: Update the user-task junction table to assign points to the user-task relation
      const updatedUserTask = await prisma.user.updateMany({
        where: {
          id: userId,
          tasks: {
            some: {
              id: taskId, // Ensure the user has the task
            },
          },
        },
        data: {
          tasks: {
            update: {
              where: {
                id: taskId,
              },
              data: {
                points: points, // Assign points to the task-user relationship in the junction table
              },
            },
          },
        },
      });

      // Step 2: Update the user's total points (if needed)
      const updatedUser = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          points: {
            increment: points, // Increment the user's total points
          },
        },
      });

      if (updatedUserTask.count === 0) {
        return res.status(404).json({ error: 'Task not found for the specified user' });
      }

      return res.status(200).json({
        message: 'Points successfully assigned to the user-task relation!',
      });
    } else {
      // If no taskId, userId, or points provided, return all users' responses
      const userResponses = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          collegeName: true,
          points: true,
          tasks: {
            select: {
              id: true,
              title: true,
              submission: true,
              submitted: true,
              points: true,
            },
          },
        },
      });

      // Format responses and count completed tasks
      const formattedResponses = userResponses.map(user => {
        const completedTasksCount = user.tasks.filter(task => task.submitted).length;

        return {
          userId: user.id,
          userName: user.name,
          collegeName: user.collegeName,
          totalPoints: user.points,
          completedTasksCount, // Number of completed tasks
          tasks: user.tasks.map(task => ({
            taskId: task.id,
            taskTitle: task.title,
            submission: task.submission,
            submitted: task.submitted,
            taskPoints: task.points || 0,
          })),
        };
      });

      // Sort users by completed tasks count in descending order
      formattedResponses.sort((a, b) => b.completedTasksCount - a.completedTasksCount);

      return res.status(200).json(formattedResponses);
    }
  } catch (error) {
    console.error('Error in admin tasks endpoint:', error);
    res.status(500).json({ error: 'An error occurred while processing the request' });
  }
});


// Endpoint to get earlier tasks with submission count
router.get('/Tasks', async (req, res) => {
  try {
    // Fetch all tasks but ensure only unique tasks are returned
    const tasks = await prisma.task.findMany({
      distinct: ['id'],  // Ensures each task is returned only once based on task ID
    });
  console.log(tasks)
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'An error occurred while fetching tasks' });
  }
});




router.put('/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const { title, description, lastDate } = req.body;

  try {
    const updatedTask = await prisma.task.update({
      where: { id: Number(taskId) },
      data: {
        title,
        description,
        lastDate: lastDate ? new Date(lastDate) : undefined,
      },
    });

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Unable to update task' });
  }
});

router.delete('/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params;

  try {
    await prisma.task.delete({
      where: { id: Number(taskId) },
    });

    res.status(200).json({ message: 'Task successfully deleted' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Unable to delete task' });
  }
});

router.post('/checkAdminEmail', async (req, res) => {
  const { email } = req.body;

  try {
    // Check if an admin exists with the given email
    const admin = await prisma.admin.findUnique({
      where: { email: email },
    });

    // If an admin with the given email exists, return true, otherwise false
    if (admin) {
      return res.status(200).json({ isAdmin: true });
    } else {
      return res.status(200).json({ isAdmin: false });
    }
  } catch (error) {
    console.error('Error checking admin email:', error);
    res.status(500).json({ error: 'An error occurred while checking the admin email' });
  }
});




// Use the defined routes
app.use('/',router);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
