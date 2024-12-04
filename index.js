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

// router.post('/submit',async (req, res)=>{
  
// });
// router.post('/edit',async (req, res)=>{
  
// });


// router.get('/', async (req, res) => {
//   try {
//     const email = req.session?.user?.email; 
//     //what ever method is being used to recog the logged in ambass.change..
    

//     let responseData = {
//       currentUser: null,
//       topUsers: [],
//     };

    
    // const topUsers = await prisma.user.findMany({
    //   orderBy: {
    //     points: 'desc', // Order by points in descending order
    //   },
    //   take: 3,
    //   select: {
    //     name: true,
    //     points: true,
    //   },
    // });

    
//     if (email) {
      // const userData = await prisma.user.findUnique({
      //   where: { email: email }, // find user by email
      //   select: {
      //     id: true,
      //     name: true,
      //     collegeName: true,
      //     collegeYear: true,
      //     phone: true,
      //     points: true,
      //     tasks: true, 
      //   },
      // });

     
//       if (userData) {
//         responseData.currentUser = userData;
//       } else {
//         return res.status(404).json({ error: 'User not found' });
//       }
//     } else {
//       return res.status(400).json({ error: 'User email not found in session' });
//     }

//     // top three users
//     responseData.topUsers = topUsers;

//     // combined response
    // res.status(200).json(responseData);
//   } catch (error) {
    // console.error(error);
    // res.status(500).json({ error: 'An error occurred while fetching user data' });
//   }
// });



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
  const { taskId, submission,email } = req.body; 

  try {
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updatedTask = await prisma.task.updateMany({
      where: {
        id: taskId, 
        userId: user.id, 
      },
      data: {
        submission: submission,
        submitted:true,
        status:"submitted"
      },
    });

    if (updatedTask.count === 0) {
      return res.status(404).json({ error: 'Task not found for this user' });
    }

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
        points: 0, // Default points to 0
      },
    });

    // Fetch all existing tasks
    const existingTasks = await prisma.task.findMany({
      select: { 
        title: true, 
        description: true, 
        lastDate: true, 
        points: true 
      },
    });

    // If there are tasks, assign them to the new user
    if (existingTasks.length > 0) {
      const userTasks = existingTasks.map(task => ({
        title: task.title,
        description: task.description,
        lastDate: task.lastDate,
        points: task.points,
        submitted: false, // Default submitted to false
        submission: "",   // Default empty submission
        userId: newUser.id, // Associate with the new user's ID
      }));

      // Create tasks for the new user
      await prisma.task.createMany({
        data: userTasks,
      });
    }

    res.status(201).json({ message: 'User successfully registered!', user: newUser });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ error: 'Unable to add user' });
  }
});


router.get('/ping', (req, res) => {
  res.status(200).json({ message: 'Server is alive' });
});

router.post('/createTask', async (req, res) => {
  const { title, description, lastDate,points } = req.body;

  // Validate input
  if (!title || !description || !lastDate || !points) {
    return res.status(400).json({ error: 'Title, description, and lastDate are required' });
  }

  try {
    const taskData = {
      title,
      description,
      lastDate: new Date(lastDate), // Ensure lastDate is in Date format
      submitted: false,
      points,
      submission: "",
    };

    // Use a transaction to safely create and assign the task to all users
    await prisma.$transaction(async (prisma) => {
      const users = await prisma.user.findMany({ select: { id: true } });

      if (users.length === 0) {
        throw new Error("No users found to assign tasks.");
      }

      // Create task for each user
      const tasks = users.map(user => ({
        ...taskData,
        userId: user.id,
      }));

      await prisma.task.createMany({ data: tasks });
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
      // Assign points for a specific task to a specific user
      const updatedTask = await prisma.task.updateMany({
        where: {
          id: taskId,
          userId: userId,
        },
        data: {
          points: points, // Assign points to the task
        },
      });

      const updatedUser = await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          points: {
            increment: points, // Increment the user's points by the assigned points
          },
        },
      });

      if (updatedTask.count === 0) {
        return res.status(404).json({ error: 'Task not found for the specified user' });
      }

      return res.status(200).json({
        message: 'Points successfully assigned to the task!',
      });
    } else {
      // Get all user responses with tasks and their status
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



// Use the defined routes
app.use('/',router);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
